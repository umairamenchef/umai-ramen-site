/**
 * Tests for scripts/menu-2026/translation-patches.mjs and apply-translations.mjs (Phase 14 / Plan 14-02).
 *
 *   node --test scripts/menu-2026/translation-patches.test.mjs
 *
 * Part 1: the pure planners on small inline fixtures (a 1-category / 2-item menu and the matching
 * Sanity-shaped documents).
 * Part 2: the CLI (`main` of apply-translations.mjs) end to end on an in-memory fake Sanity: no network,
 * the backups go to a temporary directory. This is the only place the write path runs before Plan 14-03.
 *
 * Real-file tests read menu-2026.json next to this file. They never assert that the real menu lacks
 * translations: they keep passing after Plan 14-03 merges the overlays into menu-2026.json.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { main, parseArgs } from './apply-translations.mjs';
import { TRANSLATION_LOCALES, formatMenuJson, mergeTranslations, translatableFields } from './translation-rules.mjs';
import {
  patchTargets,
  planTranslationPatches,
  planTranslationRollback,
  readLocaleObject,
  stripTranslations,
} from './translation-patches.mjs';

const nonBlank = (v) => typeof v === 'string' && v.trim() !== '';
const MENU_TEXT = readFileSync(new URL('./menu-2026.json', import.meta.url), 'utf8');
const realMenu = () => JSON.parse(MENU_TEXT);

// ── fixtures ───────────────────────────────────────────────────────────────────
const L = (fr, en, de, it, zh) => ({ fr, en, de, it, zh });

/** 1 category (name, description, footnote) + 2 items (name, description / name, subgroup, 1 price label) = 8 fields. */
function menuFixture() {
  return {
    version: 1,
    categories: [
      {
        key: 'entrees',
        section: 'food',
        name: L('Entrées', 'Starters', 'Vorspeisen', 'Antipasti', '小吃'),
        description: L('Pour commencer', 'To start', 'Zum Anfang', 'Per iniziare', '开胃菜'),
        footnote: L('Prix nets', 'Net prices', 'Nettopreise', 'Prezzi netti', '净价'),
        items: [
          {
            key: 'karaage',
            name: L('Karaage', 'Karaage', 'Karaage', 'Karaage', 'Karaage（日式炸鸡）'),
            description: L('Poulet frit', 'Fried chicken', 'Frittiertes Hähnchen', 'Pollo fritto', '炸鸡'),
            price: 7,
          },
          {
            key: 'trio-degustation',
            name: L('Trio dégustation', 'Tasting trio', 'Verkostungs-Trio', 'Trio degustazione', '清酒品鉴三杯'),
            subgroup: L('Au choix', 'Your choice', 'Zur Auswahl', 'A scelta', '任选其一'),
            prices: [{ label: L('3 × 6cl', '3 × 6cl', '3 × 6cl', '3 × 6cl', '3 × 6cl'), price: 18 }],
          },
        ],
      },
    ],
  };
}

const frLoc = (fr, type = 'localeString') => ({ _type: type, fr });

/** The matching Sanity documents as sync-menu.mjs wrote them: French only. */
function docsFixture() {
  return [
    {
      _id: 'm26-cat-entrees',
      _rev: 'rev-cat',
      _type: 'menuCategory',
      name: frLoc('Entrées'),
      description: frLoc('Pour commencer', 'localeText'),
      footnote: frLoc('Prix nets', 'localeText'),
      order: 10,
      section: 'food',
    },
    {
      _id: 'm26-item-karaage',
      _rev: 'rev-karaage',
      _type: 'menuItem',
      name: frLoc('Karaage'),
      description: frLoc('Poulet frit', 'localeText'),
      available: true,
      price: 7,
    },
    {
      _id: 'm26-item-trio-degustation',
      _rev: 'rev-trio',
      _type: 'menuItem',
      name: frLoc('Trio dégustation'),
      subgroup: frLoc('Au choix'),
      prices: [{ _type: 'priceVariant', _key: 'v0', label: frLoc('3 × 6cl'), price: 18 }],
      available: true,
    },
  ];
}

/** Independent of the module under test: the object a Sanity path points to, and a tiny patch simulator. */
function locAt(doc, path) {
  const m = path.match(/^prices\[_key=="([^"]+)"\]\.label$/);
  return m ? doc.prices.find((v) => v._key === m[1]).label : doc[path];
}
const splitKey = (key) => [key.slice(0, key.lastIndexOf('.')), key.slice(key.lastIndexOf('.') + 1)];
function applyKeys(doc, { set = {}, unset = [] }) {
  const next = structuredClone(doc);
  for (const [key, value] of Object.entries(set)) {
    const [path, locale] = splitKey(key);
    locAt(next, path)[locale] = value;
  }
  for (const key of unset) {
    const [path, locale] = splitKey(key);
    delete locAt(next, path)[locale];
  }
  return next;
}

/** docsFixture() plus every translation of menuFixture(), written independently of patchTargets. */
function translatedDocs() {
  const menu = menuFixture();
  const docs = docsFixture();
  const byId = Object.fromEntries(docs.map((d) => [d._id, d]));
  const cat = menu.categories[0];
  const copy = (doc, path, loc) => {
    for (const l of TRANSLATION_LOCALES) locAt(doc, path)[l] = loc[l];
  };
  for (const field of ['name', 'description', 'footnote']) copy(byId['m26-cat-entrees'], field, cat[field]);
  copy(byId['m26-item-karaage'], 'name', cat.items[0].name);
  copy(byId['m26-item-karaage'], 'description', cat.items[0].description);
  copy(byId['m26-item-trio-degustation'], 'name', cat.items[1].name);
  copy(byId['m26-item-trio-degustation'], 'subgroup', cat.items[1].subgroup);
  copy(byId['m26-item-trio-degustation'], 'prices[_key=="v0"].label', cat.items[1].prices[0].label);
  return docs;
}
const docById = (docs, id) => docs.find((d) => d._id === id);

// ── part 1: patchTargets, readLocaleObject ────────────────────────────────────
test('patchTargets maps every translatable field to its document id and Sanity path, in print order', () => {
  const targets = patchTargets(menuFixture());
  assert.equal(targets.length, 8);
  assert.deepEqual(
    targets.map((t) => t.path),
    translatableFields(menuFixture()).map((f) => f.path),
  );
  assert.deepEqual(targets[0], {
    docId: 'm26-cat-entrees',
    sanityPath: 'name',
    path: 'categories.entrees.name',
    fr: 'Entrées',
    values: { en: 'Starters', de: 'Vorspeisen', it: 'Antipasti', zh: '小吃' },
  });
  const by = Object.fromEntries(targets.map((t) => [t.path, [t.docId, t.sanityPath]]));
  assert.deepEqual(by['categories.entrees.description'], ['m26-cat-entrees', 'description']);
  assert.deepEqual(by['categories.entrees.footnote'], ['m26-cat-entrees', 'footnote']);
  assert.deepEqual(by['items.karaage.name'], ['m26-item-karaage', 'name']);
  assert.deepEqual(by['items.karaage.description'], ['m26-item-karaage', 'description']);
  assert.deepEqual(by['items.trio-degustation.subgroup'], ['m26-item-trio-degustation', 'subgroup']);
  assert.deepEqual(by['items.trio-degustation.prices[0].label'], ['m26-item-trio-degustation', 'prices[_key=="v0"].label']);
});

