/**
 * Tests for scripts/menu-2026/translation-checks.mjs, verify-translations.mjs and export-review-sheet.mjs
 * (Phase 14 / Plan 14-02).
 *
 *   node --test scripts/menu-2026/translation-checks.test.mjs
 *
 * Part 1: the pure helpers (secondary French names, leak candidates, page helpers, review rows, CSV) on small
 * inline fixtures. Part 2: the two CLIs driven offline: verify-translations on fixture pages written to a
 * temporary directory (no network), export-review-sheet on a fake Sanity client.
 *
 * Real-file tests read menu-2026.json next to this file. They never assert that the real menu lacks
 * translations: they keep passing after Plan 14-03 merges the overlays into menu-2026.json.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { main as exportMain } from './export-review-sheet.mjs';
import { TRANSLATION_LOCALES, formatMenuJson, mergeTranslations, translatableFields } from './translation-rules.mjs';
import {
  REVIEW_HEADER,
  buildReviewRows,
  comparable,
  decodeEntities,
  extractFrenchNameLines,
  frenchLeakCandidates,
  frenchSecondaryNames,
  htmlLang,
  norm,
  pickLocale,
  toCsv,
  visibleText,
} from './translation-checks.mjs';
import { main as verifyMain } from './verify-translations.mjs';

const nonBlank = (v) => typeof v === 'string' && v.trim() !== '';
const realMenu = () => JSON.parse(readFileSync(new URL('./menu-2026.json', import.meta.url), 'utf8'));
const L = (fr, en, de, it, zh) => ({ fr, en, de, it, zh });
const tmpRoots = [];
const makeRoot = () => {
  const dir = mkdtempSync(join(tmpdir(), 'umai-checks-'));
  tmpRoots.push(dir);
  return dir;
};
after(() => {
  for (const dir of tmpRoots) rmSync(dir, { recursive: true, force: true });
});

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

/** menu JSON -> the shape the export query returns (absent fields are null, like GROQ). */
function toGroqShape(menu) {
  const withType = (loc, type) => (loc ? { _type: type, ...loc } : null);
  return menu.categories.map((c) => ({
    _id: `m26-cat-${c.key}`,
    name: withType(c.name, 'localeString'),
    description: withType(c.description, 'localeText'),
    footnote: withType(c.footnote, 'localeText'),
    items: c.items.map((item) => ({
      _id: `m26-item-${item.key}`,
      name: withType(item.name, 'localeString'),
      description: withType(item.description, 'localeText'),
      subgroup: withType(item.subgroup, 'localeString'),
      prices: item.prices ? item.prices.map((v, i) => ({ _key: `v${i}`, label: withType(v.label, 'localeString') })) : null,
    })),
  }));
}

// ── part 1: pickLocale, comparable ────────────────────────────────────────────
test('pickLocale and comparable mirror src/lib/menu.ts (Phase 13-02)', () => {
  assert.equal(pickLocale({ fr: 'Entrées', zh: '  ' }, 'zh'), 'Entrées');
  assert.equal(pickLocale({ fr: 'Entrées', zh: '小吃' }, 'zh'), '小吃');
  assert.equal(pickLocale({ fr: 'Entrées' }, 'en'), 'Entrées');
  assert.equal(pickLocale({ en: 'x' }, 'de'), '');
  assert.equal(pickLocale(null, 'en'), '');
  assert.equal(pickLocale(undefined, 'en'), '');
  assert.equal(comparable('  Oeuf   MARINÉ\n'), 'oeuf mariné');
  assert.equal(comparable('Café'), comparable('Café'), 'NFC');
});

// ── part 1: frenchSecondaryNames ──────────────────────────────────────────────
function nameMenu() {
  return {
    categories: [
      {
        key: 'a',
        section: 'food',
        name: L('A', 'A', 'A', 'A', 'A'),
        items: [
          { key: 'karaage', name: L('Karaage', 'Karaage', 'Karaage', 'Karaage', 'Karaage（日式炸鸡）') },
          { key: 'oeuf', name: L(' Oeuf mariné entier ', 'Whole marinated egg', 'Ganzes mariniertes Ei', 'Uovo marinato intero', '整颗溏心蛋') },
        ],
      },
      {
        key: 'b',
        section: 'drinks',
        name: L('B', 'B', 'B', 'B', 'B'),
        items: [
          { key: 'sirop', name: L("Sirop à l'eau", 'Syrup with water', '  ', 'Sciroppo con acqua', '果味糖浆水') },
          { key: 'the', name: L('Thés verts japonais', 'JAPANESE GREEN TEAS (thés verts japonais)', 'Japanische Grüntees', 'Tè verdi giapponesi', '日本绿茶') },
        ],
      },
    ],
  };
}

