#!/usr/bin/env node
/**
 * UMAÏ Ramen: publish the 2026 print menu (scripts/menu-2026/menu-2026.json) to Sanity.
 *
 * Usage:
 *   node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --dry-run            (default when no mode flag)
 *   node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --backup-only
 *   node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --apply [--skip-live-guard]
 *   node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback [--backup <file>] [--dry-run]
 *   (--full with --dry-run / --apply prints every mutation instead of the first 15;
 *    --dump <file> with --dry-run writes the exact planned mutations as JSON, for review)
 *
 * What it does (12-CONTEXT « Sanity write strategy »):
 *   - validates menu-2026.json (menu-schema.mjs) before any network call;
 *   - writes one menuCategory per JSON category and one menuItem per JSON item, with deterministic
 *     ids m26-cat-<key> / m26-item-<key>, via createOrReplace in ONE transaction (idempotent:
 *     re-runs replace them; Phase 14 re-runs it with translations);
 *   - hides every legacy menuItem / menuExtra / menuFormule (available=false). NEVER deletes them;
 *   - `image` is Studio-owned: an image already on an m26 item is kept; otherwise the 3 home-card
 *     photos are copied from the legacy docs named by `imageFrom` (run-time lookup, no asset id
 *     hard-coded); nothing else is ever copied from legacy docs;
 *   - --apply: blocked unless the live /fr/menu already runs the Phase 12 code (live guard), writes a
 *     JSON backup of every menu document first, commits, then checks the published dataset;
 *   - --rollback: restores the `available` flags from the pre-sync backup and deletes the m26- docs;
 *   - --dry-run / --apply regenerate the FR discrepancy report 12-DISCREPANCY-REPORT.md.
 *
 * Backups: .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-<YYYYMMDD-HHmmss UTC>[-suffix].json
 * Env (.env.local): NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_TOKEN (never printed),
 *                   SITE_URL (optional, default https://umai-ramen.fr) for the live guard.
 * Exit codes: 0 ok · 1 error (invalid JSON, failed check, Sanity error) · 2 usage / missing env ·
 *             3 --apply blocked by the live guard.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createClient } from '@sanity/client';
import { LOCALES, validateMenu } from './menu-schema.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const PHASE_DIR = join(ROOT, '.planning/phases/12-synchronisation-menu-print-2026-sanity');
const BACKUP_DIR = join(PHASE_DIR, 'backup');
const REPORT = join(PHASE_DIR, '12-DISCREPANCY-REPORT.md');
const JSON_PATH = join(ROOT, 'scripts/menu-2026/menu-2026.json');
const SITE = process.env.SITE_URL ?? 'https://umai-ramen.fr';
const TYPES = ['menuItem', 'menuCategory', 'menuExtra', 'menuFormule'];
const HIDEABLE = ['menuItem', 'menuExtra', 'menuFormule'];
const API_VERSION = '2025-01-01';
const LIVE_MARKER = 'Prix service compris'; // page note only the Phase 12 (plan 01) code renders
const SHOW_MUTATIONS = 15;
const SYSTEM_FIELDS = new Set(['_id', '_type', '_rev', '_createdAt', '_updatedAt']);

// ── arguments ────────────────────────────────────────────────────────────────
const USAGE = `Usage:
  node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --dry-run [--full] [--dump <file>]   (default)
  node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --backup-only
  node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --apply [--skip-live-guard]
  node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback [--backup <file>] [--dry-run]`;
const FLAGS = new Set(['--dry-run', '--backup-only', '--apply', '--rollback', '--skip-live-guard', '--full']);

function parseArgs(argv) {
  const flags = new Set();
  let backup;
  let dump;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--backup' || a === '--dump') {
      const value = argv[i + 1];
      i += 1;
      if (!value || value.startsWith('--')) usageError(`${a} needs a file`);
      if (a === '--backup') backup = value;
      else dump = value;
    } else if (FLAGS.has(a)) flags.add(a);
    else usageError(`unknown argument ${a}`);
  }
  const modes = ['--backup-only', '--apply', '--rollback'].filter((f) => flags.has(f));
  if (modes.length > 1) usageError(`choose one mode (got ${modes.join(' ')})`);
  if (flags.has('--dry-run') && (flags.has('--apply') || flags.has('--backup-only'))) {
    usageError('--dry-run goes alone or with --rollback');
  }
  if (backup && !flags.has('--rollback')) usageError('--backup only goes with --rollback');
  if (dump && modes.length) usageError('--dump only goes with --dry-run');
  if (flags.has('--skip-live-guard') && !flags.has('--apply')) usageError('--skip-live-guard only goes with --apply');
  const mode = flags.has('--apply') ? 'apply' : flags.has('--rollback') ? 'rollback' : flags.has('--backup-only') ? 'backup-only' : 'dry-run';
  return { mode, dry: mode === 'dry-run' || flags.has('--dry-run'), backup, dump, full: flags.has('--full'), skipGuard: flags.has('--skip-live-guard') };
}
function usageError(msg) {
  console.error(`ERROR ${msg}\n${USAGE}`);
  process.exit(2);
}

const opts = parseArgs(process.argv.slice(2));
const env = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
};
const missingEnv = Object.entries({
  NEXT_PUBLIC_SANITY_PROJECT_ID: env.projectId,
  NEXT_PUBLIC_SANITY_DATASET: env.dataset,
  SANITY_TOKEN: env.token,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missingEnv.length) {
  console.error(`ERROR missing env: ${missingEnv.join(', ')} (run with node --env-file=.env.local ...)`);
  process.exit(2);
}

const clientConfig = { projectId: env.projectId, dataset: env.dataset, apiVersion: API_VERSION, token: env.token, useCdn: false };
const client = createClient({ ...clientConfig, perspective: 'raw' });
const publishedClient = createClient({ ...clientConfig, perspective: 'published' });

// ── helpers ──────────────────────────────────────────────────────────────────
const rel = (p) => relative(ROOT, p);
const baseId = (id) => id.replace(/^drafts\./, '');
const isDraft = (d) => d._id.startsWith('drafts.');
const isM26 = (d) => baseId(d._id).startsWith('m26-');
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;
const canon = (v) => JSON.stringify(sortKeys(v));
const eur = (n) => `${n.toFixed(2).replace('.', ',')} €`;
const ws = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const trunc = (s, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const cell = (s) => ws(s).replace(/\|/g, '\\|');
const stamp = (d = new Date()) => d.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15); // YYYYMMDD-HHmmss (UTC)
const itemsOf = (json) => json.categories.flatMap((c) => c.items.map((item, index) => ({ cat: c, item, index })));

/** Locale object: every non-empty locale of the JSON + _type. */
function loc(obj, type) {
  if (!obj) return undefined;
  const out = { _type: type };
  for (const l of LOCALES) if (typeof obj[l] === 'string' && obj[l].trim() !== '') out[l] = obj[l];
  return out;
}