test('patchTargets: only non-blank strings are values (the French text is never one)', () => {
  const menu = menuFixture();
  menu.categories[0].name.zh = '   ';
  delete menu.categories[0].name.de;
  menu.categories[0].name.it = 5; // not a string
  const t = patchTargets(menu)[0];
  assert.deepEqual(t.values, { en: 'Starters' });
  assert.equal(t.fr, 'Entrées');
  assert.ok(!('fr' in t.values));
});

test('patchTargets: price label keys follow the index of the variant in the JSON prices array', () => {
  const menu = menuFixture();
  menu.categories[0].items[1].prices = [
    { quantity: 3, unit: 'cl', price: 5 },
    { label: L('Verre', 'Glass', 'Glas', 'Bicchiere', '杯'), price: 6 },
    { label: L('Bouteille', 'Bottle', 'Flasche', 'Bottiglia', '瓶'), price: 20 },
  ];
  const labels = patchTargets(menu).filter((t) => t.path.includes('.label'));
  assert.deepEqual(
    labels.map((t) => t.sanityPath),
    ['prices[_key=="v1"].label', 'prices[_key=="v2"].label'],
  );
});

test('patchTargets on the real menu: 178 fields on 97 m26 documents', () => {
  const targets = patchTargets(realMenu());
  assert.equal(targets.length, 178);
  assert.equal(new Set(targets.map((t) => t.docId)).size, 97);
  assert.ok(targets.every((t) => /^m26-(cat|item)-[a-z0-9-]+$/.test(t.docId)));
  const count = (p) => targets.filter((t) => p(t)).length;
  assert.equal(count((t) => t.sanityPath === 'name'), 97);
  assert.equal(count((t) => t.sanityPath === 'description'), 58);
  assert.equal(count((t) => t.sanityPath === 'footnote'), 1);
  assert.equal(count((t) => t.sanityPath === 'subgroup'), 21);
  assert.deepEqual(
    targets.filter((t) => t.sanityPath.startsWith('prices[')).map((t) => [t.docId, t.sanityPath]),
    [['m26-item-trio-degustation', 'prices[_key=="v0"].label']],
  );
});

test('readLocaleObject returns the Loc object a path points to, undefined otherwise', () => {
  const doc = docsFixture()[2];
  assert.equal(readLocaleObject(doc, 'name'), doc.name);
  assert.equal(readLocaleObject(doc, 'subgroup'), doc.subgroup);
  assert.equal(readLocaleObject(doc, 'prices[_key=="v0"].label'), doc.prices[0].label);
  assert.equal(readLocaleObject(doc, 'prices[_key=="v9"].label'), undefined);
  assert.equal(readLocaleObject(doc, 'description'), undefined);
  assert.equal(readLocaleObject(docsFixture()[1], 'prices[_key=="v0"].label'), undefined, 'no prices at all');
  assert.equal(readLocaleObject(doc, 'order'), undefined);
  assert.equal(readLocaleObject(doc, '__proto__'), undefined);
  assert.equal(readLocaleObject(null, 'name'), undefined);
});

// ── part 1: planTranslationPatches ────────────────────────────────────────────
test('planTranslationPatches on French-only documents: one set patch per document, with its _rev', () => {
  const plan = planTranslationPatches(menuFixture(), docsFixture());
  assert.deepEqual(
    plan.patches.map((p) => [p.id, p.rev]),
    [
      ['m26-cat-entrees', 'rev-cat'],
      ['m26-item-karaage', 'rev-karaage'],
      ['m26-item-trio-degustation', 'rev-trio'],
    ],
  );
  const keys = (id) => Object.keys(plan.patches.find((p) => p.id === id).set);
  const withLocales = (paths) => paths.flatMap((p) => TRANSLATION_LOCALES.map((l) => `${p}.${l}`));
  assert.deepEqual(keys('m26-cat-entrees'), withLocales(['name', 'description', 'footnote']));
  assert.deepEqual(keys('m26-item-karaage'), withLocales(['name', 'description']));
  assert.deepEqual(keys('m26-item-trio-degustation'), withLocales(['name', 'subgroup', 'prices[_key=="v0"].label']));
  assert.deepEqual(plan.patches[1].set['description.zh'], '炸鸡');
  assert.deepEqual(plan.counts, { docs: 3, patched: 3, set: 32, skip: 0, conflicts: 0, frDrift: 0, drafts: 0, missingDocs: 0 });
  assert.deepEqual([plan.conflicts, plan.frDrift, plan.drafts, plan.missingDocs], [[], [], [], []]);
  for (const p of plan.patches) assert.ok(Object.keys(p.set).every((k) => /\.(en|de|it|zh)$/.test(k)), 'only locale keys');
});

test('planTranslationPatches never mutates its inputs', () => {
  const menu = menuFixture();
  const docs = docsFixture();
  const snapshot = [structuredClone(menu), structuredClone(docs)];
  planTranslationPatches(menu, docs, { overwriteExisting: true, includeDrafts: true });
  assert.deepEqual([menu, docs], snapshot);
});

test('planTranslationPatches is idempotent: documents that already hold the values need no patch', () => {
  const plan = planTranslationPatches(menuFixture(), translatedDocs());
  assert.deepEqual(plan.patches, []);
  assert.deepEqual(plan.counts, { docs: 3, patched: 0, set: 0, skip: 32, conflicts: 0, frDrift: 0, drafts: 0, missingDocs: 0 });
});

test('a different non-empty existing value is a conflict: listed, not set; equal values are skipped', () => {
  const docs = translatedDocs();
  docById(docs, 'm26-item-karaage').name.en = 'Karage'; // Studio edit
  delete docById(docs, 'm26-item-karaage').name.de; // never translated: set, not a conflict
  const plan = planTranslationPatches(menuFixture(), docs);
  assert.deepEqual(plan.conflicts, [{ id: 'm26-item-karaage', path: 'name', locale: 'en', current: 'Karage', wanted: 'Karaage' }]);
  assert.deepEqual(plan.patches, [{ id: 'm26-item-karaage', rev: 'rev-karaage', set: { 'name.de': 'Karaage' } }]);
  assert.deepEqual(plan.counts, { docs: 3, patched: 1, set: 1, skip: 30, conflicts: 1, frDrift: 0, drafts: 0, missingDocs: 0 });
});