test('frenchSecondaryNames: none on fr; invariant, glossed, blank and containing translations give no line', () => {
  const menu = nameMenu();
  assert.deepEqual(frenchSecondaryNames(menu, 'fr'), []);
  // en: karaage invariant -> none; oeuf translated -> trimmed FR; sirop translated -> FR; the contains the FR name (case, accents) -> none
  assert.deepEqual(frenchSecondaryNames(menu, 'en'), ['Oeuf mariné entier', "Sirop à l'eau"]);
  // de: the blank translation falls back to the French name, which then contains itself -> no line
  assert.deepEqual(frenchSecondaryNames(menu, 'de'), ['Oeuf mariné entier', 'Thés verts japonais']);
  // zh: « Karaage（日式炸鸡） » contains « Karaage » -> none
  assert.deepEqual(frenchSecondaryNames(menu, 'zh'), ['Oeuf mariné entier', "Sirop à l'eau", 'Thés verts japonais']);
  assert.deepEqual(frenchSecondaryNames({ categories: [] }, 'en'), []);
});

test('frenchSecondaryNames follows the print order of the items, categories first', () => {
  const menu = nameMenu();
  menu.categories.reverse();
  assert.deepEqual(frenchSecondaryNames(menu, 'zh'), ["Sirop à l'eau", 'Thés verts japonais', 'Oeuf mariné entier']);
});

test('frenchSecondaryNames on the real translated menu: 0 on fr, a short list elsewhere', () => {
  const menu = translatedRealMenu();
  assert.deepEqual(frenchSecondaryNames(menu, 'fr'), []);
  for (const l of TRANSLATION_LOCALES) {
    const names = frenchSecondaryNames(menu, l);
    assert.ok(names.length >= 20 && names.length <= 30, `${l}: ${names.length}`);
    assert.ok(names.includes('Oeuf mariné entier'), l);
    assert.ok(!names.includes('Karaage') && !names.includes('Tantan Ramen'), l);
  }
});

// ── part 1: frenchLeakCandidates ──────────────────────────────────────────────
test('frenchLeakCandidates: translated French texts, minus identical, short, contained and duplicate ones', () => {
  const menu = {
    categories: [
      {
        key: 'c',
        section: 'food',
        name: L('Boissons chaudes', 'Hot drinks', 'Heissgetränke', 'Bevande calde', '热饮'),
        items: [
          { key: 'a', name: L('Entrée', 'Starter', 'Vorspeise', 'Antipasto', '小吃'), description: L('Poulet mariné et frit', 'Marinated fried chicken', 'Mariniertes Hähnchen', 'Pollo marinato', '腌制炸鸡') },
          { key: 'b', name: L('Vins', 'Wines', 'Weine', 'Vini', '葡萄酒') },
          { key: 'c', name: L('25cl', '25cl', '25cl', '25cl', '25cl') },
          { key: 'd', name: L('3 × 6cl', '3 × 6cl', '3 × 6cl', '3 × 6cl', '3 × 6cl') },
          { key: 'e', name: L('Natsu spécial', 'Special Natsu', 'Natsu Spezial', 'Natsu speciale', '夏日特饮'), description: L('Boisson', 'Try our Natsu spécial with ice', 'Getränk', 'Bevanda', '饮品') },
          { key: 'f', name: L('Au choix', 'Your choice', 'Zur Auswahl', 'A scelta', '任选其一'), subgroup: L('Au choix', 'Your choice', 'Zur Auswahl', 'A scelta', '任选其一') },
        ],
      },
    ],
  };
  // en: « Entrée » (6, not contained anywhere) is a candidate; « Vins » (4) is too short; « 25cl » / « 3 × 6cl » equal their
  // translation; « Natsu spécial » is contained in another EN string; « Au choix » appears twice: once
  assert.deepEqual(frenchLeakCandidates(menu, 'en'), ['Boissons chaudes', 'Entrée', 'Poulet mariné et frit', 'Boisson', 'Au choix']);
  assert.deepEqual(frenchLeakCandidates(menu, 'fr'), []);
  // zh: nothing contains a French text; the identical and short ones are still excluded
  assert.deepEqual(frenchLeakCandidates(menu, 'zh'), ['Boissons chaudes', 'Entrée', 'Poulet mariné et frit', 'Natsu spécial', 'Boisson', 'Au choix']);
});

