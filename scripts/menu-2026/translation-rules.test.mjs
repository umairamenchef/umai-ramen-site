/**
 * Tests for scripts/menu-2026/translation-rules.mjs (Phase 14, EN / DE / IT / ZH menu translations).
 *
 *   node --test scripts/menu-2026/translation-rules.test.mjs
 *
 * Real-file tests read menu-2026.json next to this file. They never assert that the real menu lacks
 * translations: they must keep passing after Plan 14-03 merges the overlays into menu-2026.json.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  BRANDS,
  FORBIDDEN_TEXT,
  GLOSSARY,
  INVARIANT_CATEGORY_NAMES,
  INVARIANT_ITEM_NAMES,
  INVARIANT_TEXTS,
  JP_TERMS,
  LEGACY_ABSENT,
  NOT_SIMPLIFIED,
  REQUIRED_GLOSSES,
  TRANSLATION_LOCALES,
  ZH_CATEGORY_GLOSS,
  ZH_ITEM_GLOSS,
  formatMenuJson,
  mergeTranslations,
  overlaySkeleton,
  translatableFields,
  validateTranslations,
} from './translation-rules.mjs';

const MENU_TEXT = readFileSync(new URL('./menu-2026.json', import.meta.url), 'utf8');
const realMenu = () => JSON.parse(MENU_TEXT);

// ── fixture: a small, fully translated menu that passes every rule ─────────────
const L = (fr, en = fr, de = fr, it = fr, zh = fr) => ({ fr, en, de, it, zh });

function fixture() {
  return {
    version: 1,
    categories: [
      {
        key: 'entrees',
        section: 'food',
        name: L('Entrées', 'Starters', 'Vorspeisen', 'Antipasti', '小吃'),
        items: [
          {
            key: 'karaage',
            name: L('Karaage', 'Karaage', 'Karaage', 'Karaage', 'Karaage（日式炸鸡）'),
            description: L(
              'Poulet mariné et frit maison',
              'Homemade marinated fried chicken',
              'Mariniertes und frittiertes Hähnchen, hausgemacht',
              'Pollo marinato e fritto, fatto in casa',
              '自制腌制炸鸡',
            ),
          },
          {
            key: 'gyozas',
            name: L('Gyozas', 'Gyozas', 'Gyozas', 'Gyozas', 'Gyozas（煎饺）'),
            description: L(
              'Raviolis grillés. Garniture au choix : poulet, porc ou légumes.',
              'Pan-fried dumplings. Filling of your choice: chicken, pork or vegetables.',
              'Gebratene Teigtaschen. Füllung nach Wahl: Huhn, Schwein oder Gemüse.',
              'Ravioli alla piastra. Ripieno a scelta: pollo, maiale o verdure.',
              '日式煎饺。馅料任选：鸡肉、猪肉或蔬菜。',
            ),
          },
        ],
      },
      {
        key: 'udon',
        section: 'food',
        name: L('Udon', 'Udon', 'Udon', 'Udon', 'Udon（乌冬面）'),
        description: L('Le midi seulement', 'Lunchtime only', 'Nur mittags', 'Solo a pranzo', '仅限午餐'),
        items: [
          {
            key: 'tantan-udon',
            name: L('Tantan Udon', 'Tantan Udon', 'Tantan Udon', 'Tantan Udon', 'Tantan Udon（担担乌冬面）'),
            description: L(
              'Udon au sésame, huile de piment, bœuf haché, pousses de soja, pak-choï, daikon et œuf onsen.',
              'Udon (thick wheat noodles) with sesame, chili oil, minced beef, bean sprouts, bok choy, daikon (radish) and onsen egg (slow-cooked).',
              'Udon (dicke Weizennudeln) mit Sesam, Chiliöl, Rinderhack, Sojasprossen, Pak Choi, Rettich (Daikon) und Onsen-Ei.',
              'Udon (noodles di grano spessi) al sesamo, olio al peperoncino, manzo macinato, germogli di soia, pak choi, daikon e uovo onsen.',
              '芝麻乌冬面，配辣油、牛肉末、豆芽、小白菜、白萝卜和温泉蛋。',
            ),
          },
          {
            key: 'udon-boeuf-cinq-epices',
            name: L(
              'Udon au bœuf aux cinq épices',
              'Five-spice beef udon',
              'Udon mit Fünf-Gewürze-Rind',
              'Udon al manzo alle cinque spezie',
              '五香牛肉乌冬面',
            ),
            description: L(
              'Bouillon tsuyu, bœuf haché aux cinq épices, œuf onsen et cébette.',
              'Tsuyu broth, five-spice minced beef, onsen egg (slow-cooked) and spring onion.',
              'Tsuyu-Brühe, Rinderhackfleisch mit Fünf-Gewürze-Mischung, Onsen-Ei und Frühlingszwiebel.',
              'Brodo tsuyu, manzo macinato alle cinque spezie, uovo onsen e cipollotto.',
              '日式酱油汤底，配五香牛肉末、温泉蛋和葱花。',
            ),
          },
        ],
      },
      {
        key: 'menu-enfant',
        section: 'food',
        name: L('Menu enfant', "Kids' menu", 'Kindermenü', 'Menù bambini', '儿童餐'),
        description: L(
          'Pour les enfants de moins de 10 ans.',
          'For children under 10.',
          'Für Kinder unter 10 Jahren.',
          'Per bambini sotto i 10 anni.',
          '适合10岁以下儿童。',
        ),
        footnote: L(
          "Inclus : un sirop à l'eau et une boule de glace au choix.",
          'Includes a syrup with water and a scoop of ice cream of your choice.',
          'Inklusive: ein Sirup mit Wasser und eine Eiskugel nach Wahl.',
          'Incluso: uno sciroppo con acqua e una pallina di gelato a scelta.',
          '含一杯果味糖浆水和一个自选口味冰淇淋球。',
        ),
        items: [
          {
            key: 'little-tokyo',
            name: L('Little Tokyo'),
            subgroup: L('Au choix', 'Your choice', 'Zur Auswahl', 'A scelta', '任选其一'),
            description: L(
              'Nouilles épaisses, deux karaage, edamame et demi-œuf mariné.',
              'Thick noodles, two karaage (fried chicken), edamame and half a marinated egg.',
              'Dicke Nudeln, zwei Karaage (frittiertes Hähnchen), Edamame und ein halbes mariniertes Ei.',
              'Noodles spessi, due karaage (pollo fritto), edamame e mezzo uovo marinato.',
              '粗面、两块日式炸鸡、毛豆和半颗溏心蛋。',
            ),
          },
          {
            key: 'mini-ramen',
            name: L('Mini Ramen', 'Mini Ramen', 'Mini Ramen', 'Mini Ramen', 'Mini Ramen（迷你拉面）'),
            subgroup: L('Au choix', 'Your choice', 'Zur Auswahl', 'A scelta', '任选其一'),
            description: L('Tokyo ou Miso.', 'Tokyo or Miso.', 'Tokyo oder Miso.', 'Tokyo o Miso.', '东京拉面或味噌拉面。'),
          },
        ],
      },
      {
        key: 'bieres',
        section: 'drinks',
        name: L('Bières', 'Beers', 'Biere', 'Birre', '啤酒'),
        items: [
          { key: 'asahi', name: L('Asahi ~ 5°'), subgroup: L('Pressions', 'Draught', 'Vom Fass', 'Alla spina', '生啤') },
          { key: 'asahi-yuzu', name: L('Asahi Yuzu'), subgroup: L('Pressions', 'Draught', 'Vom Fass', 'Alla spina', '生啤') },
        ],
      },
      {
        key: 'spritz',
        section: 'drinks',
        name: L('Spritz', 'Spritz', 'Spritz', 'Spritz', 'Spritz（气泡鸡尾酒）'),
        description: L('25cl'),
        items: [
          {
            key: 'nana-spritz',
            name: L('Nana Spritz'),
            description: L(
              'Rose, Litchi, Framboise, Prosecco et eau pétillante',
              'Rose, Lychee, Raspberry, Prosecco and sparkling water',
              'Rose, Litschi, Himbeere, Prosecco und Sprudelwasser',
              'Rosa, Litchi, Lampone, Prosecco e acqua frizzante',
              '玫瑰、荔枝、覆盆子、普罗塞克起泡酒和气泡水',
            ),
          },
        ],
      },
      {
        key: 'softs',
        section: 'drinks',
        name: L('Softs', 'Soft drinks', 'Softdrinks', 'Bibite', '软饮'),
        items: [
          {
            key: 'ramune',
            name: L('Ramune', 'Ramune', 'Ramune', 'Ramune', 'Ramune（波子汽水）'),
            description: L(
              'Au choix : yuzu, fraise ou litchi.',
              'Japanese soda, choice of yuzu, strawberry or lychee.',
              'Japanische Limonade, nach Wahl: Yuzu, Erdbeere oder Litschi.',
              'Bibita giapponese, a scelta: yuzu, fragola o litchi.',
              '日本波子汽水，可选：柚子、草莓或荔枝口味。',
            ),
          },
          {
            key: 'diabolo',
            name: L('Diabolo', 'Diabolo', 'Diabolo', 'Diabolo', 'Diabolo（果味汽水）'),
            description: L(
              'grenadine, fraise, citron, pêche, litchi, passion ou rose.',
              'Lemonade with syrup: grenadine, strawberry, lemon, peach, lychee, passion fruit or rose.',
              'Limonade mit Sirup: Grenadine, Erdbeere, Zitrone, Pfirsich, Litschi, Passionsfrucht oder Rose.',
              'Limonata con sciroppo: granatina, fragola, limone, pesca, litchi, frutto della passione o rosa.',
              '柠檬汽水加糖浆：红石榴、草莓、柠檬、蜜桃、荔枝、百香果或玫瑰。',
            ),
          },
        ],
      },
      {
        key: 'sakes-japonais',
        section: 'drinks',
        name: L('Sakés japonais', 'Japanese sake', 'Japanischer Sake', 'Sakè giapponesi', '日本清酒'),
        description: L(
          'Service de 10cl, sauf trio.',
          'Served in 10cl glasses, except the tasting trio.',
          'Ausschank zu 10cl, außer Verkostungs-Trio.',
          'Servito da 10cl, tranne il trio degustazione.',
          '每杯10cl（品鉴三杯除外）。',
        ),
        items: [
          {
            key: 'trio-degustation',
            name: L('Trio dégustation', 'Tasting trio', 'Verkostungs-Trio', 'Trio degustazione', '清酒品鉴三杯'),
            description: L(
              'Trois sakés sélectionnés par notre équipe.',
              'Three sakes selected by our team.',
              'Drei von unserem Team ausgewählte Sakes.',
              'Tre sakè selezionati dal nostro team.',
              '由本店团队精选的三款清酒。',
            ),
            prices: [{ label: L('3 × 6cl'), price: 18 }],
          },
        ],
      },
      {
        key: 'cafes-thes',
        section: 'drinks',
        name: L('Cafés & Thés', 'Coffee & Tea', 'Kaffee & Tee', 'Caffè e tè', '咖啡与茶'),
        items: [
          {
            key: 'thes-verts-japonais',
            name: L('Thés verts japonais', 'Japanese green teas', 'Japanische Grüntees', 'Tè verdi giapponesi', '日本绿茶'),
            description: L(
              'Au choix : genmaïcha, sencha, Fleur de Geisha, sencha agrumes ou Grand jasmin Chun Feng.',
              'Choice of genmaicha, sencha, Fleur de Geisha, citrus sencha or Grand jasmin Chun Feng.',
              'Nach Wahl: Genmaicha, Sencha, Fleur de Geisha, Zitrus-Sencha oder Grand jasmin Chun Feng.',
              'A scelta: genmaicha, sencha, Fleur de Geisha, sencha agli agrumi o Grand jasmin Chun Feng.',
              '可选：玄米茶、煎茶、Fleur de Geisha、柑橘煎茶或 Grand jasmin Chun Feng。',
            ),
          },
        ],
      },
    ],
  };
}

const cat = (menu, key) => menu.categories.find((c) => c.key === key);
const item = (menu, key) => menu.categories.flatMap((c) => c.items).find((i) => i.key === key);
/** true when an error is exactly `head` or starts with `head ` (rule id + path, then details). */
const has = (errors, head) => errors.some((e) => e === head || e.startsWith(`${head} `));
const rulesOf = (errors) => [...new Set(errors.map((e) => e.split(' ')[0]))].sort();

