#!/usr/bin/env node
// Phase 13 / Plan 03: reversible end-to-end probe of the it/zh content path (I18N-01 + UI-01).
//
//   node --env-file=.env.local scripts/i18n/probe-translation.mjs [--base https://umai-ramen.fr] [--dry-run]
//
// Writes Italian and Chinese names into the Sanity fields of one menu item (Karaage) and one
// category (Entrées), refreshes the live cache (signed revalidate.mjs), checks that /it/menu
// and /zh/menu show them with the French name as the item's secondary line, then ALWAYS
// removes them again and checks that the pages and both documents are back to their
// pre-probe state.
//
// Order: baseline (read-only) -> backup of both documents -> --dry-run stops here ->
// one set transaction -> CDN wait -> revalidate -> CHECK-ON (up to 10 x 30 s) -> finally:
// one unset transaction -> CDN wait -> revalidate -> CHECK-OFF (up to 10 x 30 s) -> final
// read (no it/zh left, content identical to the backup apart from _rev / _updatedAt).
//
// CDN wait: the site reads Sanity through the API CDN (useCdn: true) and keeps tagged
// fetches until the next revalidateTag. A revalidation that re-fetches the menu before the
// CDN serves the new revision caches the OLD menu again (seen live: still pre-write 38 s
// after the write). So after each write the probe polls the site's exact menu query
// through the CDN until it shows the expected state, and a stalled check re-triggers the
// revalidation (after attempts 3 and 6).
//
// Exit codes: 0 PROBE OK (or dry run done), 1 PROBE FAILED (missing document, failed
// check), 2 usage / env error, 3 PROBE SKIP (it/zh already present: Phase 14 content
// exists, check the live page with that content instead), 4 PROBE REVERT FAILED (probe
// values may still be live: the backup path and the manual revert are printed).
// The token is never printed. Node 24 (import.meta.dirname, global fetch).

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createClient } from '@sanity/client';

const ROOT = join(import.meta.dirname, '..', '..');
const BACKUP_DIR = join(ROOT, '.planning', 'phases', '13-fondations-multilingues-page-menu-touriste', 'backup');
const REVALIDATE = join(ROOT, 'scripts', 'menu-2026', 'revalidate.mjs');
const QUERIES = join(ROOT, 'src', 'sanity', 'lib', 'queries.ts');
const API_VERSION = '2025-01-01'; // same as scripts/menu-2026/sync-menu.mjs and src/sanity/env.ts
const CDN_POLL_S = 5;
const CDN_MAX_S = 180;
const STALL_REVALIDATE_AFTER = [3, 6]; // CHECK attempts after which the revalidation is re-sent
const DEFAULT_BASE = 'https://umai-ramen.fr';

const ITEM = 'm26-item-karaage';
const CATEGORY = 'm26-cat-entrees';
const VALUES = {
  [ITEM]: { 'name.it': 'Pollo fritto giapponese', 'name.zh': '日式炸鸡块' },
  [CATEGORY]: { 'name.it': 'Antipasti', 'name.zh': '小吃' },
};
const PROBE_FIELDS = ['name.it', 'name.zh'];
const FR_ITEM = 'Karaage';
const FR_CATEGORY = 'Entrées';
const ATTEMPTS = 10;
const INTERVAL_S = 30;
const REVALIDATE_DELAY_S = 30;

const rel = (path) => relative(ROOT, path);

function usage(message) {
  if (message) console.error(`ERROR ${message}`);
  console.error('usage: node --env-file=.env.local scripts/i18n/probe-translation.mjs [--base <url>] [--dry-run]');
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { base: DEFAULT_BASE, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--help' || arg === '-h') usage();
    else if (arg === '--base') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) usage('--base needs a value');
      opts.base = value.replace(/\/+$/, '');
      i += 1;
    } else usage(`unknown argument ${arg}`);
  }
  if (!/^https?:\/\/[^/]+$/i.test(opts.base)) usage('--base must be an origin such as https://umai-ramen.fr');
  return opts;
}

