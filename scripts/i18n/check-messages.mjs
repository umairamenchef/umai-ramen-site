#!/usr/bin/env node
// Phase 13 / Plan 01: message-file contract checker.
//
//   node scripts/i18n/check-messages.mjs
//
// Reads src/messages/{fr,en,de,it,zh}.json (relative to the repo root) and enforces:
//   (a) parity: every flattened key of fr's common / nav / menu / consent / orderModal /
//       footer namespaces (minus DEAD_KEYS), the keys added by Phase 13, plus
//       meta.menu.title and meta.menu.description, is a non-empty string in all 5 files
//   (b) it.json and zh.json hold exactly the top-level namespaces
//       common,consent,footer,menu,meta,nav,orderModal and meta holds only `menu`
//       (everything else falls back to English through the merge in src/i18n/request.ts)
//   (c) no value contains an em-dash (EK, v2.1; covers the Chinese double dash too)
//   (d) every string value is valid ICU and formats with { count: 2 }
//   (e) golden values of the unit messages (pcs, scoop singular / plural) per locale
//   (f) FR-leak guard: the listed keys differ from the French value in en, de, it, zh
//   (g) Phase 12 verifier findings: meta.menu.description no longer advertises
//       formules / set menus, and the dietary pill short labels are golden per locale
//
// A missing or invalid file prints `MISSING FILE <path>` and counts as a failure; the
// checks that need it are skipped, the script never crashes.
// `checks` counts every individual assertion that was evaluated.
//
// Output: one line per failure, then `MESSAGES OK checks=<n>` (exit 0) or
// `MESSAGES FAILED failures=<n>` (exit 1). Dependency: intl-messageformat (installed
// with next-intl). Node 24 ESM.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IntlMessageFormat } from 'intl-messageformat';

const ROOT = join(import.meta.dirname, '..', '..');
const LOCALES = ['fr', 'en', 'de', 'it', 'zh'];
const MENU_ONLY = ['it', 'zh'];
const TRANSLATED = ['en', 'de', 'it', 'zh'];

// Namespaces whose fr keys must exist everywhere.
const NAMESPACES = ['common', 'nav', 'menu', 'consent', 'orderModal', 'footer'];
// Keys kept in fr/en/de on purpose but no longer rendered (the eazee-link CTA left the menu page).
const DEAD_KEYS = ['menu.eazeeLinkCta'];
// Keys added by Phase 13: required in all 5 files, fr included.
const PHASE13_KEYS = [
  'menu.languageSwitcherLabel',
  'menu.categoriesNavLabel',
  'menu.diet.vegetarian',
  'menu.diet.vegetarianLabel',
  'menu.diet.glutenFree',
  'menu.diet.glutenFreeLabel',
  'footer.contact',
  'footer.navigation',
  'footer.followUs',
  'footer.legalNotice',
  'footer.privacy',
  'footer.cookies',
  'footer.terms',
  'footer.rights',
];
const META_KEYS = ['meta.menu.title', 'meta.menu.description'];
const MENU_ONLY_TOP_LEVEL = 'common,consent,footer,menu,meta,nav,orderModal';

const UNIT_GOLDEN = [
  ['fr', 'menu.unit.pcs', 3, '3 pcs'],
  ['fr', 'menu.unit.scoop', 1, '1 boule'],
  ['fr', 'menu.unit.scoop', 2, '2 boules'],
  ['en', 'menu.unit.pcs', 3, '3 pcs'],
  ['en', 'menu.unit.scoop', 1, '1 scoop'],
  ['en', 'menu.unit.scoop', 2, '2 scoops'],
  ['de', 'menu.unit.pcs', 3, '3 Stk.'],
  ['de', 'menu.unit.scoop', 1, '1 Kugel'],
  ['de', 'menu.unit.scoop', 2, '2 Kugeln'],
  ['it', 'menu.unit.pcs', 3, '3 pz'],
  ['it', 'menu.unit.scoop', 1, '1 pallina'],
  ['it', 'menu.unit.scoop', 2, '2 palline'],
  ['zh', 'menu.unit.pcs', 3, '3个'],
  ['zh', 'menu.unit.scoop', 1, '1球'],
  ['zh', 'menu.unit.scoop', 2, '2球'],
];

const FR_LEAK_KEYS = [
  'menu.title',
  'menu.subtitle',
  'menu.sectionFood',
  'menu.sectionDrinks',
  'menu.priceOnRequest',
  'menu.badge.bestseller',
  'menu.badge.vegetarianOption',
  'menu.diet.vegetarianLabel',
  'menu.diet.glutenFreeLabel',
  'menu.intro',
  'menu.allergens',
  'menu.serviceIncluded',
  'menu.languageSwitcherLabel',
  'menu.categoriesNavLabel',
  'footer.followUs',
  'footer.legalNotice',
  'footer.privacy',
  'footer.cookies',
  'footer.rights',
  'consent.message',
  'consent.accept',
  'consent.reject',
];