function fmtVariant(v) {
  const p = eur(v.price);
  if (v.label?.fr) return `${v.label.fr} ${p}`;
  if (v.unit === 'pcs') return `${v.quantity} pcs ${p}`;
  if (v.unit === 'scoop') return `${v.quantity} boule${v.quantity > 1 ? 's' : ''} ${p}`;
  return `${v.quantity}${v.unit} ${p}`;
}
const fmtNewPrice = (item) => (item.priceOnRequest ? 'Prix sur demande' : item.prices ? item.prices.map(fmtVariant).join(' · ') : eur(item.price));
const basePrice = (item) => (item.priceOnRequest ? undefined : item.price ?? Math.min(...item.prices.map((v) => v.price)));
function fmtDiff(oldP, newP) {
  if (typeof oldP !== 'number' || typeof newP !== 'number') return newP === undefined ? 'sur demande' : '';
  const d = Math.round((newP - oldP) * 100) / 100;
  return d === 0 ? '=' : `${d > 0 ? '+' : '-'}${eur(Math.abs(d))}`;
}

/** Flush stdout/stderr, then exit (safe when piped). */
function exit(code) {
  process.stdout.write('', () => process.stderr.write('', () => process.exit(code)));
}

// ── Sanity reads ─────────────────────────────────────────────────────────────
async function fetchCurrent() {
  const docs = await client.fetch('*[_type in $types]', { types: TYPES });
  return docs.filter((d) => !d._id.startsWith('versions.'));
}