const unquote = (value) => (value ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');

// ---------------------------------------------------------------- interruption

// Ctrl-C / SIGTERM never skips the revert: checks stop, the finally block still reverts.
let interrupted = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!interrupted) console.log(`${signal}: stopping the checks, the revert still runs`);
    interrupted = true;
  });
}

async function wait(seconds) {
  for (let i = 0; i < seconds && !interrupted; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
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

const FR_NAME_RE = /<p[^>]*data-fr-name[^>]*>([\s\S]*?)<\/p>/g;

function analyse(html, cache) {
  const at = html.indexOf('<body');
  const body = at === -1 ? html : html.slice(at);
  return {
    raw: html,
    cache: cache ?? '-',
    body,
    text: toText(body),
    frNames: [...body.matchAll(FR_NAME_RE)].map((m) => toText(m[1])),
  };
}

/** The item row whose <h3> holds `primary`: its name text and its FR line (or null). */
function itemRow(body, primary) {
  const headings = [...body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)];
  const index = headings.findIndex((m) => toText(m[1]).includes(primary));
  if (index === -1) return null;
  const end = index + 1 < headings.length ? headings[index + 1].index : body.length;
  const row = body.slice(headings[index].index, end);
  const fr = row.match(/<p[^>]*data-fr-name[^>]*>([\s\S]*?)<\/p>/);
  return { primary: toText(headings[index][1]), fr: fr ? toText(fr[1]) : null };
}

function texts(body, tag, needle) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
  return [...body.matchAll(re)].map((m) => toText(m[1])).filter((t) => t.includes(needle));
}

async function fetchPage(base, locale) {
  const url = `${base}/${locale}/menu`;
  let res;
  try {
    res = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'umai-probe-translation/1.0', 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    throw new Error(`fetch ${url}: ${err.cause?.code ?? err.message}`);
  }
  const html = await res.text();
  if (res.status !== 200) throw new Error(`fetch ${url}: HTTP ${res.status}`);
  return analyse(html, res.headers.get('x-nextjs-cache'));
}

let lastCacheStates = '';

async function fetchAll(base) {
  const pages = {};
  for (const locale of ['fr', 'en', 'de', 'it', 'zh']) pages[locale] = await fetchPage(base, locale);
  lastCacheStates = Object.entries(pages).map(([locale, page]) => `${locale}=${page.cache}`).join(' ');
  return pages;
}

// ---------------------------------------------------------------- checks

const evidence = [];

/** Probe values visible: translated names first, French name as the item's secondary line. */
async function checkOn(base) {
  const p = await fetchAll(base);
  const problems = [];
  const need = (ok, message) => {
    if (!ok) problems.push(message);
  };
  for (const [locale, item, category] of [
    ['zh', VALUES[ITEM]['name.zh'], VALUES[CATEGORY]['name.zh']],
    ['it', VALUES[ITEM]['name.it'], VALUES[CATEGORY]['name.it']],
  ]) {
    const page = p[locale];
    need(page.text.includes(item), `${locale}: no « ${item} »`);
    need(page.text.includes(category), `${locale}: no « ${category} »`);
    need(page.frNames.length === 1, `${locale}: ${page.frNames.length} FR-name segments (want 1)`);
    need(page.frNames.length === 1 && page.frNames[0].includes(FR_ITEM), `${locale}: FR segment « ${page.frNames[0] ?? ''} » lacks ${FR_ITEM}`);
    const row = itemRow(page.body, item);
    need(Boolean(row?.fr?.includes(FR_ITEM)), `${locale}: the FR line is not in the « ${item} » row`);
    if (problems.length === 0) {
      evidence.push(
        `EVIDENCE ${locale} item row: primary « ${row.primary} » | FR line « ${row.fr} »`,
        `EVIDENCE ${locale} category: heading « ${texts(page.body, 'h2', category)[0] ?? '-'} » | quick-nav tab « ${texts(page.body, 'button', category)[0] ?? '-'} »`,
      );
    }
  }
  for (const locale of ['en', 'de']) {
    const page = p[locale];
    need(page.frNames.length === 0, `${locale}: ${page.frNames.length} FR-name segments (want 0)`);
    need(page.text.includes(FR_ITEM) && page.text.includes(FR_CATEGORY), `${locale}: FR fallback ${FR_ITEM} / ${FR_CATEGORY} missing`);
  }
  need(p.fr.frNames.length === 0, `fr: ${p.fr.frNames.length} FR-name segments (want 0)`);
  need(p.fr.text.includes(FR_ITEM), `fr: no ${FR_ITEM}`);
  need(!p.fr.text.includes(VALUES[ITEM]['name.zh']), `fr: shows ${VALUES[ITEM]['name.zh']}`);
  if (problems.length > 0) evidence.length = 0;
  return problems;
}

