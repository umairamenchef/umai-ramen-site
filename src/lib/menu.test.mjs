// node:test suite for src/lib/menu.ts (pure display helpers, no runtime imports).
// Run: node --test src/lib/menu.test.mjs
// Node 24 strips the TypeScript types natively, so menu.ts is imported directly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickLocale,
  secondaryFrenchName,
  formatEuro,
  formatQuantity,
  getPriceDisplay,
  variantQuantityText,
  buildOffers,
  groupBySection,
  withSubgroupHeadings,
} from './menu.ts';

const NBSP = ' ';
const stub = (unit, count) => (unit === 'pcs' ? `${count} pcs` : `${count} boules`);

const karaage = [
  { _key: 'v0', quantity: 3, unit: 'pcs', price: 5.5 },
  { _key: 'v1', quantity: 6, unit: 'pcs', price: 9.9 },
  { _key: 'v2', quantity: 9, unit: 'pcs', price: 13.9 },
];

// ---------------------------------------------------------------------------
// pickLocale
// ---------------------------------------------------------------------------

test('pickLocale returns the requested locale when present', () => {
  assert.equal(pickLocale({ fr: 'Entrées', en: 'Starters' }, 'en'), 'Starters');
});

test('pickLocale falls back to French when the locale is missing', () => {
  assert.equal(pickLocale({ fr: 'Entrées' }, 'de'), 'Entrées');
  assert.equal(pickLocale({ fr: 'Entrées', en: 'Starters' }, 'it'), 'Entrées');
});

test('pickLocale returns an empty string for null or undefined', () => {
  assert.equal(pickLocale(null, 'fr'), '');
  assert.equal(pickLocale(undefined, 'en'), '');
});

// ---------------------------------------------------------------------------
// pickLocale (it/zh, blank)
// ---------------------------------------------------------------------------

test('pickLocale reads the it and zh translations', () => {
  const field = { fr: 'Entrées', it: 'Antipasti', zh: '小吃' };
  assert.equal(pickLocale(field, 'zh'), '小吃');
  assert.equal(pickLocale(field, 'it'), 'Antipasti');
  // a locale without a value still falls back to French
  assert.equal(pickLocale(field, 'en'), 'Entrées');
});

test('pickLocale: an empty or whitespace-only translation counts as missing', () => {
  assert.equal(pickLocale({ fr: 'Entrées', en: '' }, 'en'), 'Entrées');
  assert.equal(pickLocale({ fr: 'Entrées', zh: '   ' }, 'zh'), 'Entrées');
  assert.equal(pickLocale({ fr: 'Entrées', it: '\n\t' }, 'it'), 'Entrées');
  assert.equal(pickLocale({ fr: 'Entrées', de: `${NBSP}` }, 'de'), 'Entrées');
});

test('pickLocale: a non-string translation (a Sanity null) falls back to French', () => {
  assert.equal(pickLocale({ fr: 'Entrées', de: null }, 'de'), 'Entrées');
  assert.equal(pickLocale({ fr: 'Entrées', de: 42 }, 'de'), 'Entrées');
});

test('pickLocale: a missing or non-string French value gives an empty string, never undefined', () => {
  assert.equal(pickLocale({ fr: '' }, 'zh'), '');
  assert.equal(pickLocale({ fr: undefined }, 'en'), '');
  assert.equal(pickLocale({ fr: null, en: '' }, 'en'), '');
});

test('blank translations fall back to French in the helpers built on pickLocale', () => {
  assert.equal(variantQuantityText({ label: { fr: 'Verre', en: '' }, price: 5.5 }, 'en', stub), 'Verre');
  const items = [
    { _id: 'a', name: { fr: 'a' }, subgroup: { fr: 'Pressions', zh: '  ' } },
    { _id: 'b', name: { fr: 'b' }, subgroup: { fr: 'Bouteilles', zh: '瓶装' } },
  ];
  assert.deepEqual(
    withSubgroupHeadings(items, 'zh').map((r) => r.heading),
    ['Pressions', '瓶装'],
  );
});

// ---------------------------------------------------------------------------
// formatEuro / formatQuantity
// ---------------------------------------------------------------------------

test('formatEuro uses a decimal comma, two decimals and a non-breaking space before the euro sign', () => {
  assert.equal(formatEuro(5.5), `5,50${NBSP}€`);
  assert.equal(formatEuro(18), `18,00${NBSP}€`);
  assert.equal(formatEuro(13.9), `13,90${NBSP}€`);
  assert.equal(formatEuro(0.5), `0,50${NBSP}€`);
});