// ── plan ─────────────────────────────────────────────────────────────────────
function buildPlan(json, current, mode) {
  const legacy = current.filter((d) => !isM26(d));
  const publishedById = new Map(current.filter((d) => !isDraft(d)).map((d) => [d._id, d]));
  const warnings = [];

  const slugSuffixes = [];
  const slugOwner = (type, slug) => legacy.find((d) => d._type === type && d.slug?.current === slug);
  const slugFor = (type, key, label) => {
    const owner = slugOwner(type, key);
    if (!owner) return key;
    const suffixed = `${key}-2026`;
    const owner2 = slugOwner(type, suffixed);
    if (owner2) throw new Error(`slug "${suffixed}" (${type}) is also taken by legacy ${owner2._id}`);
    slugSuffixes.push({ type, key, slug: suffixed, label, ownerId: owner._id });
    return suffixed;
  };

  const categoryDocs = json.categories.map((cat, ci) =>
    clean({
      _id: `m26-cat-${cat.key}`,
      _type: 'menuCategory',
      name: loc(cat.name, 'localeString'),
      slug: { _type: 'slug', current: slugFor('menuCategory', cat.key, cat.name.fr) },
      order: (ci + 1) * 10,
      section: cat.section,
      nameJp: cat.nameJp,
      description: loc(cat.description, 'localeText'),
      footnote: loc(cat.footnote, 'localeText'),
    }),
  );

  const images = [];
  let imagesFromLegacy = 0;
  let imagesKept = 0;
  const itemDocs = itemsOf(json).map(({ cat, item, index }) => {
    const id = `m26-item-${item.key}`;
    let image;
    const existing = publishedById.get(id);
    if (existing?.image) {
      // (1) Studio-owned: never overwrite an image already on the m26 doc
      image = structuredClone(existing.image);
      imagesKept += 1;
      const source = item.imageFrom ? publishedById.get(item.imageFrom) : undefined;
      images.push({ itemKey: item.key, itemName: item.name.fr, legacyId: item.imageFrom, legacyName: source?.name?.fr, assetRef: image.asset?._ref, status: 'kept' });
    } else if (item.imageFrom) {
      // (2) copy the legacy photo (asset reference + hotspot/crop); the legacy doc keeps its image
      const source = publishedById.get(item.imageFrom);
      if (source && !isM26(source) && source.image?.asset?._ref) {
        image = structuredClone(source.image);
        imagesFromLegacy += 1;
        images.push({ itemKey: item.key, itemName: item.name.fr, legacyId: item.imageFrom, legacyName: source.name?.fr, assetRef: source.image.asset._ref, status: 'copied' });
      } else {
        const w = `WARN imageFrom ${item.imageFrom} has no image (item ${item.key})`;
        console.log(w);
        warnings.push(w);
        images.push({ itemKey: item.key, itemName: item.name.fr, legacyId: item.imageFrom, legacyName: source?.name?.fr, status: 'skipped' });
      }
    }
    return clean({
      _id: id,
      _type: 'menuItem',
      name: loc(item.name, 'localeString'),
      slug: { _type: 'slug', current: slugFor('menuItem', item.key, item.name.fr) },
      category: { _type: 'reference', _ref: `m26-cat-${cat.key}` },
      order: (index + 1) * 10,
      available: true,
      isVegetarian: !!item.isVegetarian,
      isGlutenFree: !!item.isGlutenFree,
      nameJp: item.nameJp,
      description: loc(item.description, 'localeText'),
      subgroup: loc(item.subgroup, 'localeString'),
      price: basePrice(item),
      prices: item.prices?.map((v, vi) =>
        clean({
          _type: 'priceVariant',
          _key: `v${vi}`,
          quantity: v.quantity,
          unit: v.unit,
          label: loc(v.label, 'localeString'),
          price: v.price,
        }),
      ),
      priceOnRequest: item.priceOnRequest === true ? true : undefined,
      badges: item.badges ? [...item.badges] : undefined,
      image,
    });
  });

  // drift: Studio edits on existing published m26 docs that this run would overwrite
  const drift = [];
  for (const doc of [...categoryDocs, ...itemDocs]) {
    const existing = publishedById.get(doc._id);
    if (!existing) continue;
    const keys = new Set([...Object.keys(doc), ...Object.keys(existing)]);
    const fields = [...keys].filter((k) => !SYSTEM_FIELDS.has(k) && k !== 'image' && canon(doc[k]) !== canon(existing[k]));
    if (fields.length) drift.push({ id: doc._id, fields });
  }
  for (const d of current.filter((x) => isDraft(x) && isM26(x))) {
    warnings.push(`WARN ${d._id} is an open Studio draft: the sync updates the published document only`);
  }

  const jsonItemIds = new Set(itemDocs.map((d) => d._id));
  const hideLegacy = legacy.filter((d) => HIDEABLE.includes(d._type) && d.available !== false);
  const hideOrphans = current.filter((d) => d._type === 'menuItem' && isM26(d) && !isDraft(d) && !jsonItemIds.has(d._id) && d.available !== false);

  // NEVER a delete in this plan: createOrReplace + patch only
  const mutations = [
    ...categoryDocs.map((doc) => ({ kind: 'createOrReplace', id: doc._id, doc })),
    ...itemDocs.map((doc) => ({ kind: 'createOrReplace', id: doc._id, doc })),
    ...hideLegacy.map((d) => ({ kind: 'patch', id: d._id, set: { available: false }, note: 'legacy' })),
    ...hideOrphans.map((d) => ({ kind: 'patch', id: d._id, set: { available: false }, note: 'orphan m26' })),
  ];

  const counts = {
    categories: categoryDocs.length,
    items: itemDocs.length,
    hideLegacy: hideLegacy.length,
    hideOrphanM26: hideOrphans.length,
    slugSuffixed: slugSuffixes.length,
    drafts: current.filter(isDraft).length,
    imagesFromLegacy,
    imagesKept,
  };
  const summary = `SYNC SUMMARY mode=${mode} ${Object.entries(counts)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')}`;
  return { categoryDocs, itemDocs, mutations, hideLegacy, hideOrphans, slugSuffixes, images, drift, warnings, counts, summary };
}

