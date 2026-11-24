#!/usr/bin/env node
// Phase 15 / Plan 03: reversible live probe of Sanity -> site freshness (Phase 13 deferred item 3).
//
//   node --env-file=.env.local scripts/i18n/probe-freshness.mjs [--base https://umai-ramen.fr]
//        [--backup-dir <path>] [--dry-run]
//
// Purpose: prove that, now that the site's Sanity client reads the origin API (useCdn: false
// in src/sanity/lib/client.ts), a write followed by an IMMEDIATE signed revalidation is
// visible on the live page at once. Through the API CDN the same revalidation used to
// re-cache the old content (the CDN served it for 86 to 111 s after a write, 13-03). The
// probe works in any translation state: it changes one field (name.it of Karaage, shown on
// /it/menu) to a unique marker and always restores the exact previous value, or removes the
// field again if it was absent.
//
// --base is an origin (default https://umai-ramen.fr). --backup-dir is resolved from the repo
// root (default .planning/phases/15-qr-codes-supports-imprimables/backup). --dry-run stops
// after the read-only baseline and the backup and prints what a real run would write.
//
// Order of operations:
//    1. env check (prints the NAMES of missing variables only)                     -> exit 2
//    2. clients: origin API (token, raw perspective) for reads and writes; API CDN without
//       token (the site's configuration before Phase 15) for the control
//    3. read the document; refuse if name.it already holds a PROBE- marker (a leftover)
//    4. BASELINE (read-only): GET <base>/it/menu is 200 and carries no PROBE- string
//    5. JSON backup of the document in --backup-dir
//    6. --dry-run stops here
//    7. prime the API CDN with the pre-write menu (the site's exact menu query)
//    8. write name.it = "<previous value or French name> PROBE-<stamp>" (ifRevisionId)
//    9. revalidate at once (scripts/menu-2026/revalidate.mjs --delay 0)
//   10. CHECK-ON: up to 3 GETs 10 s apart, no re-revalidation: the marker is in the visible text
//   11. CONTROL: the menu query through the API CDN. stale=true means the CDN still served the
//       pre-write value while the page was already fresh, so the page read the origin API
//   12. finally (also after an error or Ctrl-C, which only stops the checks): restore name.it
//       exactly, guarded by ifRevisionId(<revision written in step 8>)
//   13. revalidate at once; CHECK-OFF: up to 3 GETs 10 s apart, the marker is gone from the
//       whole HTML (visible text and RSC payload). If it is still there: wait until the API
//       CDN no longer serves it (max 180 s), revalidate, then up to 10 GETs 30 s apart with a
//       re-revalidation after attempts 3 and 6
//   14. FINAL READ: the document equals the backup (apart from _rev / _updatedAt)
//
// Last line: `FRESHNESS OK check-on-attempt=<a> control-cdn-stale=<bool>` or
// `FRESHNESS FAILED <reason>`.
// Exit codes: 0 OK (or dry run done), 1 FAILED (missing document, leftover marker, baseline,
// failed check, final read; the field is restored whenever it was written), 2 usage / env
// error, 4 FRESHNESS REVERT FAILED (the marker may still be live: the manual restore is
// printed). The token and the webhook secret are never printed.
// Node 24 ESM (import.meta.dirname, global fetch). Helpers are COPIED from
// probe-translation.mjs, which runs main() at import time and must never be imported.

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createClient } from '@sanity/client';

const ROOT = join(import.meta.dirname, '..', '..');
const DEFAULT_BACKUP_DIR = '.planning/phases/15-qr-codes-supports-imprimables/backup';
const REVALIDATE = join(ROOT, 'scripts', 'menu-2026', 'revalidate.mjs');
const QUERIES = join(ROOT, 'src', 'sanity', 'lib', 'queries.ts');
const DEFAULT_BASE = 'https://umai-ramen.fr';