test('formatQuantity prints integers as-is and decimals with a comma', () => {
  assert.equal(formatQuantity(25), '25');
  assert.equal(formatQuantity(4.5), '4,5');
  assert.equal(formatQuantity(1.5), '1,5');
});

// ---------------------------------------------------------------------------
// getPriceDisplay
// ---------------------------------------------------------------------------

test('getPriceDisplay: priceOnRequest wins', () => {
  assert.deepEqual(getPriceDisplay({ priceOnRequest: true, price: null, prices: null }), {
    kind: 'onRequest',
  });
  // even if a stale price is still stored, the flag decides
  assert.deepEqual(getPriceDisplay({ priceOnRequest: true, price: 5, prices: karaage }), {
    kind: 'onRequest',
  });
});

test('getPriceDisplay: several variants keep their order', () => {
  const display = getPriceDisplay({ prices: karaage });
  assert.equal(display.kind, 'variants');
  assert.equal(display.variants.length, 3);
  assert.deepEqual(
    display.variants.map((v) => v.price),
    [5.5, 9.9, 13.9],
  );
});

test('getPriceDisplay: a single variant becomes a single price carrying its variant', () => {
  const only = { quantity: 33, unit: 'cl', price: 5.9 };
  const display = getPriceDisplay({ prices: [only] });
  assert.deepEqual(display, { kind: 'single', amount: 5.9, variant: only });
});

test('getPriceDisplay: plain price, falsy flag and empty variants', () => {
  assert.deepEqual(getPriceDisplay({ price: 15.9 }), { kind: 'single', amount: 15.9, variant: null });
  assert.deepEqual(getPriceDisplay({ price: 15.9, priceOnRequest: false, prices: [] }), {
    kind: 'single',
    amount: 15.9,
    variant: null,
  });
});

test('getPriceDisplay: nothing priced yields none (never a raw number)', () => {
  assert.deepEqual(getPriceDisplay({ price: null, prices: null }), { kind: 'none' });
  assert.deepEqual(getPriceDisplay({}), { kind: 'none' });
});

test('getPriceDisplay ignores malformed variants without a numeric price', () => {
  const display = getPriceDisplay({ prices: [{ quantity: 3, unit: 'pcs', price: null }, karaage[1]] });
  assert.deepEqual(display, { kind: 'single', amount: 9.9, variant: karaage[1] });
  assert.deepEqual(getPriceDisplay({ prices: [{ quantity: 3, unit: 'pcs' }] }), { kind: 'none' });
});

// ---------------------------------------------------------------------------
// variantQuantityText
// ---------------------------------------------------------------------------

test('variantQuantityText: pieces go through the unit text callback', () => {
  assert.equal(variantQuantityText({ quantity: 3, unit: 'pcs', price: 5.5 }, 'fr', stub), '3 pcs');
});

test('variantQuantityText: scoops go through the unit text callback', () => {
  assert.equal(variantQuantityText({ quantity: 2, unit: 'scoop', price: 5 }, 'fr', stub), '2 boules');
});

test('variantQuantityText: cl and l keep the printed style (no space)', () => {
  assert.equal(variantQuantityText({ quantity: 25, unit: 'cl', price: 4.9 }, 'fr', stub), '25cl');
  assert.equal(variantQuantityText({ quantity: 1.5, unit: 'l', price: 9 }, 'fr', stub), '1,5l');
});

test('variantQuantityText: a label wins over quantity and unit', () => {
  assert.equal(variantQuantityText({ label: { fr: '3 × 6cl' }, price: 18 }, 'fr', stub), '3 × 6cl');
  assert.equal(
    variantQuantityText({ label: { fr: '3 × 6cl' }, quantity: 3, unit: 'pcs', price: 18 }, 'fr', stub),
    '3 × 6cl',
  );
});

test('variantQuantityText: labels are localized with French fallback', () => {
  const variant = { label: { fr: 'Verre', en: 'Glass' }, price: 5.5 };
  assert.equal(variantQuantityText(variant, 'en', stub), 'Glass');
  assert.equal(variantQuantityText(variant, 'de', stub), 'Verre');
});

test('variantQuantityText: a bare quantity and an empty variant', () => {
  assert.equal(variantQuantityText({ quantity: 4, price: 3 }, 'fr', stub), '4');
  assert.equal(variantQuantityText({ price: 3 }, 'fr', stub), '');
});