function describe(m) {
  if (m.kind === 'createOrReplace') {
    const d = m.doc;
    if (d._type === 'menuCategory') {
      return `createOrReplace ${d._id} menuCategory slug=${d.slug.current} order=${d.order} section=${d.section} name=${JSON.stringify(d.name.fr)}`;
    }
    const price = d.priceOnRequest ? 'onRequest' : d.prices ? d.prices.map((v) => `${v.label?.fr ?? `${v.quantity}${v.unit}`}:${v.price}`).join(',') : d.price;
    return `createOrReplace ${d._id} menuItem cat=${d.category._ref} order=${d.order} slug=${d.slug.current} price=${price}${d.image ? ` image=${d.image.asset?._ref}` : ''} name=${JSON.stringify(d.name.fr)}`;
  }
  if (m.kind === 'patch') return `patch ${m.id} ${m.set ? `set ${JSON.stringify(m.set)}` : `unset ${JSON.stringify(m.unset)}`}${m.note ? ` (${m.note})` : ''}`;
  return `delete ${m.id}`;
}

function printPlan(plan, full) {
  const n = { createOrReplace: 0, patch: 0, delete: 0 };
  for (const m of plan.mutations) n[m.kind] += 1;
  console.log(`PLAN mutations=${plan.mutations.length} createOrReplace=${n.createOrReplace} (categories ${plan.categoryDocs.length}, items ${plan.itemDocs.length}) patch=${n.patch} delete=${n.delete}`);
  const shown = full ? plan.mutations : plan.mutations.slice(0, SHOW_MUTATIONS);
  for (const m of shown) console.log(`  ${describe(m)}`);
  if (shown.length < plan.mutations.length) console.log(`  ... ${plan.mutations.length - shown.length} more (--full prints them all)`);
  for (const s of plan.slugSuffixes) console.log(`SLUG ${s.type} ${s.key} -> ${s.slug} (taken by legacy ${s.ownerId})`);
  for (const d of plan.drift) console.log(`DRIFT ${d.id}: ${d.fields.join(', ')}`);
  for (const w of plan.warnings) if (!w.startsWith('WARN imageFrom')) console.log(w);
  console.log(plan.summary);
}