/** Apply `mutate` to a fresh fixture and return the validation errors. */
function errorsAfter(mutate, options) {
  const m = fixture();
  mutate(m);
  return validateTranslations(m, options);
}

function assertHas(mutate, head, options) {
  const errors = errorsAfter(mutate, options);
  assert.ok(has(errors, head), `expected « ${head} » in ${JSON.stringify(errors, null, 2)}`);
  return errors;
}

// ── translatableFields ────────────────────────────────────────────────────────

test('translatableFields: the 178 fields of the real menu, by field, in print order', () => {
  const menu = realMenu();
  const fields = translatableFields(menu);
  assert.equal(fields.length, 178);
  const byField = {};
  for (const f of fields) byField[f.field] = (byField[f.field] ?? 0) + 1;
  assert.deepEqual(byField, { name: 97, description: 58, subgroup: 21, label: 1, footnote: 1 });
  assert.equal(new Set(fields.map((f) => f.path)).size, 178, 'paths are unique');
  assert.equal(fields[0].path, 'categories.entrees.name');
  assert.equal(fields[1].path, 'items.karaage.name');
  assert.equal(fields[2].path, 'items.karaage.description');
  const label = fields.find((f) => f.path === 'items.trio-degustation.prices[0].label');
  assert.ok(label, 'trio label present');
  assert.equal(label.field, 'label');
  assert.equal(label.index, 0);
  assert.equal(label.value.fr, '3 × 6cl');
  const sub = fields.findIndex((f) => f.path === 'items.mini-ramen.subgroup');
  assert.equal(fields[sub + 1].path, 'categories.menu-enfant.footnote');
  assert.equal(fields.at(-1).path, 'items.infusions.description');
  for (const f of fields) assert.ok(typeof f.value.fr === 'string' && f.value.fr.trim() !== '', f.path);
});

