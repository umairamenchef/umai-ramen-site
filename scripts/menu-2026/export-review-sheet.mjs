#!/usr/bin/env node
/**
 * UMAÏ Ramen: regenerate the native-speaker review sheet of the menu translations from Sanity (Phase 14, TRANS-03).
 *
 *   node --env-file=.env.local scripts/menu-2026/export-review-sheet.mjs [--out <file>] [--strict]
 *
 * Reads the PUBLISHED menu (the categories that have visible items, and those items), read-only, and writes
 * `Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)`, one row per translatable field in print order, to
 * .planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv (or --out). The sheet is built from Sanity, not from
 * menu-2026.json: after a native speaker's corrections are made in Studio, running this again reproduces the sheet.
 * CSV choices for French Excel: separator `;`, UTF-8 with a BOM (Excel then shows Chinese), CRLF line ends.
 * No timestamp in the file: two exports of an unchanged Sanity are byte-identical.
 *
 * Output: `REVIEW SHEET rows=<data rows> categories=<n> items=<n> empty=<empty FR..ZH cells> file=<path>`
 * (path relative to the repo root when inside it). With --strict, a sheet that still has empty translation cells prints
 * `STRICT: <n> empty cells` and exits 1 (the file is still written). Exit codes: 0 ok, 1 strict failure or Sanity error,
 * 2 usage / missing env.
 * Env: NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET (required), SANITY_TOKEN (optional, used when
 * present, never printed). `main(argv, deps)` is exported for the tests (deps: env, makeClient, root, out, err).
 */
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@sanity/client';
import { buildReviewRows, toCsv } from './translation-checks.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const DEFAULT_OUT = '.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv';
const API_VERSION = '2025-01-01';
const USAGE = 'usage: node --env-file=.env.local scripts/menu-2026/export-review-sheet.mjs [--out <file>] [--strict]';

// The categories and items the menu page shows (visible items only), in print order (`order`; `_id` breaks a tie so
// the file stays deterministic).
const QUERY = `*[_type == "menuCategory" && count(*[_type == "menuItem" && references(^._id) && available == true]) > 0] | order(order asc, _id asc) {
  _id, name, description, footnote,
  "items": *[_type == "menuItem" && references(^._id) && available == true] | order(order asc, _id asc) { _id, name, description, subgroup, prices[]{ _key, label } }
}`;

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { out: null, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') return { help: true };
    if (arg === '--strict') {
      opts.strict = true;
    } else if (arg === '--out') {
      const value = argv[i + 1];
      if (value === undefined || value === '' || value.startsWith('--')) throw new UsageError('--out needs a file');
      opts.out = value;
      i += 1;
    } else {
      throw new UsageError(`unknown argument ${arg}`);
    }
  }
  return opts;
}

/** Runs the CLI; resolves to the exit code. `deps` (all optional): env, makeClient, root, out, err. */
export async function main(argv, deps = {}) {
  const root = deps.root ?? ROOT;
  const out = deps.out ?? ((line) => console.log(line));
  const err = deps.err ?? ((line) => console.error(line));
  const env = deps.env ?? process.env;
  const makeClient = deps.makeClient ?? createClient;

  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    err(`ERROR ${e.message}`);
    err(USAGE);
    return 2;
  }
  if (opts.help) {
    out(USAGE);
    return 0;
  }

  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
  const missing = Object.entries({ NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset })
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    err(`ERROR missing env: ${missing.join(', ')} (run with node --env-file=.env.local ...)`);
    return 2;
  }

  try {
    const client = makeClient({ projectId, dataset, apiVersion: API_VERSION, token: env.SANITY_TOKEN || undefined, useCdn: false, perspective: 'published' });
    const categories = await client.fetch(QUERY);
    if (!Array.isArray(categories)) throw new Error('unexpected Sanity answer (not a list of categories)');
    const rows = buildReviewRows(categories);
    const data = rows.slice(1);
    const empty = data.reduce((n, row) => n + row.slice(2).filter((c) => c === '').length, 0);
    const items = categories.reduce((n, c) => n + (Array.isArray(c?.items) ? c.items.length : 0), 0);

    const file = resolve(opts.out ?? join(root, DEFAULT_OUT));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, toCsv(rows));
    const shown = relative(root, file);
    out(`REVIEW SHEET rows=${data.length} categories=${categories.length} items=${items} empty=${empty} file=${shown && !shown.startsWith('..') ? shown : file}`);
    if (opts.strict && empty > 0) {
      out(`STRICT: ${empty} empty cells`);
      return 1;
    }
    return 0;
  } catch (e) {
    err(`ERROR ${e?.message ?? e}`);
    return 1;
  }
}

function isEntryPoint() {
  try {
    return process.argv[1] !== undefined && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  main(process.argv.slice(2)).then(
    (code) => process.stdout.write('', () => process.stderr.write('', () => process.exit(code))),
    (e) => {
      console.error(`ERROR ${e?.stack ?? e}`);
      process.exit(1);
    },
  );
}