// ── live guard ───────────────────────────────────────────────────────────────
async function liveGuard() {
  const url = `${SITE}/fr/menu`;
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache', 'user-agent': 'umai-sync-menu' }, signal: AbortSignal.timeout(20_000) });
    const html = (await res.text()).replace(/<!--[\s\S]*?-->/g, '');
    const ok = res.ok && html.includes(LIVE_MARKER);
    return { ok, line: ok ? 'LIVE GUARD: ok' : 'LIVE GUARD: blocked (Phase 12 code not deployed yet)', detail: `${url} HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, line: `LIVE GUARD: blocked (cannot fetch ${url}: ${e.message})`, detail: e.message };
  }
}

// ── backups ──────────────────────────────────────────────────────────────────
function writeBackup(current, suffix = '') {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const counts = Object.fromEntries(TYPES.map((t) => [t, current.filter((d) => d._type === t).length]));
  let file = join(BACKUP_DIR, `menu-backup-${stamp()}${suffix}.json`);
  for (let attempt = 0; existsSync(file); attempt += 1) {
    // never overwrite a backup: two backups in the same second → wait for the next second
    if (attempt === 3) throw new Error(`backup ${rel(file)} already exists: nothing written to Sanity`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1100);
    file = join(BACKUP_DIR, `menu-backup-${stamp()}${suffix}.json`);
  }
  const payload = { exportedAt: new Date().toISOString(), projectId: env.projectId, dataset: env.dataset, perspective: 'raw', counts, documents: current };
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' });
  const back = JSON.parse(readFileSync(file, 'utf8'));
  if (!(current.length > 0 && Array.isArray(back.documents) && back.documents.length === current.length)) {
    throw new Error(`backup ${rel(file)} failed verification (documents=${back.documents?.length}, expected ${current.length} > 0): nothing written to Sanity`);
  }
  return file;
}

/** Every backup, most recent first (by exportedAt, then file name). */
function listBackups() {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR)
    .filter((f) => /^menu-backup-.+\.json$/.test(f))
    .map((f) => {
      const file = join(BACKUP_DIR, f);
      const data = JSON.parse(readFileSync(file, 'utf8'));
      return { file, exportedAt: String(data.exportedAt ?? ''), documents: Array.isArray(data.documents) ? data.documents : [] };
    })
    .sort((a, b) => b.exportedAt.localeCompare(a.exportedAt) || b.file.localeCompare(a.file));
}

/** Most recent backup whose documents contain no m26- id (the pre-sync snapshot). */
function latestPreSyncBackup() {
  return listBackups().find((b) => b.documents.length > 0 && !b.documents.some(isM26))?.file;
}

function resolveBackup(arg) {
  if (!arg) {
    const file = latestPreSyncBackup();
    if (!file) throw new Error(`no pre-sync backup (menu-backup-*.json without m26- documents) in ${rel(BACKUP_DIR)}`);
    return file;
  }
  const file = [resolve(arg), join(BACKUP_DIR, arg)].find((p) => existsSync(p));
  if (!file) throw new Error(`backup not found: ${arg}`);
  return file;
}

// ── post-apply checks (published perspective) ────────────────────────────────
async function postApplyChecks(json, backupDocs) {
  const q = (query, params = {}) => publishedClient.fetch(query, params);
  const items = itemsOf(json).map((x) => x.item);
  const legacyBefore = backupDocs.filter((d) => HIDEABLE.includes(d._type) && !isM26(d) && !isDraft(d)).length;
  const imageIds = items.filter((i) => i.imageFrom).map((i) => `m26-item-${i.key}`);
  const checks = [
    ['m26 categories', await q('count(*[_type=="menuCategory" && string::startsWith(_id,"m26-")])'), json.categories.length],
    ['visible m26 items', await q('count(*[_type=="menuItem" && string::startsWith(_id,"m26-") && available==true])'), items.length],
    ['visible legacy items/extras', await q('count(*[_type in ["menuItem","menuExtra"] && !string::startsWith(_id,"m26-") && available==true])'), 0],
    ['visible formules', await q('count(*[_type=="menuFormule" && available!=false])'), 0],
    ['legacy documents (nothing deleted)', await q('count(*[_type in ["menuItem","menuExtra","menuFormule"] && !string::startsWith(_id,"m26-")])'), legacyBefore],
    ['m26 items with the home-card photo', await q('count(*[_id in $ids && defined(image.asset._ref)])', { ids: imageIds }), imageIds.length],
  ];
  return checks.filter(([, got, want]) => got !== want).map(([name, got, want]) => `POST-APPLY CHECK FAILED ${name}: ${got}, expected ${want}`);
}

// ── report (FR) ──────────────────────────────────────────────────────────────
function renderReport({ status, json, current, plan, guard, backupFile, readAt, postApplyFailures = [] }) {
  const published = current.filter((d) => !isDraft(d));
  const pubById = new Map(published.map((d) => [d._id, d]));
  const items = itemsOf(json);
  const replacedBy = new Map();
  for (const { item } of items) for (const id of item.legacyIds ?? []) replacedBy.set(id, `m26-item-${item.key}`);
  const dateOf = (p) => p.match(/(\d{4}-\d{2}-\d{2})\.pdf$/)?.[1] ?? '?';
  const L = [];
  const table = (head, rows) => {
    L.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`);
    for (const r of rows) L.push(`| ${r.map(cell).join(' | ')} |`);
  };

  L.push("# Phase 12 : rapport d'écarts imprimé 2026 / Sanity", '');
  L.push(`Statut : ${status}`, '');
  L.push(
    `Sources : imprimé plats du ${dateOf(json.sources.food)} (\`${json.sources.food}\`) et boissons du ${dateOf(json.sources.drinks)} (\`${json.sources.drinks}\`), transcrits dans \`scripts/menu-2026/menu-2026.json\` le ${json.transcribedAt} ; Sanity \`${env.projectId}/${env.dataset}\` lu le ${readAt}.`,
    '',
  );
  L.push(
    "Note : selon l'accord d'autonomie d'EK du 2026-11-23, ce rapport est appliqué sans blocage (plan 12-03) puis remis à EK pour une revue a posteriori (MENU-04).",
    '',
  );

  // Résumé
  const food = json.categories.filter((c) => c.section === 'food');
  const drinks = json.categories.filter((c) => c.section === 'drinks');
  const nItems = (cats) => cats.reduce((n, c) => n + c.items.length, 0);
  const typeLine = (t) => {
    const docs = published.filter((d) => d._type === t && !isM26(d));
    const visible = t === 'menuCategory' ? '' : ` (${docs.filter((d) => d.available !== false).length} visibles)`;
    return `${docs.length} ${t}${visible}`;
  };
  L.push('## Résumé', '');
  L.push(`- Imprimé 2026 : **${json.categories.length} catégories, ${nItems(json.categories)} articles** (plats : ${food.length} catégories / ${nItems(food)} articles ; boissons : ${drinks.length} catégories / ${nItems(drinks)} articles).`);
  L.push(
    `- Sanity avant : ${TYPES.map(typeLine).join(', ')} ; ${current.filter(isDraft).length} brouillon(s) ; ${current.filter(isM26).length} document(s) m26.`,
  );
  L.push(
    `- Sanity après : ${plan.counts.categories} catégories et ${plan.counts.items} articles \`m26-*\` visibles ; ${plan.counts.hideLegacy} anciens documents masqués (\`available=false\`), aucun supprimé ; les anciennes catégories restent, vides, donc invisibles sur le site.`,
  );
  L.push(
    `- Écritures (une transaction) : ${plan.counts.categories + plan.counts.items} \`createOrReplace\` (${plan.counts.categories} catégories + ${plan.counts.items} articles), ${plan.counts.hideLegacy + plan.counts.hideOrphanM26} patchs \`available=false\` (dont ${plan.counts.hideOrphanM26} orphelin(s) m26), 0 suppression ; ${plan.counts.slugSuffixed} slugs suffixés « -2026 » ; ${plan.counts.imagesFromLegacy} photo(s) reprise(s), ${plan.counts.imagesKept} conservée(s).`,
  );
  if (guard) L.push(`- Garde « code Phase 12 en ligne » (${SITE}/fr/menu) : \`${guard.line}\`.`);
  L.push(`- Ligne de contrôle : \`${plan.summary}\``);
  if (postApplyFailures.length) L.push(`- Contrôles après écriture : **ÉCHEC** (${postApplyFailures.length}) : ${postApplyFailures.join(' ; ')}`);
  L.push('');

  // Ajoutés
  const added = items.filter(({ item }) => !item.legacyIds?.length);
  L.push("## Ajoutés (nouveaux sur l'imprimé)", '');
  L.push(`${added.length} articles sans équivalent dans l'ancien menu Sanity :`, '');
  table(
    ['Catégorie', 'Article', 'Prix'],
    added.map(({ cat, item }) => [cat.name.fr, item.name.fr, fmtNewPrice(item)]),
  );
  L.push(
    '',
    `Les ${json.categories.length} catégories sont de nouveaux documents \`m26-cat-*\` (structure de l'imprimé) : les anciennes catégories ne sont pas réutilisées (leurs textes EN/DE datent d'eazee-link).`,
    '',
  );

  // Prix modifiés
  const priceRows = [];
  const textRows = [];
  for (const { item } of items) {
    for (const id of item.legacyIds ?? []) {
      const old = pubById.get(id);
      if (!old) {
        priceRows.push([item.name.fr, `${id} (introuvable)`, '', fmtNewPrice(item), '']);
        continue;
      }
      const oldLabel = `${ws(old.name?.fr)} (\`${id}\`)`;
      priceRows.push([item.name.fr, oldLabel, typeof old.price === 'number' ? eur(old.price) : '', fmtNewPrice(item), fmtDiff(old.price, basePrice(item))]);
      const pairs = [
        ['nom', ws(old.name?.fr), ws(item.name.fr)],
        ['description', ws(old.description?.fr), ws(item.description?.fr)],
      ];
      for (const [field, before, after] of pairs) {
        if (before !== after) textRows.push([item.name.fr, `\`${id}\``, field, trunc(before) || '(vide)', trunc(after) || '(vide)']);
      }
    }
  }
  L.push('## Prix modifiés', '');
  L.push(
    "Pour chaque ancien document repris : ancien prix → nouveau prix de l'imprimé. Écart calculé sur le prix de base (prix unique, ou plus petit prix des variantes) ; « = » : prix inchangé.",
    '',
  );
  table(['Nouvel article', 'Ancien document', 'Ancien prix', 'Nouveau prix', 'Écart'], priceRows);
  L.push('');

  // Textes modifiés
  L.push('## Textes modifiés', '');
  L.push("Nom et description de l'ancien document → texte de l'imprimé (espaces normalisés, 140 caractères au plus). Seules les différences sont listées.", '');
  table(['Nouvel article', 'Ancien document', 'Champ', 'Avant', 'Après'], textRows);
  L.push('');

  // Masqués
  L.push("## Masqués (plus sur l'imprimé)", '');
  L.push(
    `${plan.hideLegacy.length + plan.hideOrphans.length} documents passent en \`available=false\` : jamais supprimés, le retour arrière les réaffiche. « remplacé par » = repris par un article de l'imprimé ; « retiré » = absent de l'imprimé.`,
    '',
  );
  const catById = new Map(published.filter((d) => d._type === 'menuCategory').map((d) => [d._id, d]));
  const groups = new Map();
  const groupKey = (d) => (d._type === 'menuExtra' ? 'extra' : d._type === 'menuFormule' ? 'formule' : `cat:${d.category?._ref ?? '?'}`);
  for (const d of plan.hideLegacy) {
    const k = groupKey(d);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(d);
  }
  const groupTitle = (k) => {
    if (k === 'extra') return 'Suppléments (menuExtra)';
    if (k === 'formule') return 'Formules (menuFormule)';
    const c = catById.get(k.slice(4));
    return c ? `${c.name?.fr} (\`${c._id}\`)` : `Sans catégorie (\`${k.slice(4)}\`)`;
  };
  const groupOrder = (k) => (k === 'extra' ? 1e6 : k === 'formule' ? 1e6 + 1 : catById.get(k.slice(4))?.order ?? 1e5);
  for (const k of [...groups.keys()].sort((a, b) => groupOrder(a) - groupOrder(b))) {
    L.push(`### ${groupTitle(k)}`, '');
    table(
      ['Ancien article', 'Id', 'Prix', 'Statut'],
      groups
        .get(k)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((d) => {
          const target = replacedBy.get(baseId(d._id));
          return [ws(d.name?.fr), `\`${d._id}\``, typeof d.price === 'number' ? eur(d.price) : '', target ? `remplacé par \`${target}\`` : 'retiré'];
        }),
    );
    L.push('');
  }
  if (plan.hideOrphans.length) {
    L.push('### Anciens articles m26 (retirés du JSON)', '');
    table(['Article', 'Id', 'Statut'], plan.hideOrphans.map((d) => [ws(d.name?.fr), `\`${d._id}\``, 'retiré']));
    L.push('');
  }

  // Photos reprises
  L.push('## Photos reprises (cartes « Notre Menu » de l\'accueil)', '');
  L.push(
    "La photo (référence d'asset, avec hotspot/crop s'il y en a) est copiée de l'ancien document, qui garde la sienne. Une photo déjà présente sur un article m26 n'est jamais écrasée. Les autres nouveaux articles n'ont pas de photo.",
    '',
  );
  const statusFr = { copied: 'copiée', kept: 'conservée (déjà présente)', skipped: "ignorée (pas d'image)" };
  table(
    ['Nouvel article', 'Source', 'Asset', 'Statut'],
    plan.images.map((im) => [
      `${im.itemName} (\`m26-item-${im.itemKey}\`)`,
      im.legacyId ? `← « ${ws(im.legacyName) || '?'} » (\`${im.legacyId}\`)` : 'Studio',
      im.assetRef ? `\`${im.assetRef}\`` : '',
      statusFr[im.status],
    ]),
  );
  L.push('');

  // Corrections
  L.push('## Corrections imprimé → web', '');
  table(['Où', 'Imprimé', 'Web', 'Raison'], json.corrections.map((c) => [c.where, c.print, c.web, c.reason]));
  L.push('');

  // À confirmer
  L.push('## À confirmer par EK (revue a posteriori)', '');
  json.ekToConfirm.forEach((s, i) => L.push(`${i + 1}. ${s}`));
  for (const s of plan.slugSuffixes) {
    L.push(`- Slug suffixé : ${s.type === 'menuCategory' ? 'catégorie' : 'article'} « ${s.label} » → \`${s.slug}\` (\`${s.key}\` est pris par \`${s.ownerId}\`).`);
  }
  for (const d of plan.drift) L.push(`- DRIFT \`${d.id}\` : ${d.fields.join(', ')} (modifié dans Studio ; écrasé par la synchronisation).`);
  for (const w of plan.warnings) L.push(`- ${w}`);
  L.push('');

  // Retour arrière
  const rbFile = backupFile ? rel(backupFile) : '<sauvegarde écrite par --apply>';
  L.push('## Retour arrière (rollback)', '');
  L.push('Commande exacte :', '', '```', `node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback --backup ${rbFile}`, '```', '');
  L.push(
    `Ce qu'elle fait : écrit d'abord une sauvegarde de sécurité (\`-pre-rollback\`), remet pour chaque ancien document (menuItem, menuExtra, menuFormule) la valeur \`available\` de la sauvegarde (ou retire le champ s'il n'existait pas), puis supprime tous les documents \`m26-*\` (articles puis catégories), en une transaction. Ajouter \`--dry-run\` pour voir le plan (\`ROLLBACK PLAN ... restore=<n> delete=<n>\`) sans rien écrire.`,
  );
  if (!backupFile) L.push('', "Aucune sauvegarde avant synchronisation n'existe encore : `--apply` en écrit une avant toute écriture.");
  L.push('');
  return L.join('\n');
}