test('translatableFields: entry shape, value is the Loc object itself, section filter', () => {
  const menu = realMenu();
  const fields = translatableFields(menu);
  assert.equal(fields[0].value, menu.categories[0].name, 'value is the Loc object (same reference)');
  const desc = fields.find((f) => f.path === 'items.karaage.description');
  assert.deepEqual(
    { scope: desc.scope, catKey: desc.catKey, key: desc.key, field: desc.field },
    { scope: 'item', catKey: 'entrees', key: 'karaage', field: 'description' },
  );
  assert.equal(desc.index, undefined);
  const catName = fields.find((f) => f.path === 'categories.udon.description');
  assert.deepEqual(
    { scope: catName.scope, catKey: catName.catKey, key: catName.key, field: catName.field },
    { scope: 'category', catKey: 'udon', key: 'udon', field: 'description' },
  );
  const food = translatableFields(menu, { section: 'food' });
  const drinks = translatableFields(menu, { section: 'drinks' });
  assert.equal(food.length, 71);
  assert.equal(drinks.length, 107);
  assert.equal(food.at(-1).path, 'items.boule-de-glace.description');
  assert.equal(drinks[0].path, 'categories.bieres.name');
});

test('translatableFields: skips Loc objects without a non-empty fr and price variants without a label', () => {
  const menu = {
    categories: [
      {
        key: 'c',
        section: 'food',
        name: { fr: 'Nom' },
        description: { fr: '' },
        footnote: { fr: '   ' },
        items: [
          { key: 'a', name: { fr: 'A' }, description: 'not a Loc', subgroup: { en: 'only en' }, prices: [{ quantity: 1, unit: 'pcs', price: 2 }] },
          { key: 'b', name: { fr: 'B' }, prices: [{ quantity: 1, unit: 'pcs', price: 2 }, { label: { fr: 'Grand' }, price: 3 }] },
        ],
      },
    ],
  };
  assert.deepEqual(
    translatableFields(menu).map((f) => f.path),
    ['categories.c.name', 'items.a.name', 'items.b.name', 'items.b.prices[1].label'],
  );
  assert.deepEqual(translatableFields({}), []);
});

// ── formatMenuJson ────────────────────────────────────────────────────────────

test('formatMenuJson: byte-exact round-trip of menu-2026.json', () => {
  assert.equal(formatMenuJson(JSON.parse(MENU_TEXT)), MENU_TEXT);
});

test('formatMenuJson: idempotent on a translated menu, parses back to the same data', () => {
  const menu = realMenu();
  for (const f of translatableFields(menu)) {
    Object.assign(f.value, { en: `${f.value.fr} (en)`, de: `${f.value.fr} (de)`, it: `${f.value.fr} (it)`, zh: '中文' });
  }
  const out = formatMenuJson(menu);
  assert.ok(out.endsWith('}\n'));
  assert.deepEqual(JSON.parse(out), menu);
  assert.equal(formatMenuJson(JSON.parse(out)), out);
});

test('formatMenuJson: file style (structural objects multi-line, short values on one line)', () => {
  const out = formatMenuJson({
    version: 1,
    categories: [
      {
        key: 'c',
        section: 'food',
        name: { fr: 'Nom', en: 'Name' },
        items: [{ key: 'i', name: { fr: 'X' }, prices: [{ quantity: 3, unit: 'pcs', price: 5.5 }], legacyIds: ['a', 'b'] }],
      },
    ],
  });
  assert.equal(
    out,
    [
      '{',
      '  "version": 1,',
      '  "categories": [',
      '    {',
      '      "key": "c",',
      '      "section": "food",',
      '      "name": { "fr": "Nom", "en": "Name" },',
      '      "items": [',
      '        {',
      '          "key": "i",',
      '          "name": { "fr": "X" },',
      '          "prices": [{ "quantity": 3, "unit": "pcs", "price": 5.5 }],',
      '          "legacyIds": ["a", "b"]',
      '        }',
      '      ]',
      '    }',
      '  ]',
      '}',
      '',
    ].join('\n'),
  );
});

// ── overlaySkeleton ───────────────────────────────────────────────────────────