/** Back to French fallback on it/zh: no probe string, no FR line. */
async function checkOff(base) {
  const p = await fetchAll(base);
  const problems = [];
  for (const [locale, field] of [['zh', 'name.zh'], ['it', 'name.it']]) {
    const page = p[locale];
    if (page.frNames.length !== 0) problems.push(`${locale}: ${page.frNames.length} FR-name segments (want 0)`);
    for (const value of [VALUES[ITEM][field], VALUES[CATEGORY][field]]) {
      if (page.text.includes(value)) problems.push(`${locale}: still shows « ${value} »`);
    }
    if (!page.text.includes(FR_ITEM) || !page.text.includes(FR_CATEGORY)) {
      problems.push(`${locale}: FR fallback ${FR_ITEM} / ${FR_CATEGORY} missing`);
    }
  }
  for (const locale of ['fr', 'en', 'de']) {
    if (p[locale].frNames.length !== 0) problems.push(`${locale}: ${p[locale].frNames.length} FR-name segments (want 0)`);
  }
  // The RSC payload of every menu page carries the category `name` objects (quick-nav props):
  // no probe value may be left in the data the site renders from, visible or not.
  // (小吃 alone is not checked raw: the zh meta description contains it.)
  for (const [locale, page] of Object.entries(p)) {
    for (const value of [VALUES[ITEM]['name.zh'], VALUES[ITEM]['name.it'], VALUES[CATEGORY]['name.it']]) {
      if (page.raw.includes(value)) problems.push(`${locale}: page payload still contains « ${value} »`);
    }
  }
  return problems;
}

/** Up to `attempts` checks 30 s apart; after attempts 3 and 6 the revalidation is re-sent. */
async function poll(label, check, base, attempts = ATTEMPTS, onStall = null) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (interrupted) {
      console.log(`${label} skipped (interrupted)`);
      return false;
    }
    let problems;
    try {
      problems = await check(base);
    } catch (err) {
      problems = [err.message];
    }
    if (problems.length === 0) {
      console.log(`${label} OK attempt ${attempt}/${attempts} (x-nextjs-cache ${lastCacheStates})`);
      return true;
    }
    console.log(`${label} attempt ${attempt}/${attempts}: ${problems.slice(0, 4).join('; ')} (x-nextjs-cache ${lastCacheStates})`);
    if (attempt < attempts && onStall && STALL_REVALIDATE_AFTER.includes(attempt)) {
      console.log(`${label} stalled: revalidating again`);
      await onStall();
    }
    if (attempt < attempts) await wait(INTERVAL_S);
  }
  return false;
}

function revalidate(base, delay = REVALIDATE_DELAY_S) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [REVALIDATE, '--url', `${base}/api/revalidate`, '--types', 'menuCategory,menuItem', '--delay', String(delay)],
      { stdio: 'inherit', env: process.env },
    );
    child.on('error', () => resolve(1));
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

// ---------------------------------------------------------------- API CDN

/** The site's menu query, read from the source so the CDN cache entry is the site's own. */
function menuQuery() {
  const match = readFileSync(QUERIES, 'utf8').match(/MENU_CATEGORIES_QUERY = defineQuery\(`([\s\S]*?)`\)/);
  if (!match) throw new Error(`MENU_CATEGORIES_QUERY not found in ${rel(QUERIES)}`);
  return match[1];
}

/**
 * Polls the site's exact menu query through the API CDN (site client options: CDN, no
 * token) until the probe documents show the expected state. Returns false on timeout.
 */