test('frenchLeakCandidates: a missing translation is a candidate (the page would show the French fallback)', () => {
  const menu = { categories: [{ key: 'c', section: 'food', name: L('Boissons chaudes', 'Hot drinks'), items: [] }] };
  assert.deepEqual(frenchLeakCandidates(menu, 'de'), ['Boissons chaudes']);
  assert.deepEqual(frenchLeakCandidates(menu, 'en'), ['Boissons chaudes']);
});

test('frenchLeakCandidates on the real translated menu: many candidates, none shorter than 5 characters, none duplicated', () => {
  const menu = translatedRealMenu();
  for (const l of TRANSLATION_LOCALES) {
    const c = frenchLeakCandidates(menu, l);
    assert.ok(c.length > 40, `${l}: ${c.length}`);
    assert.ok(c.every((s) => [...s].length >= 5));
    assert.equal(new Set(c).size, c.length);
  }
});

// ── part 1: page helpers ──────────────────────────────────────────────────────
const FR_LINE_CLASSES =
  'mt-1 flex items-baseline gap-1.5 font-body text-sm font-medium text-umai-text/80';
const PAGE = `<!DOCTYPE html><html lang="zh-Hans" class="x y"><head><title>Menu Poulet</title>
<script>window.__x = "Poulet mariné et frit"</script></head>
<body class="b"><header><nav>Menu&nbsp;principal</nav></header><main>
<h3 class="t">Whole marinated egg</h3>
<p data-fr-name="" class="${FR_LINE_CLASSES}"><span aria-hidden="true" class="shrink-0 rounded-sm">FR</span><span lang="fr">Oeuf mariné entier</span></p>
<p class="d">Description A</p>
<h3 class="t">Syrup</h3>
<p data-fr-name="" class="${FR_LINE_CLASSES}"><span aria-hidden="true" class="shrink-0">FR</span><span lang="fr">Sirop à l&#x27;eau</span></p>
<p class="d">Description B</p>
</main>
<script>self.__next_f.push([1,"<p data-fr-name=\\"\\"><span lang=\\"fr\\">Fantôme</span></p>"])</script>
<style>.a{content:"Style Poulet"}</style><!-- comment Poulet --></body></html>`;

test('extractFrenchNameLines: the French lines in page order, entities decoded, script payload and FR tag ignored', () => {
  assert.deepEqual(extractFrenchNameLines(PAGE), ['Oeuf mariné entier', "Sirop à l'eau"]);
  assert.deepEqual(extractFrenchNameLines('<html><body><p>nothing</p></body></html>'), []);
});

test('extractFrenchNameLines: without a lang=fr span the inner text minus a leading FR; React comments and nested tags', () => {
  assert.deepEqual(extractFrenchNameLines('<body><p data-fr-name="">FR Oeuf onsen</p></body>'), ['Oeuf onsen']);
  assert.deepEqual(
    extractFrenchNameLines('<body><div data-fr-name=""><span aria-hidden="true">FR</span><span lang="fr">Oeuf <!-- -->onsen <b>(lent)</b></span></div></body>'),
    ['Oeuf onsen (lent)'],
  );
  assert.deepEqual(extractFrenchNameLines('<body><span data-fr-name="">FR Thé</span> <p data-fr-name=""><span lang="fr">Café</span></p></body>'), ['Thé', 'Café']);
});

test('visibleText: no script, style or comment text; French lines dropped on request; NBSP normalised', () => {
  const full = visibleText(PAGE);
  assert.ok(full.includes('Oeuf mariné entier') && full.includes('Whole marinated egg'));
  assert.ok(full.includes('Menu principal'), 'NBSP -> space');
  assert.ok(!full.includes('Fantôme') && !full.includes('self.__next_f') && !full.includes('Style Poulet') && !full.includes('comment Poulet'));
  assert.ok(!full.includes('Menu Poulet'), 'the head (title) is not page text');
  assert.ok(!full.includes('window.__x'));
  const dropped = visibleText(PAGE, { dropFrenchNameLines: true });
  assert.ok(!dropped.includes('Oeuf mariné entier') && !dropped.includes("Sirop à l'eau") && !dropped.includes('FR '));
  assert.ok(dropped.includes('Whole marinated egg') && dropped.includes('Description B'));
  assert.equal(visibleText('<body>a<!-- x -->b</body>'), 'ab');
  assert.equal(visibleText('no body tag, just text &amp; &#233;'), 'no body tag, just text & é');
});