test('overwriteExisting sets the conflicting value and still lists it', () => {
  const docs = translatedDocs();
  docById(docs, 'm26-item-karaage').name.en = 'Karage';
  const plan = planTranslationPatches(menuFixture(), docs, { overwriteExisting: true });
  assert.equal(plan.conflicts.length, 1);
  assert.deepEqual(plan.patches, [{ id: 'm26-item-karaage', rev: 'rev-karaage', set: { 'name.en': 'Karaage' } }]);
  assert.equal(plan.counts.set, 1);
  assert.equal(plan.counts.conflicts, 1);
});

test('a blank existing value counts as absent: set, no conflict', () => {
  const docs = docsFixture();
  docById(docs, 'm26-item-karaage').name.en = '  ';
  docById(docs, 'm26-item-karaage').name.zh = '';
  const plan = planTranslationPatches(menuFixture(), docs);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.patches[1].set['name.en'], 'Karaage');
  assert.equal(plan.patches[1].set['name.zh'], 'Karaage（日式炸鸡）');
});

test('French in Sanity different from the JSON French: FR DRIFT entry, no set for that field only', () => {
  const docs = docsFixture();
  docById(docs, 'm26-item-karaage').description.fr = 'Poulet frit maison'; // Studio edit since Phase 12
  const plan = planTranslationPatches(menuFixture(), docs);
  assert.deepEqual(plan.frDrift, [{ id: 'm26-item-karaage', path: 'description', sanity: 'Poulet frit maison', json: 'Poulet frit' }]);
  const keys = Object.keys(plan.patches.find((p) => p.id === 'm26-item-karaage').set);
  assert.deepEqual(keys, ['name.en', 'name.de', 'name.it', 'name.zh']);
  assert.equal(plan.counts.frDrift, 1);
  assert.equal(plan.counts.set, 28);
});

test('French drift also covers a missing Loc, a missing variant and missing prices', () => {
  const docs = docsFixture();
  delete docById(docs, 'm26-item-karaage').description; // the Loc disappeared
  docById(docs, 'm26-item-trio-degustation').prices[0]._key = 'v9'; // the variant is not v0 any more
  const plan = planTranslationPatches(menuFixture(), docs);
  assert.deepEqual(
    plan.frDrift.map((d) => [d.id, d.path, d.sanity]),
    [
      ['m26-item-karaage', 'description', undefined],
      ['m26-item-trio-degustation', 'prices[_key=="v0"].label', undefined],
    ],
  );
  assert.ok(!Object.keys(plan.patches[2].set).some((k) => k.startsWith('prices[')));
  const noPrices = docsFixture();
  delete docById(noPrices, 'm26-item-trio-degustation').prices;
  assert.equal(planTranslationPatches(menuFixture(), noPrices).counts.frDrift, 1);
});

test('a missing target document is reported, not patched, and does not stop the others', () => {
  const docs = docsFixture().filter((d) => d._id !== 'm26-item-trio-degustation');
  const plan = planTranslationPatches(menuFixture(), docs);
  assert.deepEqual(plan.missingDocs, ['m26-item-trio-degustation']);
  assert.deepEqual(plan.patches.map((p) => p.id), ['m26-cat-entrees', 'm26-item-karaage']);
  assert.equal(plan.counts.missingDocs, 1);
  assert.equal(plan.counts.docs, 3);
});

test('an open draft is listed and not patched; includeDrafts patches it with its own _rev', () => {
  const docs = [...docsFixture(), { ...structuredClone(docById(docsFixture(), 'm26-item-karaage')), _id: 'drafts.m26-item-karaage', _rev: 'rev-draft' }];
  const plain = planTranslationPatches(menuFixture(), docs);
  assert.deepEqual(plain.drafts, ['drafts.m26-item-karaage']);
  assert.equal(plain.patches.length, 3);
  assert.ok(plain.patches.every((p) => !p.id.startsWith('drafts.')));
  assert.equal(plain.counts.drafts, 1);

  const withDrafts = planTranslationPatches(menuFixture(), docs, { includeDrafts: true });
  assert.deepEqual(withDrafts.drafts, ['drafts.m26-item-karaage']);
  const draftPatch = withDrafts.patches.find((p) => p.id === 'drafts.m26-item-karaage');
  assert.equal(draftPatch.rev, 'rev-draft');
  assert.equal(draftPatch.set['name.zh'], 'Karaage（日式炸鸡）');
  assert.equal(withDrafts.patches.length, 4);
  assert.equal(withDrafts.patches.find((p) => p.id === 'm26-item-karaage').rev, 'rev-karaage');
});

test('includeDrafts applies the same French drift rule to the draft', () => {
  const draft = { ...structuredClone(docById(docsFixture(), 'm26-item-karaage')), _id: 'drafts.m26-item-karaage', _rev: 'rev-draft' };
  draft.name.fr = 'Karaage maison';
  const plan = planTranslationPatches(menuFixture(), [...docsFixture(), draft], { includeDrafts: true });
  assert.deepEqual(plan.frDrift.map((d) => d.id), ['drafts.m26-item-karaage']);
  assert.equal(plan.patches.find((p) => p.id === 'drafts.m26-item-karaage').set['name.en'], undefined);
  assert.equal(plan.patches.find((p) => p.id === 'drafts.m26-item-karaage').set['description.en'], 'Fried chicken');
});

test('a draft of a document that is not in the menu is ignored; versions.* documents too', () => {
  const stray = { _id: 'drafts.m26-item-ghost', _rev: 'x', _type: 'menuItem', name: frLoc('Ghost') };
  const version = { _id: 'versions.rel.m26-item-karaage', _rev: 'y', _type: 'menuItem', name: frLoc('Karaage') };
  const plan = planTranslationPatches(menuFixture(), [...docsFixture(), stray, version], { includeDrafts: true });
  assert.deepEqual(plan.drafts, []);
  assert.equal(plan.patches.length, 3);
});

test('a locale without a value in the menu is never written (no blank write)', () => {
  const menu = menuFixture();
  delete menu.categories[0].items[0].name.zh;
  menu.categories[0].items[0].name.de = ' ';
  const plan = planTranslationPatches(menu, docsFixture());
  const karaage = plan.patches.find((p) => p.id === 'm26-item-karaage').set;
  assert.deepEqual(Object.keys(karaage).filter((k) => k.startsWith('name.')), ['name.en', 'name.it']);
  assert.equal(plan.counts.set, 30);
  assert.ok(Object.values(plan.patches.flatMap((p) => Object.values(p.set))).every(nonBlank));
});