async function waitForCdn(cdnClient, label, wantProbe) {
  const query = menuQuery();
  const started = Date.now();
  let state = '';
  while (!interrupted && Date.now() - started <= CDN_MAX_S * 1000) {
    try {
      const categories = await cdnClient.fetch(query);
      const category = categories.find((c) => c._id === CATEGORY);
      const item = category?.items?.find((i) => i._id === ITEM);
      const names = [category?.name, item?.name];
      const ok = wantProbe
        ? category?.name?.it === VALUES[CATEGORY]['name.it'] &&
          category?.name?.zh === VALUES[CATEGORY]['name.zh'] &&
          item?.name?.it === VALUES[ITEM]['name.it'] &&
          item?.name?.zh === VALUES[ITEM]['name.zh']
        : Boolean(category && item) && names.every((name) => name?.it === undefined && name?.zh === undefined);
      state = `category it/zh ${category?.name?.it ?? '-'} / ${category?.name?.zh ?? '-'}, item it/zh ${item?.name?.it ?? '-'} / ${item?.name?.zh ?? '-'}`;
      if (ok) {
        console.log(`${label} API CDN up to date after ${Math.round((Date.now() - started) / 1000)}s (${state})`);
        return true;
      }
    } catch (err) {
      state = `error ${err.message}`;
    }
    await wait(CDN_POLL_S);
  }
  console.log(`${label} API CDN still stale after ${CDN_MAX_S}s (${state}): revalidating anyway`);
  return false;
}

// ---------------------------------------------------------------- documents

const fieldValue = (doc, path) => path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), doc);
const probeFieldsPresent = (doc) => PROBE_FIELDS.filter((path) => fieldValue(doc, path) !== undefined);

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