test('htmlLang reads the lang attribute of the html tag', () => {
  assert.equal(htmlLang('<html lang="zh-Hans" class="x">'), 'zh-Hans');
  assert.equal(htmlLang(PAGE), 'zh-Hans');
  assert.equal(htmlLang("<!DOCTYPE html><HTML CLASS='a' LANG='fr'>"), 'fr');
  assert.equal(htmlLang('<html>'), null);
  assert.equal(htmlLang('<div lang="fr">'), null);
});

test('norm and decodeEntities behave as in verify-live.mjs', () => {
  assert.equal(norm('  a b c\n d  '), 'a b c d');
  assert.equal(
    norm(decodeEntities('Sirop à l&#x27;eau &amp; &lt;b&gt; &quot;x&quot; &#39;y&#39; &apos;z&apos; &#233; &#xE9; &nbsp;')),
    `Sirop à l'eau & <b> "x" 'y' 'z' é é`,
  );
  assert.equal(decodeEntities('&amp;lt;'), '&lt;');
  assert.equal(decodeEntities('&#99999999999;'), '&#99999999999;', 'an invalid code point is left alone');
});

// ── part 1: review rows and CSV ───────────────────────────────────────────────
const tl = (fr, en, de, it, zh) => ({ _type: 'localeString', fr, en, de, it, zh });
function groqFixture() {
  return [
    {
      _id: 'c1',
      name: tl('Entrées', 'Starters', 'Vorspeisen', 'Antipasti', '小吃'),
      description: null,
      footnote: null,
      items: [
        { _id: 'i1', name: tl('Karaage', 'Karaage', 'Karaage', 'Karaage', 'Karaage（日式炸鸡）'), description: { _type: 'localeText', fr: 'Poulet frit', en: 'Fried chicken' }, subgroup: null, prices: null },
        {
          _id: 'i2',
          name: tl('Trio dégustation', 'Tasting trio', 'Verkostungs-Trio', 'Trio degustazione', '清酒品鉴三杯'),
          description: { _type: 'localeText', en: 'a Loc without French: no row' },
          subgroup: tl('Au choix', 'Your choice', 'Zur Auswahl', 'A scelta', '任选其一'),
          prices: [
            { _key: 'v0', label: tl('3 × 6cl', '3 × 6cl', '3 × 6cl', '3 × 6cl', '3 × 6cl') },
            { _key: 'v1', label: null },
            { _key: 'v2', label: tl('Verre', 'Glass', 'Glas', 'Bicchiere', '杯') },
          ],
        },
      ],
    },
    {
      _id: 'c2',
      name: tl('Desserts', 'Desserts', 'Desserts', 'Dolci', '甜点'),
      description: { _type: 'localeText', fr: 'Fait maison', en: 'Homemade' },
      footnote: { _type: 'localeText', fr: 'Prix nets', en: 'Net prices', de: 'Nettopreise', it: 'Prezzi netti', zh: '净价' },
      items: [{ _id: 'i3', name: tl('Mochi', 'Mochi', 'Mochi', 'Mochi', '麻糬'), description: null, subgroup: null, prices: [{ _key: 'v0', label: null }] }],
    },
  ];
}

test('REVIEW_HEADER and buildReviewRows: header, print order, French labels, empty cells for missing translations', () => {
  assert.deepEqual(REVIEW_HEADER, ['Catégorie', 'Champ', 'FR', 'EN', 'DE', 'IT', 'ZH (à relire)']);
  const rows = buildReviewRows(groqFixture());
  assert.deepEqual(rows[0], REVIEW_HEADER);
  assert.deepEqual(
    rows.slice(1).map((r) => r[1]),
    [
      'Catégorie : nom',
      'Karaage : nom',
      'Karaage : description',
      'Trio dégustation : nom',
      'Trio dégustation : sous-groupe',
      'Trio dégustation : libellé de prix',
      'Trio dégustation : libellé de prix 2',
      'Catégorie : nom',
      'Catégorie : description',
      'Mochi : nom',
      'Catégorie : note de bas',
    ],
  );
  assert.deepEqual(rows[1], ['Entrées', 'Catégorie : nom', 'Entrées', 'Starters', 'Vorspeisen', 'Antipasti', '小吃']);
  assert.deepEqual(rows[3], ['Entrées', 'Karaage : description', 'Poulet frit', 'Fried chicken', '', '', '']);
  assert.deepEqual(rows[7], ['Entrées', 'Trio dégustation : libellé de prix 2', 'Verre', 'Glass', 'Glas', 'Bicchiere', '杯']);
  assert.deepEqual(rows[9], ['Desserts', 'Catégorie : description', 'Fait maison', 'Homemade', '', '', '']);
  assert.deepEqual(rows[11], ['Desserts', 'Catégorie : note de bas', 'Prix nets', 'Net prices', 'Nettopreise', 'Prezzi netti', '净价']);
  assert.ok(rows.every((r) => r.length === 7 && r.every((c) => typeof c === 'string')));
});