/** Every string leaf of a value, with its path. */
function leaves(value, path = '', out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k, out);
  return out;
}

test('overlaySkeleton: food = 8 categories, 30 items, 284 empty strings, fr copied from the menu', () => {
  const menu = realMenu();
  const sk = overlaySkeleton(menu, 'food');
  assert.equal(sk.version, 1);
  assert.equal(sk.section, 'food');
  assert.deepEqual(Object.keys(sk), ['version', 'section', 'categories', 'items']);
  assert.equal(Object.keys(sk.categories).length, 8);
  assert.equal(Object.keys(sk.items).length, 30);
  assert.deepEqual(Object.keys(sk.categories).slice(0, 2), ['entrees', 'tantan-umai']);
  const strings = leaves(sk);
  assert.equal(strings.filter(([p, v]) => v === '' && /\.(en|de|it|zh)$/.test(p)).length, 284);
  assert.equal(strings.filter(([, v]) => v === '').length, 284);
  assert.deepEqual(sk.categories['menu-enfant'], {
    name: { fr: 'Menu enfant', en: '', de: '', it: '', zh: '' },
    description: { fr: 'Pour les enfants de moins de 10 ans.', en: '', de: '', it: '', zh: '' },
    footnote: { fr: "Inclus : un sirop à l'eau et une boule de glace au choix.", en: '', de: '', it: '', zh: '' },
  });
  // every fr equals the menu's fr, field for field
  const frs = strings.filter(([p]) => p.endsWith('.fr'));
  assert.equal(frs.length, 71);
  const menuFr = new Map(translatableFields(menu, { section: 'food' }).map((f) => [f.path, f.value.fr]));
  for (const [p, v] of frs) assert.equal(v, menuFr.get(p.replace(/\.fr$/, '')), p);
  for (const it of Object.values(sk.items)) assert.equal(it.prices, undefined, 'no labelled variant on the food side');
});

test('overlaySkeleton: drinks = 12 categories, 47 items, 428 empty strings, prices only for labelled variants', () => {
  const sk = overlaySkeleton(realMenu(), 'drinks');
  assert.equal(Object.keys(sk.categories).length, 12);
  assert.equal(Object.keys(sk.items).length, 47);
  assert.equal(leaves(sk).filter(([, v]) => v === '').length, 428);
  const withPrices = Object.entries(sk.items).filter(([, it]) => it.prices !== undefined);
  assert.deepEqual(withPrices, [['trio-degustation', sk.items['trio-degustation']]]);
  assert.deepEqual(sk.items['trio-degustation'].prices, [{ label: { fr: '3 × 6cl', en: '', de: '', it: '', zh: '' } }]);
  assert.deepEqual(Object.keys(sk.items['trio-degustation']), ['name', 'description', 'prices']);
  assert.deepEqual(Object.keys(sk.items['chardonnay-naturalys']), ['name', 'description', 'subgroup']);
});

test('overlaySkeleton: prices entries are null for variants without a label', () => {
  const menu = {
    categories: [
      { key: 'c', section: 'drinks', name: { fr: 'C' }, items: [{ key: 'b', name: { fr: 'B' }, prices: [{ quantity: 1, unit: 'cl', price: 2 }, { label: { fr: 'Grand' }, price: 3 }] }] },
      { key: 'f', section: 'food', name: { fr: 'F' }, items: [{ key: 'x', name: { fr: 'X' }, price: 1 }] },
    ],
  };
  const sk = overlaySkeleton(menu, 'drinks');
  assert.deepEqual(sk, {
    version: 1,
    section: 'drinks',
    categories: { c: { name: { fr: 'C', en: '', de: '', it: '', zh: '' } } },
    items: { b: { name: { fr: 'B', en: '', de: '', it: '', zh: '' }, prices: [null, { label: { fr: 'Grand', en: '', de: '', it: '', zh: '' } }] } },
  });
});

test('overlaySkeleton: the real skeletons merge into the real menu without any merge error', () => {
  const menu = realMenu();
  const { errors } = mergeTranslations(menu, [overlaySkeleton(menu, 'food'), overlaySkeleton(menu, 'drinks')]);
  assert.deepEqual(errors, []);
});

// ── mergeTranslations ─────────────────────────────────────────────────────────

const baseMenu = () => ({
  version: 1,
  categories: [
    {
      key: 'udon',
      section: 'food',
      name: { fr: 'Udon' },
      description: { fr: 'Le midi seulement' },
      items: [{ key: 'tantan-udon', name: { fr: 'Tantan Udon' }, price: 15.9 }],
    },
    {
      key: 'sakes-japonais',
      section: 'drinks',
      name: { fr: 'Sakés japonais' },
      items: [
        {
          key: 'trio-degustation',
          name: { fr: 'Trio dégustation' },
          prices: [
            { quantity: 10, unit: 'cl', price: 9.8 },
            { label: { fr: '3 × 6cl' }, price: 18 },
          ],
        },
      ],
    },
  ],
});

const foodOverlay = () => ({
  version: 1,
  section: 'food',
  categories: {
    udon: {
      // keys deliberately out of order: the merge writes fr, en, de, it, zh
      name: { zh: 'Udon（乌冬面）', fr: 'Udon', it: 'Udon', de: 'Udon', en: 'Udon' },
      description: { fr: 'Le midi seulement', en: 'Lunchtime only', de: 'Nur mittags', it: 'Solo a pranzo', zh: '仅限午餐' },
    },
  },
  items: {
    'tantan-udon': { name: { fr: 'Tantan Udon', en: 'Tantan Udon', de: 'Tantan Udon', it: 'Tantan Udon', zh: 'Tantan Udon（担担乌冬面）' } },
  },
});

const drinksOverlay = () => ({
  version: 1,
  section: 'drinks',
  categories: {
    'sakes-japonais': { name: { fr: 'Sakés japonais', en: 'Japanese sake', de: 'Japanischer Sake', it: 'Sakè giapponesi', zh: '日本清酒' } },
  },
  items: {
    'trio-degustation': {
      name: { fr: 'Trio dégustation', en: 'Tasting trio', de: 'Verkostungs-Trio', it: 'Trio degustazione', zh: '清酒品鉴三杯' },
      prices: [null, { label: { fr: '3 × 6cl', en: '3 × 6cl', de: '3 × 6cl', it: '3 × 6cl', zh: '3 × 6cl' } }],
    },
  },
});