// ---------------------------------------------------------------------------
// buildOffers
// ---------------------------------------------------------------------------

test('buildOffers: no offer for prix sur demande or unpriced items', () => {
  assert.deepEqual(buildOffers({ priceOnRequest: true }), []);
  assert.deepEqual(buildOffers({ priceOnRequest: true, price: 4, prices: karaage }), []);
  assert.deepEqual(buildOffers({}), []);
});

test('buildOffers: one offer per variant with formatted price and described name', () => {
  const offers = buildOffers({ prices: karaage }, (v) => `${v.quantity} pcs`);
  assert.equal(offers.length, 3);
  assert.deepEqual(
    offers.map((o) => o.price),
    ['5.50', '9.90', '13.90'],
  );
  assert.deepEqual(
    offers.map((o) => o.name),
    ['3 pcs', '6 pcs', '9 pcs'],
  );
  for (const offer of offers) {
    assert.equal(offer['@type'], 'Offer');
    assert.equal(offer.priceCurrency, 'EUR');
  }
});

test('buildOffers: a plain price yields one offer without a name key', () => {
  assert.deepEqual(buildOffers({ price: 15.9 }), [
    { '@type': 'Offer', price: '15.90', priceCurrency: 'EUR' },
  ]);
  // describe is only used for variants
  assert.deepEqual(buildOffers({ price: 15.9 }, () => 'ignored'), [
    { '@type': 'Offer', price: '15.90', priceCurrency: 'EUR' },
  ]);
});

test('buildOffers: variants without a describe callback, or with an empty description, have no name key', () => {
  for (const offer of buildOffers({ prices: karaage })) {
    assert.equal('name' in offer, false);
  }
  for (const offer of buildOffers({ prices: karaage }, () => '')) {
    assert.equal('name' in offer, false);
  }
});

test('buildOffers: a single variant yields one named offer', () => {
  const offers = buildOffers({ prices: [{ quantity: 33, unit: 'cl', price: 5.9 }] }, () => '33cl');
  assert.deepEqual(offers, [{ '@type': 'Offer', price: '5.90', priceCurrency: 'EUR', name: '33cl' }]);
});

// ---------------------------------------------------------------------------
// groupBySection
// ---------------------------------------------------------------------------

const cat = (id, section) => ({
  _id: id,
  name: { fr: id },
  slug: { current: id },
  ...(section === undefined ? {} : { section }),
  items: [],
});

test('groupBySection: food, then drinks, then unsectioned, keeping input order inside each group', () => {
  const A = cat('A', 'food');
  const B = cat('B', 'drinks');
  const C = cat('C', 'food');
  const D = cat('D');
  assert.deepEqual(groupBySection([A, B, C, D]), [
    { section: 'food', categories: [A, C] },
    { section: 'drinks', categories: [B] },
    { section: null, categories: [D] },
  ]);
});

test('groupBySection: empty groups are omitted', () => {
  const B = cat('B', 'drinks');
  assert.deepEqual(groupBySection([B]), [{ section: 'drinks', categories: [B] }]);
  assert.deepEqual(groupBySection([]), []);
});

test('groupBySection: null and unknown sections fall in the unsectioned bucket', () => {
  const N = cat('N', null);
  const X = cat('X', 'brunch');
  assert.deepEqual(groupBySection([N, X]), [{ section: null, categories: [N, X] }]);
});

// ---------------------------------------------------------------------------
// withSubgroupHeadings
// ---------------------------------------------------------------------------

const it = (id, subgroup) => ({ _id: id, name: { fr: id }, subgroup });

test('withSubgroupHeadings: a heading only where the subgroup changes', () => {
  const items = [
    it('a', { fr: 'Pressions' }),
    it('b', { fr: 'Pressions' }),
    it('c', { fr: 'Bouteilles' }),
    it('d', null),
  ];
  const result = withSubgroupHeadings(items, 'fr');
  assert.deepEqual(
    result.map((r) => r.heading),
    ['Pressions', null, 'Bouteilles', null],
  );
  assert.deepEqual(
    result.map((r) => r.item),
    items,
  );
});

test('withSubgroupHeadings: items without any subgroup never get a heading', () => {
  const items = [it('a', undefined), it('b', null)];
  assert.deepEqual(
    withSubgroupHeadings(items, 'fr').map((r) => r.heading),
    [null, null],
  );
});