// ── modes ────────────────────────────────────────────────────────────────────
async function runDryRun(json) {
  const guard = await liveGuard();
  console.log(guard.line);
  const current = await fetchCurrent();
  const plan = buildPlan(json, current, 'dry-run');
  printPlan(plan, opts.full);
  if (opts.dump) {
    writeFileSync(resolve(opts.dump), `${JSON.stringify({ summary: plan.summary, mutations: plan.mutations }, null, 2)}\n`);
    console.log(`DUMP ${resolve(opts.dump)} mutations=${plan.mutations.length}`);
  }
  writeFileSync(
    REPORT,
    renderReport({ status: 'SIMULATION (dry-run), aucune écriture dans Sanity', json, current, plan, guard, backupFile: latestPreSyncBackup(), readAt: new Date().toISOString() }),
  );
  console.log(`REPORT ${rel(REPORT)}`);
  return 0;
}

async function runBackupOnly() {
  const current = await fetchCurrent();
  const file = writeBackup(current);
  console.log(`BACKUP ${rel(file)} documents=${current.length}`);
  return 0;
}

async function runApply(json) {
  const guard = await liveGuard();
  console.log(guard.line);
  if (!guard.ok) {
    if (!opts.skipGuard) {
      console.error('ABORT: the live site does not run the Phase 12 code yet (deploy plan 12-01 first, or pass --skip-live-guard). Nothing written.');
      return 3;
    }
    console.log('LIVE GUARD skipped (--skip-live-guard)');
  }
  const readAt = new Date().toISOString();
  const current = await fetchCurrent();
  const backupFile = writeBackup(current);
  console.log(`BACKUP ${rel(backupFile)} documents=${current.length}`);
  const plan = buildPlan(json, current, 'apply');
  printPlan(plan, opts.full);

  const tx = client.transaction();
  for (const m of plan.mutations) {
    if (m.kind === 'createOrReplace') tx.createOrReplace(m.doc);
    else if (m.kind === 'patch' && m.set) tx.patch(m.id, (p) => p.set(m.set));
    else throw new Error(`refusing mutation in --apply: ${describe(m)}`); // the apply path never deletes
  }
  const res = await tx.commit({ visibility: 'sync' });
  console.log(`APPLIED transactionId=${res.transactionId}`);

  const failures = await postApplyChecks(json, current);
  for (const f of failures) console.error(f);
  if (!failures.length) console.log('POST-APPLY CHECK OK');
  writeFileSync(
    REPORT,
    renderReport({
      status: `APPLIQUÉ le ${new Date().toISOString()} (transaction ${res.transactionId}, sauvegarde ${rel(backupFile)})`,
      json,
      current,
      plan,
      guard,
      backupFile,
      readAt,
      postApplyFailures: failures,
    }),
  );
  console.log(`REPORT ${rel(REPORT)}`);
  return failures.length ? 1 : 0;
}