test('mergeTranslations: copies en/de/it/zh into a deep copy (key order fr, en, de, it, zh), inputs untouched', () => {
  const base = baseMenu();
  const overlays = [foodOverlay(), drinksOverlay()];
  const snapshot = structuredClone({ base, overlays });
  const { menu, errors } = mergeTranslations(base, overlays);
  assert.deepEqual(errors, []);
  assert.deepEqual({ base, overlays }, snapshot, 'inputs are not mutated');
  assert.notEqual(menu, base);
  assert.notEqual(menu.categories[0], base.categories[0]);
  const udon = menu.categories[0];
  assert.deepEqual(udon.name, { fr: 'Udon', en: 'Udon', de: 'Udon', it: 'Udon', zh: 'Udon（乌冬面）' });
  assert.deepEqual(Object.keys(udon.name), ['fr', 'en', 'de', 'it', 'zh']);
  assert.equal(udon.description.en, 'Lunchtime only');
  assert.equal(udon.items[0].name.zh, 'Tantan Udon（担担乌冬面）');
  const trio = menu.categories[1].items[0];
  assert.deepEqual(trio.prices[0], { quantity: 10, unit: 'cl', price: 9.8 });
  assert.deepEqual(trio.prices[1], { label: { fr: '3 × 6cl', en: '3 × 6cl', de: '3 × 6cl', it: '3 × 6cl', zh: '3 × 6cl' }, price: 18 });
  assert.equal(base.categories[1].items[0].prices[1].label.en, undefined);
});

test('mergeTranslations: a missing overlay entry is not a merge error', () => {
  const overlay = foodOverlay();
  delete overlay.categories.udon.description;
  delete overlay.items['tantan-udon'];
  const { menu, errors } = mergeTranslations(baseMenu(), [overlay]);
  assert.deepEqual(errors, []);
  assert.deepEqual(menu.categories[0].description, { fr: 'Le midi seulement' });
  assert.deepEqual(mergeTranslations(baseMenu(), []).errors, []);
});

test('mergeTranslations: STALE when the overlay fr differs from the menu fr (translation not applied)', () => {
  const overlay = foodOverlay();
  overlay.categories.udon.description.fr = 'Le soir seulement';
  const { menu, errors } = mergeTranslations(baseMenu(), [overlay]);
  assert.ok(has(errors, 'STALE categories.udon.description'), JSON.stringify(errors));
  assert.equal(errors.length, 1);
  assert.equal(menu.categories[0].description.en, undefined);
  const noFr = foodOverlay();
  delete noFr.items['tantan-udon'].name.fr;
  assert.ok(has(mergeTranslations(baseMenu(), [noFr]).errors, 'STALE items.tantan-udon.name'));
});

test('mergeTranslations: ORPHAN for an overlay entry with no FR field in the menu', () => {
  const overlay = foodOverlay();
  overlay.items.ghost = { name: { fr: 'Fantôme', en: 'Ghost' } };
  overlay.categories.udon.footnote = { fr: 'Note', en: 'Note' };
  const drinks = drinksOverlay();
  drinks.items['trio-degustation'].prices = [{ label: { fr: '10cl', en: '10cl' } }, null];
  const { errors } = mergeTranslations(baseMenu(), [overlay, drinks]);
  assert.ok(has(errors, 'ORPHAN items.ghost.name'), JSON.stringify(errors));
  assert.ok(has(errors, 'ORPHAN categories.udon.footnote'), JSON.stringify(errors));
  assert.ok(has(errors, 'ORPHAN items.trio-degustation.prices[0].label'), JSON.stringify(errors));
  assert.equal(errors.length, 3);
});

test('mergeTranslations: DUPLICATE when two overlays define the same field', () => {
  const { errors } = mergeTranslations(baseMenu(), [foodOverlay(), foodOverlay()]);
  assert.deepEqual(errors.map((e) => e.split(' ').slice(0, 2).join(' ')).sort(), [
    'DUPLICATE categories.udon.description',
    'DUPLICATE categories.udon.name',
    'DUPLICATE items.tantan-udon.name',
  ]);
});

test('mergeTranslations: CONFLICT when the menu already holds a different non-empty value; re-merge is clean', () => {
  const base = baseMenu();
  base.categories[0].name.en = 'Udon noodles';
  const { menu, errors } = mergeTranslations(base, [foodOverlay()]);
  assert.ok(has(errors, 'CONFLICT categories.udon.name.en'), JSON.stringify(errors));
  assert.equal(errors.length, 1);
  assert.equal(menu.categories[0].name.en, 'Udon noodles', 'the menu value is kept');
  // merging an overlay into its own merge result: same values, no conflict (Plan 14-03 re-runs)
  const once = mergeTranslations(baseMenu(), [foodOverlay(), drinksOverlay()]).menu;
  const twice = mergeTranslations(once, [foodOverlay(), drinksOverlay()]);
  assert.deepEqual(twice.errors, []);
  assert.deepEqual(twice.menu, once);
  // a blank overlay value never overrides nor conflicts with a menu value
  const blank = foodOverlay();
  blank.categories.udon.name.en = '';
  const kept = mergeTranslations(once, [blank]);
  assert.deepEqual(kept.errors, []);
  assert.equal(kept.menu.categories[0].name.en, 'Udon');
});