test('planned patches address the Loc objects readLocaleObject reads: applying them gives the translated documents', () => {
  const plan = planTranslationPatches(menuFixture(), docsFixture());
  const applied = docsFixture().map((d) => applyKeys(d, plan.patches.find((p) => p.id === d._id) ?? {}));
  assert.deepEqual(applied, translatedDocs());
});

test('the real menu maps onto 97 French-only documents: 712 values when fully translated', () => {
  const menu = realMenu();
  const filled = structuredClone(menu); // fill what is not translated yet, whatever the state of the file
  for (const f of translatableFields(filled)) {
    for (const l of TRANSLATION_LOCALES) if (!nonBlank(f.value[l])) f.value[l] = `${f.value.fr} [${l}]`;
  }
  const plan = planTranslationPatches(filled, frOnlyDocs(menu));
  assert.deepEqual(plan.counts, { docs: 97, patched: 97, set: 712, skip: 0, conflicts: 0, frDrift: 0, drafts: 0, missingDocs: 0 });
  assert.equal(plan.patches.filter((p) => p.id.startsWith('m26-cat-')).length, 20);
  assert.equal(plan.patches.filter((p) => p.id.startsWith('m26-item-')).length, 77);
});

// ── part 1: planTranslationRollback ───────────────────────────────────────────
test('planTranslationRollback: backup without translations, current translated → unset everything, nothing else', () => {
  const plan = planTranslationRollback(docsFixture(), translatedDocs());
  assert.deepEqual(plan.counts, { docs: 3, set: 0, unset: 32 });
  assert.equal(plan.patches.length, 3);
  for (const p of plan.patches) {
    assert.equal(p.set, undefined);
    assert.ok(p.unset.every((k) => /\.(en|de|it|zh)$/.test(k)));
    assert.ok(!p.unset.some((k) => /\.fr$/.test(k)));
  }
  assert.ok(plan.patches[2].unset.includes('prices[_key=="v0"].label.zh'));
  // applying the rollback gives the French-only documents back
  const restored = translatedDocs().map((d) => applyKeys(d, plan.patches.find((p) => p.id === d._id) ?? {}));
  assert.deepEqual(restored, docsFixture());
});

test('planTranslationRollback restores earlier values: set when they differ, unset when the backup had none', () => {
  const backup = docsFixture();
  const current = translatedDocs();
  docById(backup, 'm26-item-karaage').name.en = 'Old English'; // differs from current
  docById(backup, 'm26-item-karaage').name.de = 'Karaage'; // equals current: nothing to do
  const plan = planTranslationRollback(backup, current);
  const karaage = plan.patches.find((p) => p.id === 'm26-item-karaage');
  assert.deepEqual(karaage.set, { 'name.en': 'Old English' });
  assert.ok(karaage.unset.includes('name.it') && karaage.unset.includes('name.zh'));
  assert.ok(!karaage.unset.includes('name.de') && !('name.de' in karaage.set), 'equal value left alone');
  assert.ok(!karaage.unset.includes('name.en'));
});

test('planTranslationRollback ignores documents on one side only and Locs the backup does not have', () => {
  const backup = docsFixture().filter((d) => d._id !== 'm26-item-karaage');
  const current = [...translatedDocs(), { _id: 'm26-item-new', _rev: 'n', _type: 'menuItem', name: { _type: 'localeString', fr: 'New', en: 'New' } }];
  delete docById(backup, 'm26-cat-entrees').footnote; // the backup doc had no footnote Loc at all
  const plan = planTranslationRollback(backup, current);
  assert.deepEqual(plan.patches.map((p) => p.id), ['m26-cat-entrees', 'm26-item-trio-degustation']);
  assert.ok(!plan.patches[0].unset.some((k) => k.startsWith('footnote.')));
  assert.equal(plan.counts.unset, 8 + 12);
  // a backup document missing from the current data cannot be patched
  assert.deepEqual(planTranslationRollback(docsFixture(), []).patches, []);
});

test('planTranslationRollback: backup equal to current → nothing to do', () => {
  const plan = planTranslationRollback(translatedDocs(), translatedDocs());
  assert.deepEqual(plan, { patches: [], counts: { docs: 0, set: 0, unset: 0 } });
});

// ── part 1: stripTranslations ─────────────────────────────────────────────────
test('stripTranslations drops _rev, _updatedAt and the four locales of every Loc, keeps everything else', () => {
  const doc = {
    ...translatedDocs()[2],
    _updatedAt: '2026-11-23T10:00:00Z',
    _createdAt: '2026-11-23T09:00:00Z',
    category: { _type: 'reference', _ref: 'm26-cat-entrees' },
  };
  const before = structuredClone(doc);
  const out = stripTranslations(doc);
  assert.deepEqual(doc, before, 'input not mutated');
  assert.notEqual(out, doc);
  assert.equal(out._rev, undefined);
  assert.equal(out._updatedAt, undefined);
  assert.deepEqual(out.name, { _type: 'localeString', fr: 'Trio dégustation' });
  assert.deepEqual(out.subgroup, { _type: 'localeString', fr: 'Au choix' });
  assert.deepEqual(out.prices, [{ _type: 'priceVariant', _key: 'v0', label: { _type: 'localeString', fr: '3 × 6cl' }, price: 18 }]);
  assert.equal(out._createdAt, '2026-11-23T09:00:00Z');
  assert.deepEqual(out.category, doc.category);
  assert.equal(out._type, 'menuItem');
  assert.equal(out.available, true);
  const cat = stripTranslations(translatedDocs()[0]);
  assert.deepEqual(Object.keys(cat.description).sort(), ['_type', 'fr']);
  assert.deepEqual(Object.keys(cat.footnote).sort(), ['_type', 'fr']);
});

test('stripTranslations: translated and French-only versions of a document are equal, any other edit is not', () => {
  const translated = translatedDocs();
  const plain = docsFixture();
  for (let i = 0; i < 3; i += 1) assert.deepEqual(stripTranslations(translated[i]), stripTranslations(plain[i]));
  const edited = structuredClone(translated[1]);
  edited.price = 8;
  assert.notDeepEqual(stripTranslations(edited), stripTranslations(plain[1]));
  const frEdited = structuredClone(translated[1]);
  frEdited.name.fr = 'Karaage maison';
  assert.notDeepEqual(stripTranslations(frEdited), stripTranslations(plain[1]));
});