test('buildReviewRows never throws on null fields (GROQ absent values) and on empty input', () => {
  assert.deepEqual(buildReviewRows([]), [REVIEW_HEADER]);
  assert.deepEqual(buildReviewRows(null), [REVIEW_HEADER]);
  const rows = buildReviewRows([{ _id: 'c', name: tl('Seule', 'Only', 'Nur', 'Solo', '仅'), description: null, footnote: null, items: [{ _id: 'i', name: null, description: null, subgroup: null, prices: null }, { _id: 'j', name: tl('X', 'X', 'X', 'X', 'X'), description: null, subgroup: null, prices: [null, { _key: 'v1', label: null }] }] }]);
  assert.deepEqual(rows.slice(1).map((r) => r[1]), ['Catégorie : nom', 'X : nom']);
  assert.equal(buildReviewRows([{ _id: 'c', name: null, description: null, footnote: null, items: null }]).length, 1);
});

test('buildReviewRows treats a blank translation as an empty cell', () => {
  const rows = buildReviewRows([{ _id: 'c', name: tl('Seule', '   ', 'Nur', undefined, '仅'), items: [] }]);
  assert.deepEqual(rows[1], ['Seule', 'Catégorie : nom', 'Seule', '', 'Nur', '', '仅']);
});

test('buildReviewRows on the real menu reshaped to the GROQ shape: 178 data rows in the order of translatableFields', () => {
  const menu = realMenu();
  const rows = buildReviewRows(toGroqShape(menu));
  assert.equal(rows.length, 179);
  assert.deepEqual(rows[0], REVIEW_HEADER);
  assert.deepEqual(
    rows.slice(1).map((r) => r[2]),
    translatableFields(menu).map((f) => f.value.fr),
  );
  assert.equal(rows[1][0], menu.categories[0].name.fr);
  assert.equal(rows[1][1], 'Catégorie : nom');
  assert.ok(rows.some((r) => r[1] === 'Trio dégustation : libellé de prix' && r[2] === '3 × 6cl'));
  assert.equal(rows.filter((r) => r[1] === 'Catégorie : note de bas').length, 1, 'the one category footnote, last of its category');
});

test('toCsv: BOM, semicolons, CRLF line ends (final one included), quoting', () => {
  const csv = toCsv([['a', 'b;c', 'd"e', 'f\ng', ' h', 'i ', 'plain', '']]);
  assert.equal(csv, '﻿a;"b;c";"d""e";"f\ng";" h";"i ";plain;\r\n');
  assert.equal(toCsv([['x\ry']]), '﻿"x\ry"\r\n');
  assert.equal(toCsv([['1', '2'], ['3', '4']]), '﻿1;2\r\n3;4\r\n');
  assert.equal(toCsv(buildReviewRows([])), '﻿Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)\r\n');
  assert.equal(toCsv([]), '﻿');
  const big = toCsv(buildReviewRows(toGroqShape(realMenu())));
  assert.equal(big.split('\r\n').length, 180, '179 lines + the empty tail');
  assert.ok(!big.replace(/\r\n/g, '').includes('\r'), 'no bare CR left');
});

// ── part 2: verify-translations on fixture pages ──────────────────────────────
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

/** A page as Phase 13-02 renders it: names, the FR line when the rule gives one, descriptions, notes; optional mutations. */
function fakePage(menu, locale, { leak, dropFr } = {}) {
  let html = `<!DOCTYPE html><html lang="${locale === 'zh' ? 'zh-Hans' : locale}"><head><title>x</title></head><body>`;
  html += '<script>self.__next_f.push([1,"data-fr-name"])</script>';
  for (const cat of menu.categories) {
    html += `<h2>${esc(pickLocale(cat.name, locale))}</h2>`;
    if (cat.description) html += `<p>${esc(pickLocale(cat.description, locale))}</p>`;
    for (const item of cat.items) {
      html += `<h3>${esc(pickLocale(item.name, locale))}</h3>`;
      const [line] = frenchSecondaryNames({ categories: [{ items: [item] }] }, locale);
      if (line && item.key !== dropFr) html += `<p data-fr-name=""><span aria-hidden="true">FR</span><span lang="fr">${esc(line)}</span></p>`;
      if (item.description) html += `<p>${esc(item.key === leak ? item.description.fr : pickLocale(item.description, locale))}</p>`;
    }
    if (cat.footnote) html += `<p>${esc(pickLocale(cat.footnote, locale))}</p>`;
  }
  return `${html}</body></html>`;
}