test('mergeTranslations: OVERLAY errors for a bad shape', () => {
  const cases = [
    (o) => {
      o.version = 2;
    },
    (o) => {
      o.items['tantan-udon'] = 'Tantan Udon';
    },
    (o) => {
      o.items['tantan-udon'].name = 'Tantan Udon';
    },
    (o) => {
      o.items['tantan-udon'].name.en = 5;
    },
    (o) => {
      o.items['tantan-udon'].name.jp = '担々麺';
    },
    (o) => {
      o.items['tantan-udon'].price = 15.9;
    },
    (o) => {
      o.extra = true;
    },
    (o) => {
      o.categories = [];
    },
  ];
  for (const mutate of cases) {
    const overlay = foodOverlay();
    mutate(overlay);
    const { errors } = mergeTranslations(baseMenu(), [overlay]);
    assert.ok(errors.some((e) => e.startsWith('OVERLAY ')), `${mutate} → ${JSON.stringify(errors)}`);
  }
  assert.ok(mergeTranslations(baseMenu(), ['not an object']).errors[0].startsWith('OVERLAY '));
  const prices = drinksOverlay();
  prices.items['trio-degustation'].prices = [null];
  assert.ok(mergeTranslations(baseMenu(), [prices]).errors.some((e) => e.startsWith('OVERLAY ')), 'prices length must match the menu');
  const wrongSection = drinksOverlay();
  wrongSection.section = 'food';
  assert.ok(mergeTranslations(baseMenu(), [wrongSection]).errors.some((e) => e.startsWith('OVERLAY ')), 'entries must belong to the overlay section');
});

// ── validateTranslations ──────────────────────────────────────────────────────

test('validateTranslations: the fully translated fixture passes every rule', () => {
  assert.deepEqual(validateTranslations(fixture()), []);
  assert.deepEqual(validateTranslations(fixture(), { section: 'food' }), []);
  assert.deepEqual(validateTranslations(fixture(), { section: 'drinks' }), []);
});

test('MISSING: absent, non-string or blank values, exactly one error each, other rules skip them', () => {
  const errors = errorsAfter((m) => {
    const k = item(m, 'karaage');
    delete k.name.en;
    k.name.de = 42;
    k.name.it = '   ';
    k.description.zh = '';
    item(m, 'tantan-udon').description.en = ''; // would also fail GLOSS
    item(m, 'asahi-yuzu').subgroup.en = ' '; // would also fail SUBGROUP
  });
  assert.deepEqual(errors, [
    'MISSING items.karaage.name.en',
    'MISSING items.karaage.name.de',
    'MISSING items.karaage.name.it',
    'MISSING items.karaage.description.zh',
    'MISSING items.tantan-udon.description.en',
    'MISSING items.asahi-yuzu.subgroup.en',
  ]);
});

test('INVARIANT: Japanese names, brands and sizes identical to FR, ZH gloss exactly « fr（gloss） »', () => {
  assertHas((m) => (item(m, 'karaage').name.en = 'Karage'), 'INVARIANT items.karaage.name.en');
  assertHas((m) => (item(m, 'karaage').name.zh = '日式炸鸡'), 'INVARIANT items.karaage.name.zh');
  assertHas((m) => (item(m, 'karaage').name.zh = 'Karaage(日式炸鸡)'), 'INVARIANT items.karaage.name.zh');
  assertHas((m) => (item(m, 'karaage').name.zh = 'Karaage'), 'INVARIANT items.karaage.name.zh');
  assertHas((m) => (item(m, 'little-tokyo').name.zh = 'Little Tokyo（小东京）'), 'INVARIANT items.little-tokyo.name.zh');
  assertHas((m) => (cat(m, 'spritz').description.en = '25 cl'), 'INVARIANT categories.spritz.description.en');
  assertHas((m) => (cat(m, 'udon').name.de = 'Udon-Nudeln'), 'INVARIANT categories.udon.name.de');
  assertHas((m) => (item(m, 'trio-degustation').prices[0].label.zh = '3 × 6 cl'), 'INVARIANT items.trio-degustation.prices[0].label.zh');
});

test('BRAND: a brand of the FR text is kept verbatim, never glued to a Chinese character', () => {
  assertHas(
    (m) => (item(m, 'thes-verts-japonais').description.en = 'Choice of genmaicha, sencha, citrus sencha or Grand jasmin Chun Feng.'),
    'BRAND items.thes-verts-japonais.description.en',
  );
  assertHas(
    (m) => (item(m, 'thes-verts-japonais').description.zh = '可选：玄米茶、煎茶、Fleur de Geisha、柑橘煎茶或Grand jasmin Chun Feng。'),
    'BRAND items.thes-verts-japonais.description.zh',
  );
  assertHas(
    (m) => (item(m, 'thes-verts-japonais').description.de = 'Nach Wahl: Genmaicha, Sencha, Fleur de geisha, Zitrus-Sencha oder Grand jasmin Chun Feng.'),
    'BRAND items.thes-verts-japonais.description.de',
  );
});

test('JPTERM: Japanese terms of the FR text stay in EN/DE/IT, diacritics-insensitive', () => {
  const errors = assertHas(
    (m) => (item(m, 'little-tokyo').description.en = 'Thick noodles, two pieces of fried chicken, edamame and half a marinated egg.'),
    'JPTERM items.little-tokyo.description.en',
  );
  assert.deepEqual(rulesOf(errors), ['JPTERM']);
  // « genmaïcha » (FR) is satisfied by « genmaicha », and the other way round
  assert.deepEqual(
    errorsAfter((m) => (item(m, 'thes-verts-japonais').description.it = 'A scelta: genmaïcha, sencha, Fleur de Geisha, sencha agli agrumi o Grand jasmin Chun Feng.')),
    [],
  );
  // ZH is exempt (Chinese names: 玄米茶, 煎茶)
  assert.deepEqual(validateTranslations(fixture()).filter((e) => e.startsWith('JPTERM')), []);
});

test('GLOSSARY: the CONTEXT renderings and the meat identity are enforced', () => {
  assertHas(
    (m) => (item(m, 'tantan-udon').description.en = item(fixture(), 'tantan-udon').description.en.replace('bok choy', 'pak choi')),
    'GLOSSARY items.tantan-udon.description.en',
  );
  assertHas(
    (m) => (item(m, 'udon-boeuf-cinq-epices').description.de = 'Tsuyu-Brühe, Hackfleisch, Onsen-Ei und Frühlingszwiebel.'),
    'GLOSSARY items.udon-boeuf-cinq-epices.description.de',
  );
  assertHas(
    (m) => (item(m, 'gyozas').description.zh = '日式煎饺。馅料任选：鸡肉、牛肉或蔬菜。'),
    'GLOSSARY items.gyozas.description.zh',
  );
  assertHas((m) => (item(m, 'udon-boeuf-cinq-epices').name.it = 'Udon alle cinque spezie'), 'GLOSSARY items.udon-boeuf-cinq-epices.name.it');
});