// ── source guards ─────────────────────────────────────────────────────────────
test('the planner module has a single import (translation-rules.mjs); the CLI never replaces or deletes a document', () => {
  const planner = readFileSync(new URL('./translation-patches.mjs', import.meta.url), 'utf8');
  const imports = planner.split('\n').filter((l) => l.startsWith('import'));
  assert.equal(imports.length, 1);
  assert.match(imports[0], /from '\.\/translation-rules\.mjs'/);
  const cli = readFileSync(new URL('./apply-translations.mjs', import.meta.url), 'utf8');
  assert.ok(!/createOrReplace|\.delete\(/.test(cli), 'no whole-document write, no deletion');
  assert.match(cli, /ifRevisionId\(/);
  assert.match(cli, /translations-backup-/);
});

// ── part 2: the CLI on a fake Sanity ──────────────────────────────────────────
const FAKE_TOKEN = 'sk-fake-token-do-not-print';
const FAKE_ENV = { NEXT_PUBLIC_SANITY_PROJECT_ID: 'fakeproj', NEXT_PUBLIC_SANITY_DATASET: 'fakeset', SANITY_TOKEN: FAKE_TOKEN };
const tmpRoots = [];
const makeRoot = () => {
  const dir = mkdtempSync(join(tmpdir(), 'umai-apply-'));
  tmpRoots.push(dir);
  return dir;
};
after(() => {
  for (const dir of tmpRoots) rmSync(dir, { recursive: true, force: true });
});

/** French-only documents of a menu, in the shape sync-menu.mjs writes (translatable fields as Loc objects). */
function frOnlyDocs(menu) {
  const loc = (value, type) => (value && typeof value.fr === 'string' && value.fr.trim() ? { _type: type, fr: value.fr } : undefined);
  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
  const docs = [];
  let n = 0;
  menu.categories.forEach((cat, ci) => {
    docs.push(
      clean({
        _id: `m26-cat-${cat.key}`,
        _rev: `rev-${(n += 1)}`,
        _type: 'menuCategory',
        name: loc(cat.name, 'localeString'),
        slug: { _type: 'slug', current: cat.key },
        order: (ci + 1) * 10,
        section: cat.section,
        nameJp: cat.nameJp,
        description: loc(cat.description, 'localeText'),
        footnote: loc(cat.footnote, 'localeText'),
      }),
    );
    cat.items.forEach((item, ii) => {
      docs.push(
        clean({
          _id: `m26-item-${item.key}`,
          _rev: `rev-${(n += 1)}`,
          _type: 'menuItem',
          name: loc(item.name, 'localeString'),
          slug: { _type: 'slug', current: item.key },
          category: { _type: 'reference', _ref: `m26-cat-${cat.key}` },
          order: (ii + 1) * 10,
          available: true,
          isVegetarian: !!item.isVegetarian,
          isGlutenFree: !!item.isGlutenFree,
          nameJp: item.nameJp,
          description: loc(item.description, 'localeText'),
          subgroup: loc(item.subgroup, 'localeString'),
          price: item.price,
          prices: item.prices?.map((v, vi) =>
            clean({ _type: 'priceVariant', _key: `v${vi}`, quantity: v.quantity, unit: v.unit, label: loc(v.label, 'localeString'), price: v.price }),
          ),
          priceOnRequest: item.priceOnRequest === true ? true : undefined,
          badges: item.badges ? [...item.badges] : undefined,
        }),
      );
    });
  });
  return docs;
}

/** The real menu with its 712 translations: the file itself, or the file merged with the staging overlays (before Plan 14-03). */
function translatedRealMenu() {
  const menu = realMenu();
  if (!translatableFields(menu).some((f) => TRANSLATION_LOCALES.some((l) => !nonBlank(f.value[l])))) return menu;
  const overlays = ['translations-2026-food.json', 'translations-2026-drinks.json']
    .map((name) => new URL(`./${name}`, import.meta.url))
    .filter((url) => existsSync(url))
    .map((url) => JSON.parse(readFileSync(url, 'utf8')));
  const { menu: merged, errors } = mergeTranslations(menu, overlays);
  assert.deepEqual(errors, []);
  return merged;
}

/** Minimal in-memory Sanity: reads by perspective, atomic transactions of patches with ifRevisionId, set and unset. */
function fakeSanity(initialDocs) {
  const state = { docs: structuredClone(initialDocs), commits: [], queries: [], clients: [], revision: 1000, beforeCommit: null, failCommit: null };
  const makeClient = (config) => {
    state.clients.push(config);
    return {
      async fetch(query) {
        state.queries.push(query);
        const visible = config.perspective === 'published' ? state.docs.filter((d) => !d._id.startsWith('drafts.')) : state.docs;
        return structuredClone(visible);
      },
      transaction() {
        const ops = [];
        const tx = {
          patch(id, build) {
            const op = { id, rev: undefined, set: undefined, unset: undefined };
            const patch = {
              ifRevisionId(rev) {
                op.rev = rev;
                return patch;
              },
              set(obj) {
                op.set = { ...op.set, ...obj };
                return patch;
              },
              unset(keys) {
                op.unset = [...(op.unset ?? []), ...keys];
                return patch;
              },
            };
            build(patch);
            ops.push(op);
            return tx;
          },
          async commit(options) {
            if (state.beforeCommit) state.beforeCommit(state);
            if (state.failCommit) throw state.failCommit;
            for (const op of ops) {
              const doc = state.docs.find((d) => d._id === op.id);
              if (!doc) throw Object.assign(new Error(`Document ${op.id} not found`), { statusCode: 404 });
              if (op.rev !== undefined && doc._rev !== op.rev) {
                throw Object.assign(new Error(`Document "${op.id}" has revision ${doc._rev}, expected ${op.rev}`), { statusCode: 409 });
              }
            }
            state.docs = state.docs.map((doc) => {
              const op = ops.find((o) => o.id === doc._id);
              if (!op) return doc;
              const next = applyKeys(doc, { set: op.set, unset: op.unset });
              next._rev = `rev-${(state.revision += 1)}`;
              next._updatedAt = '2026-11-23T12:00:00Z';
              return next;
            });
            state.commits.push({ options, ops });
            return { transactionId: `tx-${state.commits.length}` };
          },
        };
        return tx;
      },
    };
  };
  return { state, makeClient };
}

/** Runs the CLI. `menuPath` defaults to a file holding the translated real menu. */
let translatedMenuFile;
async function cli(argv, { sanity, root = makeRoot(), menuPath, env = FAKE_ENV } = {}) {
  if (menuPath === undefined) {
    if (!translatedMenuFile) {
      translatedMenuFile = join(makeRoot(), 'menu-translated.json');
      writeFileSync(translatedMenuFile, formatMenuJson(translatedRealMenu()));
    }
    menuPath = translatedMenuFile;
  }
  const lines = [];
  const errors = [];
  const code = await main(argv, {
    env,
    makeClient: sanity?.makeClient ?? (() => assert.fail('no Sanity client may be created')),
    root,
    menuPath,
    out: (s) => lines.push(String(s)),
    err: (s) => errors.push(String(s)),
  });
  return { code, root, text: lines.join('\n'), errText: errors.join('\n'), lines, errors };
}
const PLAN_LINE = 'TRANSLATION PLAN docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0';
const backupFiles = (root) => {
  const dir = join(root, '.planning/phases/14-traductions-en-de-it-zh/backup');
  return existsSync(dir) ? readdirSync(dir).map((f) => join(dir, f)) : [];
};
const docsAsSanityHolds = (sanity) => structuredClone(sanity.state.docs);
const withoutTranslations = (docs) => docs.map(stripTranslations);

test('parseArgs: modes, flags and every usage error', () => {
  assert.deepEqual(parseArgs([]), { mode: 'dry-run', dry: true, json: undefined, backup: undefined, overwrite: false, includeDrafts: false, full: false });
  assert.equal(parseArgs(['--dry-run', '--full', '--json', 'x.json']).json, 'x.json');
  assert.deepEqual(parseArgs(['--apply', '--overwrite-existing', '--include-drafts']), {
    mode: 'apply', dry: false, json: undefined, backup: undefined, overwrite: true, includeDrafts: true, full: false,
  });
  const rollback = parseArgs(['--rollback', '--backup', 'b.json', '--dry-run']);
  assert.deepEqual([rollback.mode, rollback.dry, rollback.backup], ['rollback', true, 'b.json']);
  for (const bad of [
    ['--bogus'],
    ['--apply', '--rollback', '--backup', 'b.json'],
    ['--apply', '--dry-run'],
    ['--apply', '--json', 'x.json'],
    ['--rollback', '--backup', 'b.json', '--json', 'x.json'],
    ['--backup', 'b.json'],
    ['--rollback'],
    ['--rollback', '--backup'],
    ['--json'],
    ['--json', '--full'],
    ['--rollback', '--backup', 'b.json', '--overwrite-existing'],
    ['--rollback', '--backup', 'b.json', '--include-drafts'],
    ['--dry-run', '--dry-run'],
  ]) {
    assert.throws(() => parseArgs(bad), /./, `usage error expected for ${bad.join(' ')}`);
  }
});

test('CLI usage errors exit 2 before any validation, env check or network call', async () => {
  for (const argv of [['--apply', '--json', '/dev/null'], ['--apply', '--dry-run'], ['--rollback'], ['--backup', 'x'], ['--nope']]) {
    const r = await cli(argv, { menuPath: '/nonexistent' });
    assert.equal(r.code, 2, argv.join(' '));
    assert.match(r.errText, /Usage:/);
    assert.equal(r.text, '');
  }
});

test('CLI: a menu that fails the rules exits 1 before the env check and any network call', async () => {
  const frOnly = join(makeRoot(), 'fr-only.json');
  const stripped = realMenu();
  for (const f of translatableFields(stripped)) for (const l of TRANSLATION_LOCALES) delete f.value[l];
  writeFileSync(frOnly, JSON.stringify(stripped));
  const r = await cli(['--dry-run'], { menuPath: frOnly, env: {} }); // no env at all: validation comes first
  assert.equal(r.code, 1);
  assert.match(r.text, /^ERROR MISSING /m);
  assert.match(r.text, /TRANSLATIONS FAILED errors=712: nothing read from or written to Sanity/);
  assert.ok(!r.text.includes('Target:'));
  assert.ok(r.lines.filter((l) => l.startsWith('ERROR ')).length <= 81);
  const unreadable = await cli(['--dry-run', '--json', join(makeRoot(), 'absent.json')]);
  assert.equal(unreadable.code, 1);
  assert.match(unreadable.text, /TRANSLATIONS FAILED errors=1/);
});

test('CLI: a missing env variable exits 2 and names it, never a value', async () => {
  const r = await cli(['--dry-run'], { env: { NEXT_PUBLIC_SANITY_PROJECT_ID: 'fakeproj', SANITY_TOKEN: FAKE_TOKEN } });
  assert.equal(r.code, 2);
  assert.match(r.errText, /NEXT_PUBLIC_SANITY_DATASET/);
  assert.ok(!r.errText.includes(FAKE_TOKEN) && !r.errText.includes('fakeproj'));
  assert.ok(!r.text.includes('Target:'));
});

test('CLI --dry-run (default mode): prints the plan, reads Sanity read-only, writes nothing', async () => {
  const sanity = fakeSanity(frOnlyDocs(realMenu()));
  const r = await cli([], { sanity });
  assert.equal(r.code, 0, r.text);
  const lines = r.lines;
  assert.ok(lines.includes('MENU JSON OK categories=20 items=77'));
  assert.ok(lines.includes('TRANSLATIONS OK fields=178 values=712'));
  assert.ok(lines.includes('Target: fakeproj/fakeset'));
  assert.ok(lines.includes(PLAN_LINE));
  assert.equal(lines.filter((l) => l.startsWith('SET ')).length, 15);
  assert.match(r.text, /\.\.\. 697 more SET lines \(--full prints them all\)/);
  assert.match(lines.find((l) => l.startsWith('SET ')), /^SET m26-cat-[a-z0-9-]+ name\.en$/);
  assert.equal(sanity.state.commits.length, 0);
  assert.equal(backupFiles(r.root).length, 0);
  assert.ok(sanity.state.queries.every((q) => q.includes('m26-') && q.includes('"menuCategory", "menuItem"')));
  assert.ok(sanity.state.clients.every((c) => c.useCdn === false && c.apiVersion === '2025-01-01' && c.projectId === 'fakeproj' && c.dataset === 'fakeset'));
  assert.deepEqual(sanity.state.clients.map((c) => c.perspective).sort(), ['published', 'raw']);
  assert.ok(!r.text.includes(FAKE_TOKEN) && !r.errText.includes(FAKE_TOKEN));
  const full = await cli(['--dry-run', '--full'], { sanity });
  assert.equal(full.lines.filter((l) => l.startsWith('SET ')).length, 712);
});

test('CLI --apply: backup first, one transaction of ifRevisionId set patches, post-apply check, nothing else touched', async () => {
  const initial = frOnlyDocs(realMenu());
  const sanity = fakeSanity(initial);
  const r = await cli(['--apply'], { sanity });
  assert.equal(r.code, 0, r.text);
  assert.ok(r.lines.includes(PLAN_LINE));
  const backupLine = r.lines.find((l) => l.startsWith('BACKUP '));
  assert.match(backupLine, /^BACKUP \.planning\/phases\/14-traductions-en-de-it-zh\/backup\/translations-backup-\d{8}-\d{6}\.json documents=97$/);
  assert.ok(r.lines.includes('APPLIED transactionId=tx-1 patches=97 values=712'));
  assert.ok(r.lines.includes('POST-APPLY CHECK OK docs=97 values=712'));
  // order: backup before the transaction
  assert.ok(r.lines.indexOf(backupLine) < r.lines.indexOf('APPLIED transactionId=tx-1 patches=97 values=712'));
  // exactly one transaction, every patch guarded by its revision, only set operations on locale keys
  assert.equal(sanity.state.commits.length, 1);
  const { ops, options } = sanity.state.commits[0];
  assert.deepEqual(options, { visibility: 'sync' });
  assert.equal(ops.length, 97);
  assert.ok(ops.every((op) => typeof op.rev === 'string' && op.set && op.unset === undefined));
  assert.equal(ops.reduce((n, op) => n + Object.keys(op.set).length, 0), 712);
  assert.ok(ops.every((op) => Object.keys(op.set).every((k) => /\.(en|de|it|zh)$/.test(k))));
  // the backup holds the 97 documents as they were before the write
  const [file] = backupFiles(r.root);
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  assert.deepEqual([backup.projectId, backup.dataset, backup.perspective], ['fakeproj', 'fakeset', 'raw']);
  assert.deepEqual(backup.counts, { menuCategory: 20, menuItem: 77, drafts: 0 });
  assert.equal(backup.documents.length, 97);
  assert.deepEqual(backup.documents, structuredClone(initial).sort((a, b) => (a._id < b._id ? -1 : 1)));
  assert.ok(!backup.documents.some((d) => d.name.en !== undefined));
  // Sanity now holds the translations and nothing else changed
  const menu = translatedRealMenu();
  const after = docsAsSanityHolds(sanity);
  assert.deepEqual(withoutTranslations(after), withoutTranslations(initial));
  const byId = new Map(after.map((d) => [d._id, d]));
  for (const t of patchTargets(menu)) {
    const loc = readLocaleObject(byId.get(t.docId), t.sanityPath);
    for (const l of TRANSLATION_LOCALES) assert.equal(loc[l], t.values[l], `${t.docId} ${t.sanityPath}.${l}`);
    assert.equal(loc.fr, t.fr);
  }
  assert.ok(!r.text.includes(FAKE_TOKEN) && !r.errText.includes(FAKE_TOKEN));
});

test('CLI --apply twice: the second run has nothing to do, writes no backup and still checks', async () => {
  const sanity = fakeSanity(frOnlyDocs(realMenu()));
  const root = makeRoot();
  assert.equal((await cli(['--apply'], { sanity, root })).code, 0);
  const second = await cli(['--apply'], { sanity, root });
  assert.equal(second.code, 0, second.text);
  assert.ok(second.lines.includes('TRANSLATION PLAN docs=97 patched=0 set=0 skip=712 conflicts=0 frDrift=0 drafts=0 missingDocs=0'));
  assert.ok(second.lines.includes('NOTHING TO DO'));
  assert.ok(second.lines.includes('POST-APPLY CHECK OK docs=97 values=712'));
  assert.ok(!second.text.includes('APPLIED') && !second.text.includes('BACKUP'));
  assert.equal(sanity.state.commits.length, 1);
  assert.equal(backupFiles(root).length, 1);
});

test('CLI --apply refuses on a CONFLICT (a translation edited in Studio): nothing written, no backup', async () => {
  const docs = frOnlyDocs(realMenu());
  docById(docs, 'm26-item-karaage').name.en = 'Crispy Karaage'; // Studio edit
  const sanity = fakeSanity(docs);
  const r = await cli(['--apply'], { sanity });
  assert.equal(r.code, 1);
  assert.match(r.text, /^CONFLICT m26-item-karaage name\.en sanity="Crispy Karaage" json="Karaage"$/m);
  assert.match(r.text, /^ABORT: .*Nothing written\.$/m);
  assert.equal(sanity.state.commits.length, 0);
  assert.equal(backupFiles(r.root).length, 0);
  assert.deepEqual(docsAsSanityHolds(sanity), docs);
});

test('CLI --apply --overwrite-existing writes the conflicting value, keeps the rest of the plan', async () => {
  const docs = frOnlyDocs(realMenu());
  docById(docs, 'm26-item-karaage').name.en = 'Crispy Karaage';
  const sanity = fakeSanity(docs);
  const r = await cli(['--apply', '--overwrite-existing'], { sanity });
  assert.equal(r.code, 0, r.text);
  assert.match(r.text, /conflicts=1/);
  assert.ok(r.lines.includes('APPLIED transactionId=tx-1 patches=97 values=712'));
  assert.equal(docById(docsAsSanityHolds(sanity), 'm26-item-karaage').name.en, 'Karaage');
});

test('CLI --apply refuses on French drift (the French text changed in Studio) and on a missing document', async () => {
  const drift = frOnlyDocs(realMenu());
  docById(drift, 'm26-item-karaage').name.fr = 'Karaage maison';
  const a = fakeSanity(drift);
  const r1 = await cli(['--apply'], { sanity: a });
  assert.equal(r1.code, 1);
  assert.match(r1.text, /^FR DRIFT m26-item-karaage name sanity="Karaage maison" json="Karaage"$/m);
  assert.match(r1.text, /^ABORT: .*Nothing written\.$/m);
  assert.equal(a.state.commits.length, 0);

  const missing = frOnlyDocs(realMenu()).filter((d) => d._id !== 'm26-item-karaage');
  const b = fakeSanity(missing);
  const r2 = await cli(['--apply'], { sanity: b });
  assert.equal(r2.code, 1);
  assert.match(r2.text, /^MISSING DOC m26-item-karaage$/m);
  assert.match(r2.text, /^ABORT: .*Nothing written\.$/m);
  assert.equal(b.state.commits.length, 0);
  assert.equal(backupFiles(r2.root).length + backupFiles(r1.root).length, 0);
});

test('CLI --apply refuses while a draft is open; --include-drafts patches the draft too', async () => {
  const docs = frOnlyDocs(realMenu());
  const draft = { ...structuredClone(docById(docs, 'm26-item-karaage')), _id: 'drafts.m26-item-karaage', _rev: 'rev-draft' };
  const sanity = fakeSanity([...docs, draft]);
  const r1 = await cli(['--apply'], { sanity });
  assert.equal(r1.code, 1);
  assert.match(r1.text, /^DRAFT drafts\.m26-item-karaage$/m);
  assert.match(r1.text, /^ABORT: .*draft.*Nothing written\.$/m);
  assert.equal(sanity.state.commits.length, 0);

  const r2 = await cli(['--apply', '--include-drafts'], { sanity });
  assert.equal(r2.code, 0, r2.text);
  const karaageValues = patchTargets(translatedRealMenu()).filter((t) => t.docId === 'm26-item-karaage').length * 4;
  assert.ok(r2.lines.includes(`APPLIED transactionId=tx-1 patches=98 values=${712 + karaageValues}`), r2.text);
  assert.match(r2.text, /BACKUP .* documents=98/);
  const held = docsAsSanityHolds(sanity);
  assert.equal(docById(held, 'drafts.m26-item-karaage').name.zh, 'Karaage（日式炸鸡）');
  assert.equal(docById(held, 'm26-item-karaage').name.zh, 'Karaage（日式炸鸡）');
});

test('CLI --apply: a document edited between the read and the write aborts the whole transaction', async () => {
  const initial = frOnlyDocs(realMenu());
  const sanity = fakeSanity(initial);
  sanity.state.beforeCommit = (state) => {
    const doc = state.docs.find((d) => d._id === 'm26-item-karaage');
    doc._rev = 'rev-studio-edit'; // someone published in Studio meanwhile
  };
  const r = await cli(['--apply'], { sanity });
  assert.equal(r.code, 1);
  assert.match(r.text, /^ABORT: a document changed during the run \(.*m26-item-karaage.*\)\. Nothing written, rerun\.$/m);
  assert.equal(sanity.state.commits.length, 0);
  assert.ok(sanity.state.docs.every((d) => d.name.en === undefined), 'atomic: not one value was written');
});

test('CLI --apply: any other commit failure is reported as an unknown state, never as "nothing written"', async () => {
  const sanity = fakeSanity(frOnlyDocs(realMenu()));
  sanity.state.failCommit = Object.assign(new Error('socket hang up'), { statusCode: 504 });
  const r = await cli(['--apply'], { sanity });
  assert.equal(r.code, 1);
  assert.match(r.text, /socket hang up/);
  assert.ok(!/Nothing written/.test(r.text.split('BACKUP')[1] ?? ''));
  assert.match(r.text, /--dry-run/);
});

test('CLI --apply: the post-apply check fails when something other than a translation changed', async () => {
  const sanity = fakeSanity(frOnlyDocs(realMenu()));
  const baseMakeClient = sanity.makeClient;
  // a write that also changed a price (simulated by editing the document right after the commit)
  const makeClient = (config) => {
    const client = baseMakeClient(config);
    const tx = client.transaction.bind(client);
    client.transaction = () => {
      const t = tx();
      const commit = t.commit.bind(t);
      t.commit = async (o) => {
        const res = await commit(o);
        sanity.state.docs.find((d) => d._id === 'm26-item-karaage').price = 99;
        return res;
      };
      return t;
    };
    return client;
  };
  const r = await cli(['--apply'], { sanity: { ...sanity, makeClient } });
  assert.equal(r.code, 1);
  assert.match(r.text, /^POST-APPLY CHECK FAILED document m26-item-karaage changed outside the translations$/m);
  assert.ok(!r.text.includes('POST-APPLY CHECK OK'));
});

test('CLI --rollback --dry-run previews, then --rollback restores the French-only documents with a safety backup', async () => {
  const initial = frOnlyDocs(realMenu());
  const sanity = fakeSanity(initial);
  const root = makeRoot();
  assert.equal((await cli(['--apply'], { sanity, root })).code, 0);
  const [backupFile] = backupFiles(root);
  assert.equal(sanity.state.commits.length, 1);

  const preview = await cli(['--rollback', '--backup', backupFile, '--dry-run'], { sanity, root });
  assert.equal(preview.code, 0, preview.text);
  assert.ok(!preview.text.includes('MENU JSON OK'), 'rollback needs no menu JSON');
  assert.ok(preview.lines.includes('Target: fakeproj/fakeset'));
  assert.ok(preview.lines.includes(`ROLLBACK PLAN backup=${backupFile.slice(root.length + 1)} docs=97 set=0 unset=712`));
  assert.equal(sanity.state.commits.length, 1, 'dry-run wrote nothing');

  const done = await cli(['--rollback', '--backup', backupFile], { sanity, root });
  assert.equal(done.code, 0, done.text);
  assert.match(done.text, /^SAFETY BACKUP .*-pre-rollback\.json documents=97$/m);
  assert.ok(done.lines.includes('ROLLBACK OK transactionId=tx-2'));
  assert.equal(sanity.state.commits.length, 2);
  const { ops } = sanity.state.commits[1];
  assert.ok(ops.every((op) => op.set === undefined && Array.isArray(op.unset) && op.unset.every((k) => /\.(en|de|it|zh)$/.test(k))));
  assert.deepEqual(withoutTranslations(docsAsSanityHolds(sanity)), withoutTranslations(initial));
  assert.ok(docsAsSanityHolds(sanity).every((d) => d.name.en === undefined && d.name.zh === undefined));
  assert.equal(backupFiles(root).length, 2);

  const again = await cli(['--rollback', '--backup', backupFile], { sanity, root });
  assert.equal(again.code, 0);
  assert.ok(again.lines.includes('ROLLBACK OK (nothing to do)'));
  assert.equal(sanity.state.commits.length, 2);
});

test('CLI --rollback accepts a bare file name from the backup folder and refuses another project or dataset', async () => {
  const sanity = fakeSanity(frOnlyDocs(realMenu()));
  const root = makeRoot();
  await cli(['--apply'], { sanity, root });
  const [backupFile] = backupFiles(root);
  const bare = backupFile.slice(backupFile.lastIndexOf('/') + 1);
  const ok = await cli(['--rollback', '--backup', bare, '--dry-run'], { sanity, root });
  assert.equal(ok.code, 0, ok.text);
  assert.match(ok.text, /ROLLBACK PLAN backup=\.planning\/phases\/14-traductions-en-de-it-zh\/backup\/translations-backup-/);

  const other = await cli(['--rollback', '--backup', bare, '--dry-run'], { sanity, root, env: { ...FAKE_ENV, NEXT_PUBLIC_SANITY_DATASET: 'other' } });
  assert.equal(other.code, 1);
  assert.match(other.errText, /backup of fakeproj\/fakeset, not fakeproj\/other/);
  const missing = await cli(['--rollback', '--backup', 'nope.json', '--dry-run'], { sanity, root });
  assert.equal(missing.code, 1);
  assert.match(missing.errText, /backup not found: nope\.json/);
  assert.equal(sanity.state.commits.length, 1);
});