const ITEM = 'm26-item-karaage';
const FIELD = 'name.it';
const PAGE = '/it/menu';
const API_VERSION = '2025-01-01'; // same as src/sanity/env.ts
const ON_ATTEMPTS = 3;
const ON_INTERVAL_S = 10;
const OFF_ATTEMPTS = 3;
const OFF_INTERVAL_S = 10;
const OFF_FALLBACK_ATTEMPTS = 10;
const OFF_FALLBACK_INTERVAL_S = 30;
const OFF_FALLBACK_REVALIDATE_AFTER = [3, 6];
const CDN_POLL_S = 5;
const CDN_MAX_S = 180;
const MARKER_TAG = 'PROBE-';

const USAGE =
  'usage: node --env-file=.env.local scripts/i18n/probe-freshness.mjs [--base <origin>] [--backup-dir <path>] [--dry-run]';

function usage(message) {
  if (message) console.error(`ERROR ${message}`);
  console.error(USAGE);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { base: DEFAULT_BASE, backupDir: resolve(ROOT, DEFAULT_BACKUP_DIR), dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--help' || arg === '-h') usage();
    else if (arg === '--base' || arg === '--backup-dir') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) usage(`${arg} needs a value`);
      if (arg === '--base') opts.base = value.replace(/\/+$/, '');
      else opts.backupDir = resolve(ROOT, value);
      i += 1;
    } else usage(`unknown argument ${arg}`);
  }
  if (!/^https?:\/\/[^/]+$/i.test(opts.base)) usage('--base must be an origin such as https://umai-ramen.fr');
  return opts;
}

const unquote = (value) => (value ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');

/** Repo-relative path when the file is inside the repo, absolute otherwise. */
function shown(path) {
  const rel = relative(ROOT, path);
  return rel.startsWith('..') ? path : rel;
}

// ---------------------------------------------------------------- interruption

// Ctrl-C / SIGTERM never skips the restore: checks stop, the finally block still restores.
let interrupted = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!interrupted) console.log(`${signal}: stopping the checks, the restore still runs`);
    interrupted = true;
  });
}

async function wait(seconds) {
  for (let i = 0; i < seconds && !interrupted; i += 1) {
    await new Promise((done) => setTimeout(done, 1000));
  }
}

// ---------------------------------------------------------------- page text

function decodeEntities(value) {
  return value
    .replace(/&(?:#x27|#39|apos);/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&amp;/g, '&');
}

/** Visible text: scripts, styles and comments (React's `<!-- -->`) out, tags out, NBSP -> space. */
function toText(html) {
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped)
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPage(base) {
  const url = `${base}${PAGE}`;
  let res;
  try {
    res = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'umai-probe-freshness/1.0', 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    throw new Error(`fetch ${url}: ${err.cause?.code ?? err.message}`);
  }
  const html = await res.text();
  if (res.status !== 200) throw new Error(`fetch ${url}: HTTP ${res.status}`);
  const at = html.indexOf('<body');
  return {
    raw: html,
    text: toText(at === -1 ? html : html.slice(at)),
    cache: res.headers.get('x-nextjs-cache') ?? '-',
  };
}

/**
 * Up to `attempts` checks `interval` s apart; after the attempts listed in `stallAfter`,
 * `onStall` runs (re-revalidation). A check returns { problem, cache }. Returns the attempt
 * that passed, or 0.
 */
async function poll(label, check, { attempts, interval, stallAfter = [], onStall = null }) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (interrupted) {
      console.log(`${label} skipped (interrupted)`);
      return 0;
    }
    let problem;
    let cache = '-';
    try {
      ({ problem, cache } = await check());
    } catch (err) {
      problem = err.message;
    }
    if (!problem) {
      console.log(`${label} OK attempt ${attempt}/${attempts} (x-nextjs-cache ${cache})`);
      return attempt;
    }
    console.log(`${label} attempt ${attempt}/${attempts}: ${problem} (x-nextjs-cache ${cache})`);
    if (attempt < attempts && onStall && stallAfter.includes(attempt)) {
      console.log(`${label} stalled: revalidating again`);
      await onStall();
    }
    if (attempt < attempts) await wait(interval);
  }
  return 0;
}

/** Signed revalidation of the menu tags, at once (no delay). Resolves with the exit code. */
function revalidate(base) {
  return new Promise((done) => {
    const child = spawn(
      process.execPath,
      [REVALIDATE, '--url', `${base}/api/revalidate`, '--types', 'menuCategory,menuItem', '--delay', '0'],
      { stdio: 'inherit', env: process.env },
    );
    child.on('error', () => done(1));
    child.on('exit', (code) => done(code ?? 1));
  });
}