test('NUMBERS: every number of the FR text is kept', () => {
  const errors = assertHas((m) => (cat(m, 'menu-enfant').description.en = 'For children under ten.'), 'NUMBERS categories.menu-enfant.description.en');
  assert.deepEqual(rulesOf(errors), ['NUMBERS']);
  assertHas((m) => (cat(m, 'sakes-japonais').description.de = 'Ausschank zu 10cl, außer 3er-Verkostungs-Trio.'), 'NUMBERS categories.sakes-japonais.description.de');
});

test('SCRIPT: simplified Chinese only, full-width punctuation, Hanzi only in ZH', () => {
  const zh = (key, value) => (m) => (item(m, key).description.zh = value);
  assertHas(zh('mini-ramen', '东京拉麵或味噌拉麵。'), 'SCRIPT items.mini-ramen.description.zh');
  assertHas(zh('mini-ramen', '东京拉面或味噌拉面々。'), 'SCRIPT items.mini-ramen.description.zh');
  assertHas(zh('mini-ramen', '东京ラーメン或味噌拉面。'), 'SCRIPT items.mini-ramen.description.zh');
  assertHas((m) => (cat(m, 'menu-enfant').description.zh = '适合１０岁以下儿童。'), 'SCRIPT categories.menu-enfant.description.zh');
  assertHas(zh('gyozas', '日式煎饺。馅料任选：鸡肉,猪肉或蔬菜。'), 'SCRIPT items.gyozas.description.zh');
  assertHas((m) => (item(m, 'trio-degustation').name.zh = '清酒品鉴(三杯)'), 'SCRIPT items.trio-degustation.name.zh');
  assertHas((m) => (item(m, 'trio-degustation').name.en = 'Tasting trio 三'), 'SCRIPT items.trio-degustation.name.en');
  assertHas((m) => (cat(m, 'entrees').name.zh = 'Starters'), 'SCRIPT categories.entrees.name.zh');
  assertHas(zh('mini-ramen', '东京拉面 或味噌拉面。'), 'SCRIPT items.mini-ramen.description.zh');
  // a no-gloss invariant name and an invariant text need no Hanzi
  assert.deepEqual(validateTranslations(fixture()).filter((e) => e.startsWith('SCRIPT')), []);
  assert.equal(item(fixture(), 'asahi').name.zh, 'Asahi ~ 5°');
});

test('TYPO: no em-dash, no typographic apostrophe, no stray or double space, no French spacing in EN/DE/IT', () => {
  assertHas((m) => (item(m, 'karaage').description.en = 'Homemade marinated — fried chicken'), 'TYPO items.karaage.description.en');
  assertHas((m) => (cat(m, 'menu-enfant').name.en = 'Kids’ menu'), 'TYPO categories.menu-enfant.name.en');
  assertHas((m) => (cat(m, 'udon').description.en = 'Lunchtime  only'), 'TYPO categories.udon.description.en');
  assertHas((m) => (cat(m, 'udon').description.de = ' Nur mittags'), 'TYPO categories.udon.description.de');
  assertHas((m) => (item(m, 'ramune').description.en = 'Japanese soda, choice : yuzu, strawberry or lychee.'), 'TYPO items.ramune.description.en');
});

test('FORBIDDEN: the live verifier absent list (?? , Asashi, formules title, legacy names)', () => {
  assertHas((m) => (cat(m, 'menu-enfant').name.zh = '儿童套餐'), 'FORBIDDEN categories.menu-enfant.name.zh');
  assertHas((m) => (item(m, 'karaage').description.en = 'Homemade marinated fried chicken, Kimchi'), 'FORBIDDEN items.karaage.description.en');
  assertHas((m) => (cat(m, 'udon').description.it = 'Solo a pranzo ??'), 'FORBIDDEN categories.udon.description.it');
  assertHas((m) => (cat(m, 'menu-enfant').name.en = 'Our Set Menus'), 'FORBIDDEN categories.menu-enfant.name.en');
});

test('SUBGROUP: the same FR sub-group has the same translation everywhere', () => {
  const errors = errorsAfter((m) => (item(m, 'asahi-yuzu').subgroup.en = 'On tap'));
  assert.equal(errors.length, 1, JSON.stringify(errors));
  assert.ok(errors[0].startsWith('SUBGROUP "Pressions".en "Draught" vs "On tap"'), errors[0]);
});

test('LENGTH: descriptions and footnotes stay close to the FR length', () => {
  assertHas(
    (m) =>
      (item(m, 'karaage').description.en =
        'Homemade chicken, marinated in our kitchen for a whole night, then fried twice until golden and crisp'),
    'LENGTH items.karaage.description.en',
  );
  assertHas((m) => (cat(m, 'menu-enfant').footnote.zh = '含糖浆水。'), 'LENGTH categories.menu-enfant.footnote.zh');
  // names are not length-checked
  assert.deepEqual(
    errorsAfter((m) => (item(m, 'trio-degustation').name.en = 'Tasting trio of three Japanese sakes selected by our team, served in small glasses')),
    [],
  );
});

test('GLOSS: the three FR texts that do not say what the dish is get the required gloss', () => {
  assert.deepEqual(
    errorsAfter(
      (m) =>
        (item(m, 'tantan-udon').description.en =
          'Udon with sesame, chili oil, minced beef, bean sprouts, bok choy, daikon (radish) and onsen egg (slow-cooked).'),
    ),
    ['GLOSS items.tantan-udon.description.en "wheat noodles"'],
  );
  assertHas((m) => (item(m, 'ramune').description.de = 'Nach Wahl: Yuzu, Erdbeere oder Litschi.'), 'GLOSS items.ramune.description.de');
  assertHas(
    (m) => (item(m, 'diabolo').description.zh = '红石榴、草莓、柠檬、蜜桃、荔枝、百香果或玫瑰。'),
    'GLOSS items.diabolo.description.zh',
  );
});

test('validateTranslations: the section option limits the check to food or drinks', () => {
  const mutate = (m) => (item(m, 'asahi').name.en = 'Asahi beer');
  assert.deepEqual(errorsAfter(mutate, { section: 'food' }), []);
  assert.ok(has(errorsAfter(mutate, { section: 'drinks' }), 'INVARIANT items.asahi.name.en'));
  assert.ok(has(errorsAfter(mutate), 'INVARIANT items.asahi.name.en'));
});