function manualRevert(backupPath) {
  return [
    `backup: ${rel(backupPath)}`,
    'manual revert (repo root): node --env-file=.env.local --input-type=module -e "' +
      "import { createClient } from '@sanity/client'; " +
      "const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2025-01-01', token: process.env.SANITY_TOKEN, useCdn: false }); " +
      `console.log(await c.transaction().patch('${ITEM}', (p) => p.unset(['name.it', 'name.zh'])).patch('${CATEGORY}', (p) => p.unset(['name.it', 'name.zh'])).commit());` +
      '"',
    'then: node --env-file=.env.local scripts/menu-2026/revalidate.mjs --types menuCategory,menuItem',
    'or in Studio: clear « Italien » and « Chinois (simplifié) » of Karaage and Entrées, publish, then run revalidate.mjs',
  ];
}

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));
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

  const client = createClient({ ...env, apiVersion: API_VERSION, useCdn: false, perspective: 'raw' });
  // Same options as the site's client (src/sanity/lib/client.ts): API CDN, no token.
  const cdnClient = createClient({ projectId: env.projectId, dataset: env.dataset, apiVersion: API_VERSION, useCdn: true });
  menuQuery(); // fail before any write if the site's query cannot be read
  console.log(`Target: Sanity ${env.projectId}/${env.dataset}, site ${opts.base}`);

  // 1. Read both documents.
  const docs = await client.getDocuments([ITEM, CATEGORY]);
  const missingDocs = [ITEM, CATEGORY].filter((id, index) => !docs[index]);
  if (missingDocs.length > 0) {
    console.log(`PROBE FAILED missing document ${missingDocs.join(', ')}`);
    return 1;
  }
  const present = docs.flatMap((doc) => probeFieldsPresent(doc).map((path) => `${doc._id}.${path}`));
  if (present.length > 0) {
    console.log(`PROBE SKIP it/zh already present (${present.join(', ')}): check the live page with that content instead`);
    return 3;
  }
  const drafts = await client.fetch('*[_id in $ids]._id', { ids: [ITEM, CATEGORY].map((id) => `drafts.${id}`) });
  if (drafts.length > 0) console.log(`WARN open Studio draft(s) ${drafts.join(', ')}: the probe patches the published documents only`);

  // Baseline (read-only): the live pages must be the Phase 13 pages in French fallback.
  const baseline = await poll('BASELINE', checkOff, opts.base, 1);
  if (!baseline) {
    console.log('PROBE FAILED baseline: the live it/zh menus are not in the expected pre-probe state (nothing written)');
    return 1;
  }

  // 2. Backup.
  const now = new Date();
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = join(BACKUP_DIR, `probe-backup-${stamp(now)}.json`);
  writeFileSync(
    backupPath,
    `${JSON.stringify({ exportedAt: now.toISOString(), projectId: env.projectId, dataset: env.dataset, documents: docs }, null, 2)}\n`,
  );
  console.log(`PROBE BACKUP ${rel(backupPath)}`);

  if (opts.dryRun) {
    await waitForCdn(cdnClient, 'DRY-RUN', false); // read-only: the CDN check works on the current state
    for (const id of [ITEM, CATEGORY]) console.log(`PLAN set   ${id} ${JSON.stringify(VALUES[id])}`);
    for (const id of [ITEM, CATEGORY]) console.log(`PLAN unset ${id} ${JSON.stringify(PROBE_FIELDS)} (always, after the checks)`);
    console.log('PROBE DRY-RUN done (nothing written to Sanity)');
    return 0;
  }

  // 3-4. Apply, check, and ALWAYS revert.
  let failure = null;
  try {
    const applied = await client
      .transaction()
      .patch(ITEM, (patch) => patch.set(VALUES[ITEM]))
      .patch(CATEGORY, (patch) => patch.set(VALUES[CATEGORY]))
      .commit({ visibility: 'sync' });
    console.log(`PROBE APPLIED ${applied.transactionId}`);
    await waitForCdn(cdnClient, 'APPLY', true);
    const code = await revalidate(opts.base);
    if (code !== 0) console.log(`WARN revalidate.mjs exit ${code}`);
    if (!(await poll('CHECK-ON', checkOn, opts.base, ATTEMPTS, () => revalidate(opts.base, 0)))) failure = 'CHECK-ON';
  } catch (err) {
    failure = `apply: ${err.message}`;
    console.log(`ERROR ${failure}`);
  } finally {
    try {
      const reverted = await client
        .transaction()
        .patch(ITEM, (patch) => patch.unset(PROBE_FIELDS))
        .patch(CATEGORY, (patch) => patch.unset(PROBE_FIELDS))
        .commit({ visibility: 'sync' });
      console.log(`PROBE REVERTED ${reverted.transactionId}`);
    } catch (err) {
      console.log(`PROBE REVERT FAILED ${err.message}`);
      for (const line of manualRevert(backupPath)) console.log(line);
      return 4;
    }
  }

  await waitForCdn(cdnClient, 'REVERT', false);
  const code = await revalidate(opts.base);
  if (code !== 0) console.log(`WARN revalidate.mjs exit ${code}`);
  const off = await poll('CHECK-OFF', checkOff, opts.base, ATTEMPTS, () => revalidate(opts.base, 0));
  if (!off) {
    failure ??= 'CHECK-OFF';
    console.log('WARN the live it/zh menus may still show probe values: once the API CDN is fresh, run');
    console.log('     node --env-file=.env.local scripts/menu-2026/revalidate.mjs --types menuCategory,menuItem');
  }

  // Final read: no it/zh left, content identical to the backup (apart from _rev/_updatedAt).
  const after = await client.getDocuments([ITEM, CATEGORY]);
  const leftovers = after.flatMap((doc) => (doc ? probeFieldsPresent(doc).map((path) => `${doc._id}.${path}`) : []));
  const changed = [ITEM, CATEGORY].filter(
    (id, index) => JSON.stringify(canonical(after[index])) !== JSON.stringify(canonical(docs[index])),
  );
  if (leftovers.length > 0) failure ??= `final read: ${leftovers.join(', ')} still set`;
  else if (changed.length > 0) failure ??= `final read: ${changed.join(', ')} differ from the backup`;
  else console.log('FINAL READ OK: no name.it / name.zh, both documents identical to the backup (apart from _rev/_updatedAt)');

  for (const line of evidence) console.log(line);
  if (failure) {
    console.log(`PROBE FAILED ${failure}`);
    return 1;
  }
  console.log('PROBE OK');
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`ERROR ${err?.message ?? err}`);
    process.exit(err?.statusCode === 401 || err?.statusCode === 403 ? 2 : 1);
  },
);