let mergedMenuFile;
function mergedMenuPath() {
  if (!mergedMenuFile) {
    mergedMenuFile = join(makeRoot(), 'menu-translated.json');
    writeFileSync(mergedMenuFile, formatMenuJson(translatedRealMenu()));
  }
  return mergedMenuFile;
}
async function verify(argv, deps = {}) {
  const lines = [];
  const errors = [];
  const code = await verifyMain(argv, { out: (s) => lines.push(String(s)), err: (s) => errors.push(String(s)), sleep: async () => {}, ...deps });
  return { code, lines, errors, text: lines.join('\n'), errText: errors.join('\n') };
}
function pageFile(locale, options) {
  const file = join(makeRoot(), `${locale}.html`);
  writeFileSync(file, fakePage(translatedRealMenu(), locale, options));
  return file;
}

test('verify-translations: a faithful fixture page passes with the expected French lines (zh 26, en 25)', async () => {
  const zh = await verify(['--target', pageFile('zh'), '--locale', 'zh', '--json', mergedMenuPath()]);
  assert.equal(zh.code, 0, zh.text);
  assert.match(zh.text, /^OK {3}zh frNames=26 leakChecks=\d+ target=/m);
  assert.equal(zh.lines.at(-1), 'VERIFY TRANSLATIONS OK locales=1');
  const en = await verify(['--target', pageFile('en'), '--locale', 'en', '--json', mergedMenuPath()]);
  assert.equal(en.code, 0, en.text);
  assert.match(en.text, /^OK {3}en frNames=25 leakChecks=\d+ target=/m);
  const fr = await verify(['--target', pageFile('fr'), '--locale', 'fr', '--json', mergedMenuPath()]);
  assert.equal(fr.code, 0, fr.text);
  assert.match(fr.text, /^OK {3}fr frNames=0 leakChecks=0 target=/m);
});

test('verify-translations: French content left on the page fails with FRLEAK, a missing French line with FRNAME', async () => {
  const leak = await verify(['--target', pageFile('zh', { leak: 'tantan-ramen' }), '--locale', 'zh', '--json', mergedMenuPath()]);
  assert.equal(leak.code, 1);
  assert.match(leak.text, /^FAIL FRLEAK zh /m);
  assert.ok(!/FAIL FRNAME/.test(leak.text));
  assert.match(leak.lines.at(-1), /^VERIFY TRANSLATIONS FAILED failures=\d+$/);

  const drop = await verify(['--target', pageFile('zh', { dropFr: 'oeuf-marine-entier' }), '--locale', 'zh', '--json', mergedMenuPath()]);
  assert.equal(drop.code, 1);
  assert.match(drop.text, /^FAIL FRNAME zh page has 25 French line\(s\), expected 26; first difference at index \d+: page=".*" expected=".*"$/m);
  assert.ok(!/FAIL FRLEAK/.test(drop.text));
});

test('verify-translations: a wrong html lang fails with LANG; the untranslated French page fails on a translated locale', async () => {
  const wrongLang = join(makeRoot(), 'zh-wrong.html');
  writeFileSync(wrongLang, fakePage(translatedRealMenu(), 'zh').replace('lang="zh-Hans"', 'lang="zh"'));
  const lang = await verify(['--target', wrongLang, '--locale', 'zh', '--json', mergedMenuPath()]);
  assert.equal(lang.code, 1);
  assert.match(lang.text, /^FAIL LANG zh html lang="zh", expected "zh-Hans"$/m);

  const frenchPage = join(makeRoot(), 'fr-as-en.html');
  writeFileSync(frenchPage, fakePage(translatedRealMenu(), 'fr').replace('lang="fr"', 'lang="en"'));
  const untranslated = await verify(['--target', frenchPage, '--locale', 'en', '--json', mergedMenuPath()]);
  assert.equal(untranslated.code, 1);
  assert.match(untranslated.text, /FAIL FRNAME en page has 0 French line\(s\), expected 25/);
  assert.match(untranslated.text, /FAIL FRLEAK en/);
});