test('validateTranslations: on the real menu every error is a MISSING one (no rule fires on FR-only data)', () => {
  const errors = validateTranslations(realMenu());
  assert.deepEqual(errors.filter((e) => !e.startsWith('MISSING ')), []);
  assert.ok(errors.length === 0 || errors.length === 712, `0 (merged) or 712 (FR only), got ${errors.length}`);
});

// ── rule constants ────────────────────────────────────────────────────────────

test('constants: invariant names (51 items, 6 categories) exist in the menu, golden ZH glosses', () => {
  const menu = realMenu();
  const itemKeys = new Set(menu.categories.flatMap((c) => c.items.map((i) => i.key)));
  const catKeys = new Set(menu.categories.map((c) => c.key));
  assert.equal(INVARIANT_ITEM_NAMES.size, 51);
  for (const k of INVARIANT_ITEM_NAMES) assert.ok(itemKeys.has(k), k);
  assert.equal(Object.keys(ZH_ITEM_GLOSS).length, 27);
  for (const k of Object.keys(ZH_ITEM_GLOSS)) assert.ok(INVARIANT_ITEM_NAMES.has(k), k);
  assert.equal(ZH_ITEM_GLOSS.karaage, '日式炸鸡');
  assert.equal(ZH_ITEM_GLOSS.gyozas, '煎饺');
  assert.equal(ZH_ITEM_GLOSS.takoyaki, '章鱼小丸子');
  assert.equal(ZH_ITEM_GLOSS.edamame, '盐水毛豆');
  assert.equal(ZH_ITEM_GLOSS['tantan-ramen'], '担担拉面');
  assert.equal(ZH_ITEM_GLOSS['miso-ramen'], '味噌拉面');
  assert.equal(ZH_ITEM_GLOSS.highball, '嗨棒');
  assert.ok(ZH_ITEM_GLOSS['tantan-tsukemen'].includes('蘸面'));
  assert.deepEqual([...INVARIANT_CATEGORY_NAMES].sort(), ['highball', 'mazesoba', 'ramen', 'spritz', 'tantan-umai', 'udon']);
  for (const k of INVARIANT_CATEGORY_NAMES) assert.ok(catKeys.has(k), k);
  assert.equal(ZH_CATEGORY_GLOSS.udon, '乌冬面');
  assert.equal(ZH_CATEGORY_GLOSS.mazesoba, '日式拌面');
  for (const t of ['25cl', '30cl', '20cl', '4cl', '3 × 6cl', 'Gérard Bertrand', 'Domaine Le Clos des Lumières']) assert.ok(INVARIANT_TEXTS.includes(t), t);
  for (const k of Object.keys(REQUIRED_GLOSSES)) assert.ok(item(menu, k)?.description?.fr, `${k} has a FR description`);
  assert.deepEqual(Object.keys(REQUIRED_GLOSSES).sort(), ['diabolo', 'ramune', 'tantan-udon']);
  assert.deepEqual(TRANSLATION_LOCALES, ['en', 'de', 'it', 'zh']);
});

test('constants: ZH glosses are simplified Chinese; NOT_SIMPLIFIED lists traditional and Japanese-only forms', () => {
  for (const ch of '麵雞燒餃揚々麺焼鶏醤溫黃') assert.ok(NOT_SIMPLIFIED.includes(ch), ch);
  const glosses = [...Object.values(ZH_ITEM_GLOSS), ...Object.values(ZH_CATEGORY_GLOSS)].join('');
  for (const ch of glosses) assert.ok(!NOT_SIMPLIFIED.includes(ch), `${ch} is listed as not simplified`);
  for (const row of GLOSSARY) for (const ch of row.zh.join('')) assert.ok(!NOT_SIMPLIFIED.includes(ch), ch);
});

test('constants: brands, Japanese terms and glossary rows are well formed', () => {
  for (const b of ['Asahi', 'Coedo IPA', 'Lisbeth', 'Coca-Cola', 'Nikka from the Barrel', 'Gérard Bertrand', 'Année Lumière', 'Fleur de Geisha', 'Grand jasmin Chun Feng', 'Moulin de Sarralbe', 'Umaï']) {
    assert.ok(BRANDS.includes(b), b);
  }
  for (const t of JP_TERMS) assert.equal(t, t.toLowerCase());
  for (const t of ['karaage', 'edamame', 'chashu', 'tsuyu', 'onsen', 'genmaicha']) assert.ok(JP_TERMS.includes(t), t);
  assert.equal(GLOSSARY.length, 19);
  for (const row of GLOSSARY) {
    assert.ok(row.fr instanceof RegExp);
    for (const l of TRANSLATION_LOCALES) {
      assert.ok(Array.isArray(row[l]) && row[l].length > 0, `${row.fr} ${l}`);
      for (const s of row[l]) assert.equal(s, s.toLowerCase(), `${row.fr} ${l} ${s}`);
    }
  }
  assert.ok(GLOSSARY.find((r) => String(r.fr).includes('pak-cho')).en.includes('bok choy'));
});

test('constants: FORBIDDEN_TEXT and LEGACY_ABSENT mirror scripts/menu-2026/verify-live.mjs', () => {
  assert.deepEqual(FORBIDDEN_TEXT.all, ['??', 'Asashi']);
  assert.ok(FORBIDDEN_TEXT.zh.includes('套餐'));
  assert.ok(FORBIDDEN_TEXT.en.includes('Our Set Menus'));
  assert.ok(FORBIDDEN_TEXT.de.includes('Unsere Menüs'));
  assert.ok(FORBIDDEN_TEXT.it.some((s) => 'I nostri menù fissi'.includes(s)));
  assert.equal(LEGACY_ABSENT.length, 22);
  for (const name of ['Ramen Paitan', 'Gyoza canard', 'Kimchi', 'Kokoro', 'Wantan Men Ramen', 'Yasaï Ramen', 'Portion de nouilles']) {
    assert.ok(LEGACY_ABSENT.includes(name), name);
  }
});
