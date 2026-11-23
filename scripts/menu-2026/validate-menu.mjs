#!/usr/bin/env node
/**
 * UMAÏ Ramen: validate scripts/menu-2026/menu-2026.json (transcription of the 2026 print).
 *
 * Usage:
 *   node scripts/menu-2026/validate-menu.mjs [--crosscheck] [--file <path>]
 *
 *   (default)     schema + golden values (menu-schema.mjs validateMenu)
 *   --crosscheck  also compares the JSON with the print text layers
 *                 (.planning/sources/menu-2026/*-print.txt):
 *                   1. PRICES: the set of distinct prices must be identical;
 *                   2. TEXT: every item name / description / nameJp / subgroup and every category
 *                      name / nameJp / description / footnote must be found in the normalised text
 *                      layers. Only the 5 documented corrections of TEXT_ALLOWLIST are exempt.
 *   --file <path> validate another JSON file (tests); defaults to menu-2026.json next to this script.
 *
 * Exit code 0 = valid, 1 = errors (each one is printed).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { allPrices, validateMenu } from './menu-schema.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const SOURCES_DIR = join(ROOT, '.planning/sources/menu-2026');
const args = process.argv.slice(2);
const fileArg = args.indexOf('--file');
const JSON_PATH = fileArg >= 0 && args[fileArg + 1] ? resolve(args[fileArg + 1]) : join(import.meta.dirname, 'menu-2026.json');
const CROSSCHECK = args.includes('--crosscheck');

/**
 * The 5 documented print → web corrections (see json.corrections). Nothing else is exempt.
 *   name: '<print form>'   the web name differs from the print: the PRINT form must be found instead
 *   description: false     the print shows a placeholder (BAT text used): no text check
 *   descriptionParts: []   the web description merges several print lines: each part must be found
 *                          in the print AND in the web description
 */
const TEXT_ALLOWLIST = {
  'asahi-super-dry': { name: 'Asashi Super Dry ~ 5°' },
  'coedo-ipa': { name: 'Coedo IPA ~ 4.5°' },
  zaku: { name: 'Zaku ~ 15.5°' },
  'trio-degustation': { description: false },
  gyozas: { descriptionParts: ['Raviolis grillés', 'Garniture au choix : poulet, porc ou légumes.'] },
};

// Prices as printed: "4,90", "9.00", "24,00" (not degrees like "15.5°", which have one decimal).
const PRICE_RE = /(?<![\d.,])(\d{1,3})[,.](\d{2})(?!\d)/g;
const CJK = '\\u3000-\\u9FFF\\uFF00-\\uFFEF';
const CJK_GAP_RE = new RegExp(`([${CJK}])\\s+(?=[${CJK}])`, 'g');