async function runRollback() {
  const backupFile = resolveBackup(opts.backup);
  const backup = JSON.parse(readFileSync(backupFile, 'utf8'));
  if (!Array.isArray(backup.documents) || backup.documents.length === 0) throw new Error(`${rel(backupFile)} has no documents`);
  if (backup.projectId !== env.projectId || backup.dataset !== env.dataset) {
    throw new Error(`${rel(backupFile)} is a backup of ${backup.projectId}/${backup.dataset}, not ${env.projectId}/${env.dataset}`);
  }
  const current = await fetchCurrent();
  const currentById = new Map(current.map((d) => [d._id, d]));
  const restore = [];
  for (const b of backup.documents) {
    if (!HIDEABLE.includes(b._type) || isM26(b)) continue;
    const cur = currentById.get(b._id);
    if (!cur) continue;
    if (has(b, 'available')) {
      if (cur.available !== b.available) restore.push({ kind: 'patch', id: b._id, set: { available: b.available } });
    } else if (has(cur, 'available')) {
      restore.push({ kind: 'patch', id: b._id, unset: ['available'] });
    }
  }
  const rank = (d) => (d._type === 'menuItem' ? 0 : d._type === 'menuCategory' ? 2 : 1); // items first, then categories
  const toDelete = current
    .filter(isM26)
    .sort((a, b) => rank(a) - rank(b) || a._id.localeCompare(b._id))
    .map((d) => d._id);

  console.log(`ROLLBACK PLAN backup=${rel(backupFile)} restore=${restore.length} delete=${toDelete.length}`);
  for (const m of [...restore.slice(0, SHOW_MUTATIONS)]) console.log(`  ${describe(m)}`);
  if (restore.length > SHOW_MUTATIONS) console.log(`  ... ${restore.length - SHOW_MUTATIONS} more restores`);
  if (toDelete.length) console.log(`  delete ${toDelete.length} m26 documents: ${toDelete.slice(0, 5).join(', ')}${toDelete.length > 5 ? ', ...' : ''}`);

  const publishedIds = [...new Set(toDelete.map(baseId))];
  const external = publishedIds.length
    ? await client.fetch('*[references($ids) && !(_id in $all)]{_id, _type}', { ids: publishedIds, all: toDelete })
    : [];
  for (const d of external) console.log(`WARN ${d._id} (${d._type}) references m26 documents: remove that reference first`);
  if (opts.dry) return 0;
  if (external.length) {
    console.error('ABORT: m26 documents are still referenced by other documents (see WARN). Nothing written.');
    return 1;
  }
  if (!restore.length && !toDelete.length) {
    console.log('ROLLBACK OK (nothing to do)');
    return 0;
  }

  // safety backup of the current state, written before any Sanity write
  console.log(`SAFETY BACKUP ${rel(writeBackup(current, '-pre-rollback'))} documents=${current.length}`);
  const tx = client.transaction();
  for (const m of restore) tx.patch(m.id, (p) => (m.set ? p.set(m.set) : p.unset(m.unset)));
  for (const id of toDelete) tx.delete(id); // rollback only: the m26 documents created by --apply
  const res = await tx.commit({ visibility: 'sync' });
  console.log(`ROLLBACK OK transactionId=${res.transactionId}`);
  return 0;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Target: ${env.projectId}/${env.dataset}`);
  let json;
  let errors;
  try {
    json = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
    errors = validateMenu(json);
  } catch (e) {
    errors = [`cannot read ${rel(JSON_PATH)}: ${e.message}`];
  }
  if (errors.length) {
    if (opts.mode !== 'rollback') {
      for (const e of errors) console.error(`ERROR ${e}`);
      console.error(`MENU JSON INVALID errors=${errors.length}: nothing read from or written to Sanity`);
      return 1;
    }
    console.log(`WARN menu JSON invalid (${errors.length} errors): ignored by --rollback, which only uses the backup`);
  } else {
    console.log(`MENU JSON OK categories=${json.categories.length} items=${itemsOf(json).length}`);
  }
  if (opts.mode === 'backup-only') return runBackupOnly();
  if (opts.mode === 'rollback') return runRollback();
  if (opts.mode === 'apply') return runApply(json);
  return runDryRun(json);
}

main().then(
  (code) => exit(code ?? 0),
  (e) => {
    console.error(`ERROR ${e?.message ?? e}`);
    exit(1);
  },
);