// ---------------------------------------------------------------- API CDN

/** The site's menu query, read from the source so the CDN cache entry is the site's own. */
function menuQuery() {
  const match = readFileSync(QUERIES, 'utf8').match(/MENU_CATEGORIES_QUERY = defineQuery\(`([\s\S]*?)`\)/);
  if (!match) throw new Error(`MENU_CATEGORIES_QUERY not found in ${shown(QUERIES)}`);
  return match[1];
}

/** name.it of the probe item as the API CDN serves the site's menu query (undefined if absent). */
async function cdnItemName(cdnClient) {
  const categories = await cdnClient.fetch(menuQuery());
  for (const category of categories ?? []) {
    for (const item of category?.items ?? []) {
      if (item?._id === ITEM) return item.name?.it;
    }
  }
  throw new Error(`${ITEM} not found in the API CDN menu`);
}

const describe = (value) => (value === undefined ? '(absent)' : JSON.stringify(value));

/** Fallback of step 13: waits until the API CDN no longer serves the marker. */
async function waitForCdnClean(cdnClient, token) {
  const started = Date.now();
  let state = '';
  while (!interrupted && Date.now() - started <= CDN_MAX_S * 1000) {
    try {
      const name = await cdnItemName(cdnClient);
      state = `${FIELD} ${describe(name)}`;
      if (!(typeof name === 'string' && name.includes(token))) {
        console.log(`CDN WAIT API CDN clean after ${Math.round((Date.now() - started) / 1000)}s (${state})`);
        return true;
      }
    } catch (err) {
      state = `error ${err.message}`;
    }
    await wait(CDN_POLL_S);
  }
  console.log(`CDN WAIT API CDN still serves the marker after ${CDN_MAX_S}s (${state}): revalidating anyway`);
  return false;
}

// ---------------------------------------------------------------- documents

/** Sorted-key JSON without the fields every write changes. */
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== '_rev' && key !== '_updatedAt')
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function stamp(date) {
  const iso = date.toISOString(); // UTC
  return `${iso.slice(0, 10).replaceAll('-', '')}-${iso.slice(11, 19).replaceAll(':', '')}`;
}