test('verify-translations: caps the failure lines per locale at 40 and still counts them all', async () => {
  const frenchPage = join(makeRoot(), 'fr-as-zh.html');
  writeFileSync(frenchPage, fakePage(translatedRealMenu(), 'fr').replace('lang="fr"', 'lang="zh-Hans"'));
  const r = await verify(['--target', frenchPage, '--locale', 'zh', '--json', mergedMenuPath()]);
  assert.equal(r.code, 1);
  const failLines = r.lines.filter((l) => l.startsWith('FAIL '));
  assert.equal(failLines.length, 40);
  assert.match(r.text, /^… \d+ more$/m);
  const total = Number(r.lines.at(-1).match(/failures=(\d+)/)[1]);
  assert.ok(total > 40);
});

test('verify-translations: every locale on <base>/<l>/menu; retries a failing fetch, then exits 2', async () => {
  const pages = Object.fromEntries(['fr', 'en', 'de', 'it', 'zh'].map((l) => [`https://example.test/${l}/menu`, fakePage(translatedRealMenu(), l)]));
  const seen = [];
  const okFetch = async (url) => {
    seen.push(url);
    return { status: 200, text: async () => pages[url] };
  };
  const all = await verify(['--base', 'https://example.test/', '--json', mergedMenuPath()], { fetch: okFetch });
  assert.equal(all.code, 0, all.text);
  assert.deepEqual(seen, Object.keys(pages));
  assert.deepEqual(all.lines.filter((l) => l.startsWith('OK ')).map((l) => l.split(' ').filter(Boolean)[2]), ['frNames=0', 'frNames=25', 'frNames=26', 'frNames=26', 'frNames=26']);
  assert.equal(all.lines.at(-1), 'VERIFY TRANSLATIONS OK locales=5');

  let calls = 0;
  const flaky = async (url) => {
    calls += 1;
    return calls === 1 ? { status: 503, text: async () => 'down' } : { status: 200, text: async () => pages[url] };
  };
  const retried = await verify(['--base', 'https://example.test', '--locale', 'en', '--retries', '1', '--interval', '0', '--json', mergedMenuPath()], { fetch: flaky });
  assert.equal(retried.code, 0, retried.text);
  assert.equal(calls, 2);

  const down = await verify(['--base', 'https://example.test', '--locale', 'en', '--retries', '1', '--interval', '0', '--json', mergedMenuPath()], { fetch: async () => ({ status: 500, text: async () => '' }) });
  assert.equal(down.code, 2);
  assert.match(down.errText, /HTTP 500/);
});

test('verify-translations: retries a page that is not translated yet (revalidation lag) and passes on the later attempt', async () => {
  let n = 0;
  const lagging = async () => {
    n += 1;
    // 1st attempt: the cached French page (served with the zh html lang); 2nd: the revalidated page
    const html = n === 1 ? fakePage(translatedRealMenu(), 'fr').replace('lang="fr"', 'lang="zh-Hans"') : fakePage(translatedRealMenu(), 'zh');
    return { status: 200, text: async () => html };
  };
  const r = await verify(['--base', 'https://example.test', '--locale', 'zh', '--retries', '2', '--interval', '0', '--json', mergedMenuPath()], { fetch: lagging });
  assert.equal(r.code, 0, r.text);
  assert.match(r.text, /^attempt 1\/3 zh failures=\d+/m);
  assert.equal(r.lines.at(-1), 'VERIFY TRANSLATIONS OK locales=1');
});

test('verify-translations: usage and file errors exit 2', async () => {
  for (const argv of [
    ['--target', 'x.html'], // --target needs --locale
    ['--locale', 'xx'],
    ['--bogus'],
    ['--retries', '-1'],
    ['--interval', 'abc'],
    ['--json'],
    ['--locale', 'en', '--target', join(makeRoot(), 'absent.html'), '--json', mergedMenuPath()],
    ['--locale', 'en', '--target', pageFile('en'), '--json', join(makeRoot(), 'absent.json')],
  ]) {
    const r = await verify(argv, { fetch: async () => assert.fail('no fetch for a usage error') });
    assert.equal(r.code, 2, argv.join(' '));
    assert.ok(r.errText.length > 0);
  }
});

// ── part 2: export-review-sheet on a fake Sanity ──────────────────────────────
const EXPORT_ENV = { NEXT_PUBLIC_SANITY_PROJECT_ID: 'fakeproj', NEXT_PUBLIC_SANITY_DATASET: 'fakeset', SANITY_TOKEN: 'sk-fake-token-do-not-print' };
function fakeClient(data) {
  const state = { configs: [], queries: [] };
  return {
    state,
    makeClient: (config) => {
      state.configs.push(config);
      return {
        async fetch(query) {
          state.queries.push(query);
          return structuredClone(data);
        },
      };
    },
  };
}
async function exportSheet(argv, { data, root = makeRoot(), env = EXPORT_ENV } = {}) {
  const sanity = fakeClient(data);
  const lines = [];
  const errors = [];
  const code = await exportMain(argv, { env, makeClient: sanity.makeClient, root, out: (s) => lines.push(String(s)), err: (s) => errors.push(String(s)) });
  return { code, lines, errors, text: lines.join('\n'), errText: errors.join('\n'), root, sanity };
}