// The 2026 menu has no formules / set menus: the meta description must not sell any.
const STALE_DESCRIPTION_RE = /formule|set menu|menüs|menù fissi|套餐/i;
const DIET_GOLDEN = {
  fr: { vegetarian: 'V', glutenFree: 'SG' },
  en: { vegetarian: 'V', glutenFree: 'GF' },
  de: { vegetarian: 'V', glutenFree: 'GF' },
  it: { vegetarian: 'V', glutenFree: 'SG' },
  zh: { vegetarian: '素', glutenFree: '无麸质' },
};

let checks = 0;
const failures = [];

function check(ok, message) {
  checks += 1;
  if (!ok) failures.push(message);
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** { a: { b: 'x' } } -> Map { 'a.b' => 'x' } (non-string leaves are kept as-is and fail (a)). */
function flatten(obj, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isObject(value)) flatten(value, path, out);
    else out.set(path, value);
  }
  return out;
}

function isFilled(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

const flat = {}; // locale -> Map
const raw = {}; // locale -> parsed JSON
for (const locale of LOCALES) {
  const rel = `src/messages/${locale}.json`;
  try {
    const parsed = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
    if (!isObject(parsed)) throw new Error('top level is not an object');
    raw[locale] = parsed;
    flat[locale] = flatten(parsed);
    checks += 1;
  } catch (error) {
    const reason = error && error.code === 'ENOENT' ? '' : ` (${error?.message ?? error})`;
    check(false, `MISSING FILE ${rel}${reason}`);
  }
}
const loaded = LOCALES.filter((l) => flat[l]);

// ---------------------------------------------------------------------------
// (a) parity / required keys
// ---------------------------------------------------------------------------

const required = new Set([...PHASE13_KEYS, ...META_KEYS]);
if (flat.fr) {
  for (const key of flat.fr.keys()) {
    if (NAMESPACES.includes(key.split('.')[0]) && !DEAD_KEYS.includes(key)) required.add(key);
  }
}
for (const locale of loaded) {
  for (const key of required) {
    check(isFilled(flat[locale].get(key)), `[a] ${locale}: missing or empty ${key}`);
  }
}

// ---------------------------------------------------------------------------
// (b) it / zh shape
// ---------------------------------------------------------------------------

for (const locale of MENU_ONLY) {
  if (!raw[locale]) continue;
  const top = Object.keys(raw[locale]).sort().join(',');
  check(top === MENU_ONLY_TOP_LEVEL, `[b] ${locale}: top-level keys are "${top}", expected "${MENU_ONLY_TOP_LEVEL}"`);
  const metaKeys = isObject(raw[locale].meta) ? Object.keys(raw[locale].meta).sort().join(',') : '(none)';
  check(metaKeys === 'menu', `[b] ${locale}: meta holds "${metaKeys}", expected "menu"`);
}

// ---------------------------------------------------------------------------
// (c) no em-dash, (d) ICU validity
// ---------------------------------------------------------------------------

for (const locale of loaded) {
  for (const [key, value] of flat[locale]) {
    if (typeof value !== 'string') continue;
    check(!value.includes('—'), `[c] ${locale} ${key}: contains an em-dash`);
    let error = null;
    try {
      new IntlMessageFormat(value, locale).format({ count: 2 });
    } catch (e) {
      error = e;
    }
    check(error === null, `[d] ${locale} ${key}: invalid ICU message (${error?.message?.split('\n')[0]})`);
  }
}

// ---------------------------------------------------------------------------
// (e) golden unit values
// ---------------------------------------------------------------------------

for (const [locale, key, count, expected] of UNIT_GOLDEN) {
  if (!flat[locale]) continue;
  const message = flat[locale].get(key);
  let actual;
  try {
    actual = String(new IntlMessageFormat(message, locale).format({ count }));
  } catch (e) {
    actual = `<error: ${e?.message?.split('\n')[0]}>`;
  }
  check(actual === expected, `[e] ${locale} ${key} with count=${count}: expected "${expected}", got "${actual}"`);
}

// ---------------------------------------------------------------------------
// (f) FR-leak guard
// ---------------------------------------------------------------------------

for (const locale of TRANSLATED) {
  if (!flat[locale] || !flat.fr) continue;
  for (const key of FR_LEAK_KEYS) {
    const own = flat[locale].get(key);
    const french = flat.fr.get(key);
    if (!isFilled(own) || !isFilled(french)) continue; // reported by (a)
    check(own !== french, `[f] ${locale} ${key}: identical to the French value (FR leak)`);
  }
}

// ---------------------------------------------------------------------------
// (g) Phase 12 verifier findings
// ---------------------------------------------------------------------------

for (const locale of loaded) {
  const description = flat[locale].get('meta.menu.description');
  if (typeof description === 'string') {
    check(
      !STALE_DESCRIPTION_RE.test(description),
      `[g] ${locale} meta.menu.description still advertises formules / set menus`,
    );
  }
  for (const [name, expected] of Object.entries(DIET_GOLDEN[locale])) {
    const actual = flat[locale].get(`menu.diet.${name}`);
    check(actual === expected, `[g] ${locale} menu.diet.${name}: expected "${expected}", got ${JSON.stringify(actual)}`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

for (const line of failures) console.log(line);
if (failures.length === 0) {
  console.log(`MESSAGES OK checks=${checks}`);
  process.exit(0);
}
console.log(`MESSAGES FAILED failures=${failures.length}`);
process.exit(1);
