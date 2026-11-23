#!/usr/bin/env node
/**
 * UMAÏ Ramen: completeness and rule check of the 2026 menu translations (Phase 14, EN / DE / IT / ZH).
 *
 * Usage:
 *   node scripts/menu-2026/check-translations.mjs [--section food|drinks] [--out <file>] [--write]
 *                                                 [--json <file>] [--skeleton food|drinks]
 *
 *   (default)          merge the staging overlays next to this script (translations-2026-food.json,
 *                      translations-2026-drinks.json) into menu-2026.json IN MEMORY, then check the merged menu:
 *                        - merge errors   (translation-rules.mjs mergeTranslations: STALE, ORPHAN, DUPLICATE,
 *                                          CONFLICT, OVERLAY)
 *                        - validateMenu   (menu-schema.mjs: structure, « ?? », « Asashi », dotted degrees)
 *                        - validateTranslations (translation-rules.mjs: MISSING, INVARIANT, BRAND, JPTERM,
 *                                          GLOSSARY, NUMBERS, SCRIPT, TYPO, FORBIDDEN, SUBGROUP, LENGTH, GLOSS)
 *   --section <s>      check (and count) only the food or drinks fields
 *   --json <file>      check another menu file instead of menu-2026.json, without any overlay (e.g. a preview)
 *   --out <file>       on success, write the merged menu to <file> in the file style of menu-2026.json
 *   --write            on success, write the merged menu to scripts/menu-2026/menu-2026.json.
 *                      PLAN 14-03 ONLY (after Phase 13 is live); not combinable with --section or --json.
 *   --skeleton <s>     print an empty overlay for the food or drinks section (fr filled, en/de/it/zh = "")
 *
 * Output (stdout): OVERLAY lines, ERROR lines (at most 80, then « … <n> more »), OUT / WROTE lines, then
 *   TRANSLATIONS OK categories=<c> items=<i> fields=<f> values=<v>   exit 0
 *   TRANSLATIONS FAILED errors=<n>                                  exit 1
 * Usage errors go to stderr, exit 2. No network, no Sanity: reads files, writes only --out / --write.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { validateMenu } from './menu-schema.mjs';
import {
  TRANSLATION_LOCALES,
  formatMenuJson,
  mergeTranslations,
  overlaySkeleton,
  translatableFields,
  validateTranslations,
} from './translation-rules.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const MENU_PATH = join(import.meta.dirname, 'menu-2026.json');
const OVERLAY_FILES = ['translations-2026-food.json', 'translations-2026-drinks.json'];
const SECTIONS = ['food', 'drinks'];
const MAX_ERROR_LINES = 80;
const USAGE =
  'Usage: node scripts/menu-2026/check-translations.mjs [--section food|drinks] [--out <file>] [--write] [--json <file>] [--skeleton food|drinks]';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const show = (p) => {
  const r = relative(ROOT, p);
  return r && !r.startsWith('..') ? r : p;
};

function usage(message) {
  if (message) console.error(`check-translations: ${message}`);
  console.error(USAGE);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { write: false };
  const valueFlags = { '--section': 'section', '--out': 'out', '--json': 'json', '--skeleton': 'skeleton' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    }
    if (arg === '--write') {
      if (opts.write) usage('--write given twice');
      opts.write = true;
      continue;
    }
    const name = valueFlags[arg];
    if (!name) usage(`unknown argument ${JSON.stringify(arg)}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--') || value === '') usage(`${arg} needs a value`);
    if (opts[name] !== undefined) usage(`${arg} given twice`);
    opts[name] = value;
    i += 1;
  }
  if (opts.section !== undefined && !SECTIONS.includes(opts.section)) usage('--section must be food or drinks');
  if (opts.skeleton !== undefined && !SECTIONS.includes(opts.skeleton)) usage('--skeleton must be food or drinks');
  if (opts.write && (opts.section !== undefined || opts.json !== undefined)) usage('--write cannot be combined with --section or --json');
  if (opts.skeleton !== undefined && (opts.section !== undefined || opts.out !== undefined || opts.write)) {
    usage('--skeleton cannot be combined with --section, --out or --write');
  }
  if (opts.out !== undefined && resolve(opts.out) === MENU_PATH) usage('--out cannot target menu-2026.json (that is --write, Plan 14-03 only)');
  return opts;
}

function failed(errors) {
  errors.slice(0, MAX_ERROR_LINES).forEach((e) => console.log(`ERROR ${e}`));
  if (errors.length > MAX_ERROR_LINES) console.log(`… ${errors.length - MAX_ERROR_LINES} more`);
  console.log(`TRANSLATIONS FAILED errors=${errors.length}`);
  process.exit(1);
}

function readJson(path) {
  if (!existsSync(path)) return { error: `${show(path)} not found` };
  try {
    return { data: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (e) {
    return { error: `${show(path)} is not valid JSON: ${e.message}` };
  }
}

const opts = parseArgs(process.argv.slice(2));
const basePath = opts.json !== undefined ? resolve(opts.json) : MENU_PATH;
const base = readJson(basePath);
if (base.error) failed([base.error]);

if (opts.skeleton !== undefined) {
  console.log(JSON.stringify(overlaySkeleton(base.data, opts.skeleton), null, 2));
  process.exit(0);
}

// ── overlays (not with --json) ────────────────────────────────────────────────
const errors = [];
const overlays = [];
const names = [];
if (opts.json === undefined) {
  for (const name of OVERLAY_FILES) {
    const path = join(import.meta.dirname, name);
    if (!existsSync(path)) {
      console.log(`OVERLAY ${name} absent`);
      continue;
    }
    const overlay = readJson(path);
    if (overlay.error) {
      console.log(`OVERLAY ${name} unreadable`);
      errors.push(`OVERLAY ${overlay.error}`);
      continue;
    }
    const count = (x) => (isObj(x) ? Object.keys(x).length : 0);
    console.log(`OVERLAY ${name} categories=${count(overlay.data?.categories)} items=${count(overlay.data?.items)}`);
    overlays.push(overlay.data);
    names.push(name);
  }
} else {
  console.log(`OVERLAY none (--json ${show(basePath)})`);
}

// ── merge (in memory) + checks ────────────────────────────────────────────────
const { menu: merged, errors: mergeErrors } = mergeTranslations(base.data, overlays, { names });
errors.push(...mergeErrors, ...validateMenu(merged), ...validateTranslations(merged, { section: opts.section }));
if (errors.length) failed(errors);

// ── success: optional outputs, then the status line ──────────────────────────
const text = formatMenuJson(merged);
if (opts.out !== undefined) {
  const out = resolve(opts.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  console.log(`OUT ${opts.out}`);
}
if (opts.write) {
  writeFileSync(MENU_PATH, text);
  console.log(`WROTE ${show(MENU_PATH)}`);
}
const categories = (Array.isArray(merged.categories) ? merged.categories : []).filter(
  (c) => opts.section === undefined || c?.section === opts.section,
);
const items = categories.reduce((n, c) => n + (Array.isArray(c.items) ? c.items.length : 0), 0);
const fields = translatableFields(merged, { section: opts.section }).length;
console.log(`TRANSLATIONS OK categories=${categories.length} items=${items} fields=${fields} values=${fields * TRANSLATION_LOCALES.length}`);