function manualRestore(before, backup) {
  return [
    `backup: ${backup}`,
    `Studio: Karaage -> Traductions -> Italien = ${before === undefined ? 'empty (clear the field)' : `« ${before} »`}, publish, then`,
    '        node --env-file=.env.local scripts/menu-2026/revalidate.mjs',
  ];
}

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  // 1. Environment (names only, never values).
  const env = {
    projectId: unquote(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
    dataset: unquote(process.env.NEXT_PUBLIC_SANITY_DATASET),
    token: unquote(process.env.SANITY_TOKEN),
  };
  const missing = Object.entries({
    NEXT_PUBLIC_SANITY_PROJECT_ID: env.projectId,
    NEXT_PUBLIC_SANITY_DATASET: env.dataset,
    SANITY_TOKEN: env.token,
    SANITY_WEBHOOK_SECRET: unquote(process.env.SANITY_WEBHOOK_SECRET),
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) usage(`missing env: ${missing.join(', ')} (run with node --env-file=.env.local ...)`);

  // 2. Clients.
  const client = createClient({ ...env, apiVersion: API_VERSION, useCdn: false, perspective: 'raw' });
  const cdnClient = createClient({ projectId: env.projectId, dataset: env.dataset, apiVersion: API_VERSION, useCdn: true });
  menuQuery(); // fail before any write if the site's query cannot be read
  console.log(`Target: Sanity ${env.projectId}/${env.dataset}, page ${opts.base}${PAGE}, field ${ITEM} ${FIELD}`);

  // 3. The document.
  const doc = await client.getDocument(ITEM);
  if (!doc) {
    console.log(`FRESHNESS FAILED missing document ${ITEM}`);
    return 1;
  }
  const french = doc.name?.fr;
  const before = doc.name?.it;
  if (typeof french !== 'string' || french.trim() === '') {
    console.log(`FRESHNESS FAILED ${ITEM} has no name.fr (nothing written)`);
    return 1;
  }
  if (before !== undefined && typeof before !== 'string') {
    console.log(`FRESHNESS FAILED ${ITEM} ${FIELD} is not a string: ${JSON.stringify(before)} (nothing written)`);
    return 1;
  }
  if (typeof before === 'string' && before.includes(MARKER_TAG)) {
    console.log(`FRESHNESS FAILED leftover marker in ${ITEM} ${FIELD}: « ${before} » (nothing written)`);
    console.log(`restore it first: Studio -> Karaage -> Traductions -> Italien = the ${FIELD} of the latest backup in`);
    console.log(`  ${shown(opts.backupDir)} (empty if the backup has none), publish, then`);
    console.log('  node --env-file=.env.local scripts/menu-2026/revalidate.mjs');
    return 1;
  }
  if (await client.getDocument(`drafts.${ITEM}`)) {
    console.log(`WARN open Studio draft drafts.${ITEM}: the probe patches the published document only`);
  }
  console.log(`BEFORE ${FIELD} = ${describe(before)} (rev ${doc._rev})`);

  // 4. Baseline (read-only).
  let baseline;
  try {
    baseline = await fetchPage(opts.base);
  } catch (err) {
    console.log(`FRESHNESS FAILED baseline: ${err.message} (nothing written)`);
    return 1;
  }
  if (baseline.raw.includes(MARKER_TAG)) {
    console.log(`FRESHNESS FAILED baseline: ${PAGE} already contains a ${MARKER_TAG} string (nothing written)`);
    return 1;
  }
  console.log(`BASELINE OK ${PAGE} 200, no ${MARKER_TAG} (x-nextjs-cache ${baseline.cache})`);

  // 5. Backup.
  const now = new Date();
  const tag = stamp(now);
  mkdirSync(opts.backupDir, { recursive: true });
  const backupPath = join(opts.backupDir, `freshness-backup-${tag}.json`);
  writeFileSync(
    backupPath,
    `${JSON.stringify({ exportedAt: now.toISOString(), projectId: env.projectId, dataset: env.dataset, documents: [doc] }, null, 2)}\n`,
  );
  console.log(`BACKUP ${shown(backupPath)}`);

  const token = `${MARKER_TAG}${tag}`;
  const marker = `${before ?? french} ${token}`;

  // 6. Dry run.
  if (opts.dryRun) {
    console.log(`PLAN set ${FIELD} = ${JSON.stringify(marker)}`);
    console.log(`PLAN restore ${FIELD} = ${before === undefined ? 'unset' : JSON.stringify(before)}`);
    console.log('FRESHNESS DRY-RUN done (nothing written)');
    return 0;
  }

  // 7. Prime the API CDN with the pre-write menu (the control of step 11 reads this entry).
  try {
    console.log(`PRIMED API CDN with the pre-write menu (${FIELD} ${describe(await cdnItemName(cdnClient))})`);
  } catch (err) {
    console.log(`WARN priming the API CDN failed (${err.message}): the control may read a fresh CDN entry`);
  }

  let appliedRev = null;
  let writtenAt = 0;
  let onAttempt = 0;
  let controlStale = 'unknown';
  let failure = null;
  let revertFailed = false;
  try {
    // 8. Write.
    try {
      const applied = await client
        .patch(ITEM)
        .ifRevisionId(doc._rev)
        .set({ [FIELD]: marker })
        .commit({ visibility: 'sync' });
      appliedRev = applied._rev;
    } catch (err) {
      // A lost response can hide a committed write: look before giving up.
      const current = await client.getDocument(ITEM).catch(() => null);
      if (current?.name?.it !== marker) throw err;
      appliedRev = current._rev;
    }
    writtenAt = Date.now();
    console.log(`PROBE APPLIED rev ${appliedRev} marker « ${marker} »`);

    // 9. Revalidate at once.
    const code = await revalidate(opts.base);
    if (code !== 0) console.log(`WARN revalidate.mjs exit ${code}`);

    // 10. CHECK-ON, no re-revalidation.
    onAttempt = await poll(
      'CHECK-ON',
      async () => {
        const page = await fetchPage(opts.base);
        return { cache: page.cache, problem: page.text.includes(marker) ? null : 'marker not visible' };
      },
      { attempts: ON_ATTEMPTS, interval: ON_INTERVAL_S },
    );
    if (!onAttempt) failure = `CHECK-ON: marker not visible on ${PAGE} after ${ON_ATTEMPTS} attempts`;

    // 11. Control: what the API CDN serves now.
    try {
      const cdnName = await cdnItemName(cdnClient);
      controlStale = String(cdnName !== marker);
      console.log(
        `CONTROL API CDN stale=${controlStale} ${Math.round((Date.now() - writtenAt) / 1000)}s after the write (${FIELD} ${describe(cdnName)})`,
      );
    } catch (err) {
      console.log(`CONTROL API CDN error ${err.message}`);
    }
  } catch (err) {
    failure ??= `apply: ${err.message}`;
    console.log(`ERROR ${failure}`);
  } finally {
    // 12. Restore, whatever happened, if the marker was written.
    if (appliedRev) {
      try {
        const patch = client.patch(ITEM).ifRevisionId(appliedRev);
        const reverted = await (before === undefined ? patch.unset([FIELD]) : patch.set({ [FIELD]: before })).commit({
          visibility: 'sync',
        });
        console.log(`PROBE REVERTED rev ${reverted._rev}`);
      } catch (err) {
        revertFailed = true;
        console.log(`FRESHNESS REVERT FAILED ${err.message}`);
        for (const line of manualRestore(before, shown(backupPath))) console.log(line);
      }
    }
  }
  if (revertFailed) return 4;
  if (!appliedRev) {
    console.log(`FRESHNESS FAILED ${failure ?? 'nothing written'}`);
    return 1;
  }

  // 13. Revalidate at once; CHECK-OFF on the whole HTML.
  const checkOff = async () => {
    const page = await fetchPage(opts.base);
    return { cache: page.cache, problem: page.raw.includes(token) ? 'marker still in the page' : null };
  };
  let code = await revalidate(opts.base);
  if (code !== 0) console.log(`WARN revalidate.mjs exit ${code}`);
  let offAttempt = await poll('CHECK-OFF', checkOff, { attempts: OFF_ATTEMPTS, interval: OFF_INTERVAL_S });
  if (!offAttempt && !interrupted) {
    console.log('CHECK-OFF without CDN wait failed: falling back to the CDN wait');
    await waitForCdnClean(cdnClient, token);
    code = await revalidate(opts.base);
    if (code !== 0) console.log(`WARN revalidate.mjs exit ${code}`);
    offAttempt = await poll('CHECK-OFF', checkOff, {
      attempts: OFF_FALLBACK_ATTEMPTS,
      interval: OFF_FALLBACK_INTERVAL_S,
      stallAfter: OFF_FALLBACK_REVALIDATE_AFTER,
      onStall: () => revalidate(opts.base),
    });
  }
  if (!offAttempt) {
    failure ??= `CHECK-OFF: the marker is still on ${PAGE}`;
    console.log(`WARN ${PAGE} may still show the marker: run node --env-file=.env.local scripts/menu-2026/revalidate.mjs`);
  }

  // 14. Final read against the backup.
  const after = await client.getDocument(ITEM);
  if (JSON.stringify(canonical(after)) === JSON.stringify(canonical(doc))) {
    console.log(`FINAL READ OK: ${ITEM} identical to the backup (apart from _rev/_updatedAt), ${FIELD} = ${describe(after?.name?.it)}`);
  } else {
    failure ??= `final read: ${ITEM} differs from the backup (${FIELD} = ${describe(after?.name?.it)})`;
  }

  // 15. Verdict.
  if (failure) {
    console.log(`FRESHNESS FAILED ${failure}`);
    return 1;
  }
  console.log(`FRESHNESS OK check-on-attempt=${onAttempt} control-cdn-stale=${controlStale}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`ERROR ${err?.message ?? err}`);
    process.exit(err?.statusCode === 401 || err?.statusCode === 403 ? 2 : 1);
  },
);