test('export-review-sheet: reads the published menu read-only and writes the CSV (BOM, header, 179 lines, CRLF)', async () => {
  const data = toGroqShape(translatedRealMenu());
  const r = await exportSheet([], { data });
  assert.equal(r.code, 0, r.text + r.errText);
  const file = join(r.root, '.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv');
  assert.ok(existsSync(file));
  assert.ok(r.lines.includes('REVIEW SHEET rows=178 categories=20 items=77 empty=0 file=.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv'), r.text);
  const bytes = readFileSync(file);
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const text = bytes.toString('utf8');
  assert.equal(text, toCsv(buildReviewRows(data)));
  assert.equal(text.split('\r\n')[0], '﻿Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)');
  assert.equal(text.split('\r\n').length - 1, 179);
  assert.ok(text.includes('Tantan Ramen（担担拉面）'));
  const config = r.sanity.state.configs[0];
  assert.deepEqual([config.perspective, config.useCdn, config.apiVersion, config.projectId, config.dataset], ['published', false, '2025-01-01', 'fakeproj', 'fakeset']);
  assert.ok(r.sanity.state.queries.every((q) => /available == true/.test(q) && /order\(order asc/.test(q) && /prices\[\]\{ _key, label \}/.test(q)));
  assert.ok(!r.text.includes(EXPORT_ENV.SANITY_TOKEN) && !r.errText.includes(EXPORT_ENV.SANITY_TOKEN));
  // deterministic: a second export is byte-identical
  const again = await exportSheet(['--out', join(r.root, 'again.csv')], { data });
  assert.deepEqual(readFileSync(join(r.root, 'again.csv')), bytes);
  assert.match(again.text, /file=.*again\.csv|file=again\.csv/);
});

test('export-review-sheet: --out, empty-cell count, and --strict (exit 1, file still written)', async () => {
  const frOnly = toGroqShape(realMenuFrOnly());
  const out = join(makeRoot(), 'sub', 'sheet.csv');
  const loose = await exportSheet(['--out', out], { data: frOnly });
  assert.equal(loose.code, 0, loose.text);
  assert.match(loose.text, /^REVIEW SHEET rows=178 categories=20 items=77 empty=712 file=/m);
  assert.ok(existsSync(out));
  const strict = await exportSheet(['--strict', '--out', out], { data: frOnly });
  assert.equal(strict.code, 1);
  assert.match(strict.text, /^STRICT: 712 empty cells$/m);
  assert.ok(existsSync(out), 'the sheet is still written');
  const ok = await exportSheet(['--strict', '--out', out], { data: toGroqShape(translatedRealMenu()) });
  assert.equal(ok.code, 0, ok.text);
  assert.ok(!ok.text.includes('STRICT'));
});

test('export-review-sheet: usage and env errors exit 2; the token is optional', async () => {
  assert.equal((await exportSheet(['--bogus'], { data: [] })).code, 2);
  assert.equal((await exportSheet(['--out'], { data: [] })).code, 2);
  const noDataset = await exportSheet([], { data: [], env: { NEXT_PUBLIC_SANITY_PROJECT_ID: 'fakeproj', SANITY_TOKEN: 'secret-value' } });
  assert.equal(noDataset.code, 2);
  assert.match(noDataset.errText, /NEXT_PUBLIC_SANITY_DATASET/);
  assert.ok(!noDataset.errText.includes('secret-value') && !noDataset.errText.includes('fakeproj'));
  const noToken = await exportSheet(['--out', join(makeRoot(), 's.csv')], { data: toGroqShape(translatedRealMenu()), env: { NEXT_PUBLIC_SANITY_PROJECT_ID: 'p', NEXT_PUBLIC_SANITY_DATASET: 'd' } });
  assert.equal(noToken.code, 0, noToken.text + noToken.errText);
  assert.equal(noToken.sanity.state.configs[0].token, undefined);
});

/** The real menu with every translation removed (what production holds before Plan 14-03). */
function realMenuFrOnly() {
  const menu = realMenu();
  for (const f of translatableFields(menu)) for (const l of TRANSLATION_LOCALES) delete f.value[l];
  return menu;
}