/** Normalise a string for the text-layer comparison (order matters). */
function norm(s) {
  return String(s)
    .normalize('NFC')
    .replace(/[’‘`´]/g, "'") // typographic apostrophes → '
    .toLowerCase() // no œ → oe folding: « oeuf » / « œuf » must match the print exactly
    .replace(CJK_GAP_RE, '$1') // vertical JP labels: one glyph per line in the text layer
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+([:;!?])/g, '$1') // French spacing before : ; ! ?
    .replace(/\s+/g, ' ')
    .trim();
}

function fail(lines) {
  for (const l of lines) console.error(l);
  process.exit(1);
}

// ── load + schema ──────────────────────────────────────────────────────────
const relJson = relative(ROOT, JSON_PATH);
if (!existsSync(JSON_PATH)) fail([`ERROR ${relJson} not found (transcription missing)`]);
let json;
try {
  json = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
} catch (e) {
  fail([`ERROR ${relJson} is not valid JSON: ${e.message}`]);
}
const errors = validateMenu(json);
if (errors.length) fail([...errors.map((e) => `ERROR ${e}`), `MENU JSON INVALID errors=${errors.length}`]);

const items = json.categories.flatMap((c) => c.items);
const variants = items.reduce((n, it) => n + (it.prices?.length ?? 0), 0);
const priceSet = new Set(allPrices(json));
console.log(`MENU JSON OK categories=${json.categories.length} items=${items.length} variants=${variants} distinctPrices=${priceSet.size}`);

if (!CROSSCHECK) process.exit(0);

// ── crosscheck against the print text layers ──────────────────────────────
const layerFiles = readdirSync(SOURCES_DIR)
  .filter((f) => f.endsWith('-print.txt'))
  .sort();
if (layerFiles.length !== 2) fail([`ERROR expected 2 *-print.txt files in ${relative(ROOT, SOURCES_DIR)}, found ${layerFiles.length}`]);
const layers = layerFiles.map((f) => readFileSync(join(SOURCES_DIR, f), 'utf8')).join('\n');
let ok = true;

// 1. prices
const printPrices = new Set([...layers.matchAll(PRICE_RE)].map((m) => parseFloat(`${m[1]}.${m[2]}`)));
const missing = [...printPrices].filter((p) => !priceSet.has(p)).sort((a, b) => a - b);
const extra = [...priceSet].filter((p) => !printPrices.has(p)).sort((a, b) => a - b);
if (missing.length || extra.length) {
  ok = false;
  if (missing.length) console.error(`CROSSCHECK missing from JSON (on the print): ${missing.join(' ')}`);
  if (extra.length) console.error(`CROSSCHECK extra in JSON (not on the print): ${extra.join(' ')}`);
  console.error(`CROSSCHECK FAILED print=${printPrices.size} json=${priceSet.size}`);
} else {
  console.log(`CROSSCHECK OK distinct=${printPrices.size}`);
}

// 2. texts
const L = norm(layers);
const textErrors = [];
let checks = 0;
const found = (value) => {
  checks += 1;
  return L.includes(norm(value));
};
const check = (key, field, value) => {
  if (value === undefined || value === null) return;
  if (!found(value)) textErrors.push(`TEXT ${key} ${field} not in print: ${JSON.stringify(value)}`);
};

for (const cat of json.categories) {
  check(cat.key, 'category.name', cat.name?.fr);
  check(cat.key, 'category.nameJp', cat.nameJp);
  check(cat.key, 'category.description', cat.description?.fr);
  check(cat.key, 'category.footnote', cat.footnote?.fr);
}
const allowUsed = new Set();
for (const item of items) {
  const allow = TEXT_ALLOWLIST[item.key];
  if (allow) allowUsed.add(item.key);

  if (allow && typeof allow.name === 'string') {
    if (!found(allow.name)) textErrors.push(`TEXT ${item.key} name allowlisted print form not in print: ${JSON.stringify(allow.name)}`);
  } else {
    check(item.key, 'name', item.name?.fr);
  }

  if (allow && allow.description === false) {
    // BAT text: the print shows a placeholder instead of a description
  } else if (allow && Array.isArray(allow.descriptionParts)) {
    const web = norm(item.description?.fr ?? '');
    for (const part of allow.descriptionParts) {
      if (!found(part)) textErrors.push(`TEXT ${item.key} description part not in print: ${JSON.stringify(part)}`);
      if (!web.includes(norm(part))) textErrors.push(`TEXT ${item.key} description does not contain the print part ${JSON.stringify(part)}`);
    }
  } else {
    check(item.key, 'description', item.description?.fr);
  }

  check(item.key, 'nameJp', item.nameJp);
  check(item.key, 'subgroup', item.subgroup?.fr);
}
for (const key of Object.keys(TEXT_ALLOWLIST)) {
  if (!allowUsed.has(key)) textErrors.push(`TEXT allowlist entry "${key}" matches no item (stale allowlist)`);
}

if (textErrors.length) {
  ok = false;
  for (const e of textErrors) console.error(e);
  console.error(`TEXT CROSSCHECK FAILED errors=${textErrors.length} checks=${checks}`);
} else {
  console.log(`TEXT CROSSCHECK OK checks=${checks} allowlisted=${allowUsed.size}`);
}

process.exit(ok ? 0 : 1);