test('withSubgroupHeadings: a subgroup that resumes after an unlabelled item is announced again', () => {
  const items = [it('a', { fr: 'Pressions' }), it('b', null), it('c', { fr: 'Pressions' })];
  assert.deepEqual(
    withSubgroupHeadings(items, 'fr').map((r) => r.heading),
    ['Pressions', null, 'Pressions'],
  );
});

test('withSubgroupHeadings: headings follow the locale with French fallback', () => {
  const items = [it('a', { fr: 'Pressions', en: 'Draught' }), it('b', { fr: 'Bouteilles' })];
  assert.deepEqual(
    withSubgroupHeadings(items, 'en').map((r) => r.heading),
    ['Draught', 'Bouteilles'],
  );
});

// ---------------------------------------------------------------------------
// secondaryFrenchName (UI-01)
// ---------------------------------------------------------------------------

test('secondaryFrenchName: never on the French menu, whatever the name', () => {
  assert.equal(secondaryFrenchName({ fr: 'Karaage' }, 'fr'), null);
  assert.equal(secondaryFrenchName({ fr: 'Gyozas', en: 'Gyoza', zh: '饺子' }, 'fr'), null);
});

test('secondaryFrenchName: an untranslated name (French fallback) shows once', () => {
  assert.equal(secondaryFrenchName({ fr: 'Karaage' }, 'zh'), null);
  assert.equal(secondaryFrenchName({ fr: 'Karaage' }, 'en'), null);
  // empty, blank or null translations are fallbacks too
  assert.equal(secondaryFrenchName({ fr: 'Karaage', en: '' }, 'en'), null);
  assert.equal(secondaryFrenchName({ fr: 'Karaage', zh: '   ' }, 'zh'), null);
  assert.equal(secondaryFrenchName({ fr: 'Karaage', de: null }, 'de'), null);
});

test('secondaryFrenchName: a translation that is, or contains, the French name shows once', () => {
  assert.equal(secondaryFrenchName({ fr: 'Tantan Ramen', en: 'Tantan Ramen' }, 'en'), null);
  // case-insensitive, and a no-break space (U+00A0) is a space
  assert.equal(secondaryFrenchName({ fr: 'Tantan Ramen', de: `TANTAN${NBSP}RAMEN` }, 'de'), null);
  assert.equal(secondaryFrenchName({ fr: `Tantan${NBSP}Ramen`, de: 'Tantan  Ramen' }, 'de'), null);
  assert.equal(secondaryFrenchName({ fr: 'Karaage', en: 'Karaage (Japanese fried chicken)' }, 'en'), null);
  assert.equal(secondaryFrenchName({ fr: 'Karaage', zh: '日式炸鸡 Karaage' }, 'zh'), null);
  // accents compare composed or decomposed
  assert.equal(secondaryFrenchName({ fr: 'Café gourmand', en: 'CAFÉ GOURMAND' }, 'en'), null);
  assert.equal(secondaryFrenchName({ fr: 'Café', it: 'Café (caffè)' }, 'it'), null);
});

test('secondaryFrenchName: a real translation shows the French name, trimmed', () => {
  assert.equal(secondaryFrenchName({ fr: 'Karaage', zh: '日式炸鸡块' }, 'zh'), 'Karaage');
  assert.equal(secondaryFrenchName({ fr: 'Gyozas', it: 'Ravioli giapponesi' }, 'it'), 'Gyozas');
  assert.equal(
    secondaryFrenchName({ fr: 'Café gourmand', en: 'Coffee with mini desserts' }, 'en'),
    'Café gourmand',
  );
  assert.equal(secondaryFrenchName({ fr: '  Karaage ', zh: '日式炸鸡块' }, 'zh'), 'Karaage');
});

test('secondaryFrenchName: a translation that is only part of the French name still shows it', () => {
  // « Gyoza » does not contain « Gyozas »: the French spelling is what the server reads
  assert.equal(secondaryFrenchName({ fr: 'Gyozas', en: 'Gyoza' }, 'en'), 'Gyozas');
});

test('secondaryFrenchName: no name or no French name gives null', () => {
  assert.equal(secondaryFrenchName(null, 'en'), null);
  assert.equal(secondaryFrenchName(undefined, 'zh'), null);
  assert.equal(secondaryFrenchName({ fr: '', en: 'x' }, 'en'), null);
  assert.equal(secondaryFrenchName({ fr: '   ', en: 'x' }, 'en'), null);
  assert.equal(secondaryFrenchName({ fr: null, en: 'x' }, 'en'), null);
});
