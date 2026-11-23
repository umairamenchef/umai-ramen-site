#!/usr/bin/env node
/**
 * UMAÏ Ramen: publish the EN / DE / IT / ZH translations of the 2026 menu to Sanity (Phase 14), field by field.
 *
 * Usage:
 *   node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --dry-run [--json <file>] [--overwrite-existing] [--include-drafts] [--full]   (default mode)
 *   node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --apply [--overwrite-existing] [--include-drafts]
 *   node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --rollback --backup <file> [--dry-run] [--full]
 *
 * What it does (14-CONTEXT « Source & write path »):
 *   - validates the menu JSON (menu-schema.mjs validateMenu + translation-rules.mjs validateTranslations) BEFORE any
 *     env check or network call; menu-2026.json or `--json <file>` (dry-run only, e.g. the merged preview);
 *   - reads the m26-* documents (raw perspective: published + drafts) and plans ONE `set` patch per document, on
 *     locale keys only (name.en, description.zh, prices[_key=="v0"].label.it, ...), see translation-patches.mjs;
 *   - --apply: refuses (exit 1, nothing written) on a CONFLICT (another translation already there, e.g. edited in
 *     Studio; --overwrite-existing allows it), on FR DRIFT (the French changed in Studio), on an open DRAFT
 *     (--include-drafts patches it too) and on a MISSING DOC; otherwise writes a JSON backup of the m26 documents
 *     (read back before anything is written), then ONE transaction of patches, each guarded by ifRevisionId (a
 *     document edited meanwhile makes the whole transaction fail: nothing written), then re-reads the published
 *     dataset and checks it;
 *   - never a whole-document write and never a deletion: documents are only patched, key by key;
 *   - --rollback: puts the en/de/it/zh values of a backup back (set, or unset when the backup had none); French and
 *     every other field are never touched; a safety backup (-pre-rollback) is written first.
 *
 * Output lines (Plan 14-03 greps them): MENU JSON OK, TRANSLATIONS OK, Target:, TRANSLATION PLAN, SET, CONFLICT,
 * FR DRIFT, DRAFT, MISSING DOC, ABORT:, NOTHING TO DO, BACKUP, APPLIED, POST-APPLY CHECK OK|FAILED, ROLLBACK PLAN,
 * SAFETY BACKUP, ROLLBACK OK. Results go to stdout; usage / env errors and unexpected failures go to stderr.
 *
 * Backups: .planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-<YYYYMMDD-HHmmss UTC>[-pre-rollback].json
 * Env (.env.local): NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_TOKEN (never printed).
 * Exit codes: 0 ok · 1 error (invalid menu, conflict / drift / draft / missing document, failed check, Sanity error) ·
 *             2 usage / missing env.
 *
 * `main(argv, deps)` is exported so the tests can drive it on an in-memory fake Sanity (deps: env, makeClient, root,
 * menuPath, out, err); running the file directly calls it with the process arguments.
 */
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@sanity/client';
import { validateMenu } from './menu-schema.mjs';
import { TRANSLATION_LOCALES, translatableFields, validateTranslations } from './translation-rules.mjs';
import {
  patchTargets,
  planTranslationPatches,
  planTranslationRollback,
  readLocaleObject,
  stripTranslations,
} from './translation-patches.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const BACKUP_SUBDIR = '.planning/phases/14-traductions-en-de-it-zh/backup';
const API_VERSION = '2025-01-01';
const SHOW = 15; // SET / PATCH lines shown without --full
const MAX_ERROR_LINES = 80;
const MAX_CHECK_LINES = 40;
const M26_QUERY =
  '*[_type in ["menuCategory", "menuItem"] && (string::startsWith(_id, "m26-") || string::startsWith(_id, "drafts.m26-"))]';

const USAGE = `Usage:
  node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --dry-run [--json <file>] [--overwrite-existing] [--include-drafts] [--full]   (default mode)
  node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --apply [--overwrite-existing] [--include-drafts]
  node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --rollback --backup <file> [--dry-run] [--full]`;

class UsageError extends Error {}

// ── arguments ────────────────────────────────────────────────────────────────
const VALUE_FLAGS = { '--json': 'json', '--backup': 'backup' };
const BOOLEAN_FLAGS = new Set(['--dry-run', '--apply', '--rollback', '--overwrite-existing', '--include-drafts', '--full']);

/** -> { mode: 'dry-run' | 'apply' | 'rollback', dry, json, backup, overwrite, includeDrafts, full } | { help: true }; throws UsageError. */
export function parseArgs(argv) {
  const flags = new Set();
  const values = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') return { help: true };
    if (Object.hasOwn(VALUE_FLAGS, arg)) {
      const value = argv[i + 1];
      if (value === undefined || value === '' || value.startsWith('--')) throw new UsageError(`${arg} needs a file`);
      const name = VALUE_FLAGS[arg];
      if (values[name] !== undefined) throw new UsageError(`${arg} given twice`);
      values[name] = value;
      i += 1;
    } else if (BOOLEAN_FLAGS.has(arg)) {
      if (flags.has(arg)) throw new UsageError(`${arg} given twice`);
      flags.add(arg);
    } else {
      throw new UsageError(`unknown argument ${JSON.stringify(arg)}`);
    }
  }
  const apply = flags.has('--apply');
  const rollback = flags.has('--rollback');
  if (apply && rollback) throw new UsageError('choose one mode (--apply or --rollback)');
  if (apply && flags.has('--dry-run')) throw new UsageError('--dry-run goes alone or with --rollback');
  const mode = apply ? 'apply' : rollback ? 'rollback' : 'dry-run';
  if (values.json !== undefined && mode !== 'dry-run') throw new UsageError('--json only goes with --dry-run');
  if (values.backup !== undefined && mode !== 'rollback') throw new UsageError('--backup only goes with --rollback');
  if (mode === 'rollback' && values.backup === undefined) throw new UsageError('--rollback needs --backup <file>');
  if (mode === 'rollback' && (flags.has('--overwrite-existing') || flags.has('--include-drafts'))) {
    throw new UsageError('--overwrite-existing and --include-drafts do not apply to --rollback');
  }
  return {
    mode,
    dry: mode === 'dry-run' || flags.has('--dry-run'),
    json: values.json,
    backup: values.backup,
    overwrite: flags.has('--overwrite-existing'),
    includeDrafts: flags.has('--include-drafts'),
    full: flags.has('--full'),
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────
const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;
const canon = (v) => JSON.stringify(sortKeys(v));
const show = (v) => (v === undefined ? '(missing)' : JSON.stringify(v));
const stamp = (d = new Date()) => d.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15); // YYYYMMDD-HHmmss (UTC)
const byId = (a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0);
const isDraft = (d) => d._id.startsWith('drafts.');
const itemCount = (menu) => menu.categories.reduce((n, c) => n + (Array.isArray(c.items) ? c.items.length : 0), 0);

/** Flush stdout/stderr, then exit (safe when piped). */
function exit(code) {
  process.stdout.write('', () => process.stderr.write('', () => process.exit(code)));
}

/** The m26 documents, raw perspective (published + drafts), `versions.` ids dropped, sorted by _id. */
async function fetchM26(client) {
  const docs = await client.fetch(M26_QUERY);
  if (!Array.isArray(docs)) throw new Error('unexpected Sanity answer (not a list of documents)');
  return docs.filter((d) => !String(d._id).startsWith('versions.')).sort(byId);
}

/** Backup of the documents just read, written with the `wx` flag and read back before anything is written. */
function writeBackup(io, docs, suffix = '') {
  const dir = join(io.root, BACKUP_SUBDIR);
  mkdirSync(dir, { recursive: true });
  const published = docs.filter((d) => !isDraft(d));
  const counts = {
    menuCategory: published.filter((d) => d._type === 'menuCategory').length,
    menuItem: published.filter((d) => d._type === 'menuItem').length,
    drafts: docs.length - published.length,
  };
  const fileFor = () => join(dir, `translations-backup-${stamp()}${suffix}.json`);
  let file = fileFor();
  for (let attempt = 0; existsSync(file); attempt += 1) {
    // never overwrite a backup: two backups in the same second -> wait for the next second
    if (attempt === 3) throw new Error(`backup ${io.rel(file)} already exists: nothing written to Sanity`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1100);
    file = fileFor();
  }
  const payload = { exportedAt: new Date().toISOString(), projectId: io.env.projectId, dataset: io.env.dataset, perspective: 'raw', counts, documents: docs };
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' });
  const back = JSON.parse(readFileSync(file, 'utf8'));
  if (!(docs.length > 0 && Array.isArray(back.documents) && back.documents.length === docs.length)) {
    throw new Error(`backup ${io.rel(file)} failed verification (documents=${back.documents?.length}, expected ${docs.length} > 0): nothing written to Sanity`);
  }
  return file;
}

function resolveBackup(arg, io) {
  const file = [resolve(arg), join(io.root, BACKUP_SUBDIR, arg)].find((p) => existsSync(p));
  if (!file) throw new Error(`backup not found: ${arg}`);
  return file;
}

/** A failed commit: 409 / revision = a document changed since the read (atomic: nothing written); anything else = unknown outcome. */
function commitFailed(io, error) {
  const message = String(error?.message ?? error).replace(/\s+/g, ' ');
  if (error?.statusCode === 409 || /revision/i.test(message)) {
    io.out(`ABORT: a document changed during the run (${message}). Nothing written, rerun.`);
  } else {
    io.out(`ERROR the transaction failed (${message}). Sanity applies it all or not at all, but its outcome is unknown: run --dry-run to see what is left, then rerun.`);
  }
  return 1;
}

// ── menu JSON ────────────────────────────────────────────────────────────────
/** The validated menu, or null after printing why not (nothing read from or written to Sanity). */
function loadMenu(opts, io) {
  const path = opts.json !== undefined ? resolve(opts.json) : io.menuPath;
  let menu;
  let errors;
  try {
    menu = JSON.parse(readFileSync(path, 'utf8'));
    errors = [...validateMenu(menu), ...validateTranslations(menu)];
  } catch (e) {
    errors = [`cannot read ${io.rel(path)}: ${e.message}`];
  }
  if (errors.length) {
    for (const e of errors.slice(0, MAX_ERROR_LINES)) io.out(`ERROR ${e}`);
    if (errors.length > MAX_ERROR_LINES) io.out(`… ${errors.length - MAX_ERROR_LINES} more`);
    io.out(`TRANSLATIONS FAILED errors=${errors.length}: nothing read from or written to Sanity`);
    return null;
  }
  const fields = translatableFields(menu).length;
  io.out(`MENU JSON OK categories=${menu.categories.length} items=${itemCount(menu)}`);
  io.out(`TRANSLATIONS OK fields=${fields} values=${fields * TRANSLATION_LOCALES.length}`);
  return menu;
}

// ── plan output ──────────────────────────────────────────────────────────────
function printPlan(io, plan, full) {
  const c = plan.counts;
  io.out(
    `TRANSLATION PLAN docs=${c.docs} patched=${c.patched} set=${c.set} skip=${c.skip} conflicts=${c.conflicts} frDrift=${c.frDrift} drafts=${c.drafts} missingDocs=${c.missingDocs}`,
  );
  const sets = plan.patches.flatMap((p) => Object.keys(p.set).map((key) => `SET ${p.id} ${key}`));
  const shown = full ? sets : sets.slice(0, SHOW);
  for (const line of shown) io.out(line);
  if (shown.length < sets.length) io.out(`... ${sets.length - shown.length} more SET lines (--full prints them all)`);
  for (const x of plan.conflicts) io.out(`CONFLICT ${x.id} ${x.path}.${x.locale} sanity=${show(x.current)} json=${show(x.wanted)}`);
  for (const x of plan.frDrift) io.out(`FR DRIFT ${x.id} ${x.path} sanity=${show(x.sanity)} json=${show(x.json)}`);
  for (const id of plan.drafts) io.out(`DRAFT ${id}`);
  for (const id of plan.missingDocs) io.out(`MISSING DOC ${id}`);
}

// ── post-apply check (published perspective, fresh read) ─────────────────────
async function postApplyCheck(io, menu, before) {
  const after = await fetchM26(io.publishedClient);
  const afterById = new Map(after.map((d) => [d._id, d]));
  const failures = [];

  // 1. every target value equals the JSON, for all four locales
  const docIds = new Set();
  let values = 0;
  for (const target of patchTargets(menu)) {
    docIds.add(target.docId);
    const loc = readLocaleObject(afterById.get(target.docId), target.sanityPath);
    for (const locale of TRANSLATION_LOCALES) {
      if (target.values[locale] === undefined) continue;
      values += 1;
      if (loc?.[locale] !== target.values[locale]) {
        failures.push(`value ${target.docId} ${target.sanityPath}.${locale} sanity=${show(loc?.[locale])} json=${show(target.values[locale])}`);
      }
    }
  }

  // 2. nothing but the translations changed on any published document
  const beforePublished = before.filter((d) => !isDraft(d));
  const beforeIds = new Set(beforePublished.map((d) => d._id));
  for (const b of beforePublished) {
    const a = afterById.get(b._id);
    if (!a) failures.push(`document ${b._id} is gone`);
    else if (canon(stripTranslations(a)) !== canon(stripTranslations(b))) failures.push(`document ${b._id} changed outside the translations`);
  }
  for (const a of after) if (!beforeIds.has(a._id)) failures.push(`document ${a._id} appeared during the run`);

  // 3. the menu is still what the JSON says
  const categories = after.filter((d) => d._type === 'menuCategory').length;
  if (categories !== menu.categories.length) failures.push(`m26 categories: ${categories}, expected ${menu.categories.length}`);
  const visible = after.filter((d) => d._type === 'menuItem' && d.available === true).length;
  if (visible !== itemCount(menu)) failures.push(`visible m26 items: ${visible}, expected ${itemCount(menu)}`);

  if (failures.length) {
    for (const f of failures.slice(0, MAX_CHECK_LINES)) io.out(`POST-APPLY CHECK FAILED ${f}`);
    if (failures.length > MAX_CHECK_LINES) io.out(`… ${failures.length - MAX_CHECK_LINES} more`);
    return 1;
  }
  io.out(`POST-APPLY CHECK OK docs=${docIds.size} values=${values}`);
  return 0;
}

// ── modes ────────────────────────────────────────────────────────────────────
async function runPlan(opts, io, menu) {
  const current = await fetchM26(io.client);
  const plan = planTranslationPatches(menu, current, { overwriteExisting: opts.overwrite, includeDrafts: opts.includeDrafts });
  printPlan(io, plan, opts.full);
  if (opts.mode === 'dry-run') {
    io.out('DRY RUN: nothing written to Sanity');
    return 0;
  }

  const reasons = [];
  if (plan.conflicts.length && !opts.overwrite) {
    reasons.push(`${plan.conflicts.length} existing translation(s) differ from the JSON (CONFLICT; --overwrite-existing only for conflicts you can name)`);
  }
  if (plan.frDrift.length) {
    reasons.push(`${plan.frDrift.length} French text(s) in Sanity differ from the JSON (FR DRIFT; fold the Studio text into menu-2026.json first)`);
  }
  if (plan.drafts.length && !opts.includeDrafts) {
    reasons.push(`${plan.drafts.length} open draft(s) (DRAFT; publish or discard them in Studio, or pass --include-drafts)`);
  }
  if (plan.missingDocs.length) reasons.push(`${plan.missingDocs.length} document(s) missing in Sanity (MISSING DOC)`);
  if (reasons.length) {
    io.out(`ABORT: ${reasons.join('; ')}. Nothing written.`);
    return 1;
  }

  if (plan.patches.length === 0) {
    io.out('NOTHING TO DO');
  } else {
    const unguarded = plan.patches.find((p) => typeof p.rev !== 'string' || p.rev === '');
    if (unguarded) throw new Error(`document ${unguarded.id} has no _rev: cannot guard it with ifRevisionId (nothing written)`);
    const file = writeBackup(io, current);
    io.out(`BACKUP ${io.rel(file)} documents=${current.length}`);
    const tx = io.client.transaction();
    for (const p of plan.patches) tx.patch(p.id, (patch) => patch.ifRevisionId(p.rev).set(p.set));
    let result;
    try {
      result = await tx.commit({ visibility: 'sync' });
    } catch (e) {
      return commitFailed(io, e);
    }
    io.out(`APPLIED transactionId=${result.transactionId} patches=${plan.patches.length} values=${plan.counts.set}`);
  }
  return postApplyCheck(io, menu, current);
}

async function runRollback(opts, io) {
  const file = resolveBackup(opts.backup, io);
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(backup.documents) || backup.documents.length === 0) throw new Error(`${io.rel(file)} has no documents`);
  if (backup.projectId !== io.env.projectId || backup.dataset !== io.env.dataset) {
    throw new Error(`${io.rel(file)} is a backup of ${backup.projectId}/${backup.dataset}, not ${io.env.projectId}/${io.env.dataset}`);
  }
  const current = await fetchM26(io.client);
  const plan = planTranslationRollback(backup.documents, current);
  io.out(`ROLLBACK PLAN backup=${io.rel(file)} docs=${plan.counts.docs} set=${plan.counts.set} unset=${plan.counts.unset}`);
  const shown = opts.full ? plan.patches : plan.patches.slice(0, SHOW);
  for (const p of shown) io.out(`PATCH ${p.id} set=${Object.keys(p.set ?? {}).length} unset=${(p.unset ?? []).length}`);
  if (shown.length < plan.patches.length) io.out(`... ${plan.patches.length - shown.length} more patches (--full prints them all)`);
  if (opts.dry) {
    io.out('DRY RUN: nothing written to Sanity');
    return 0;
  }
  if (plan.patches.length === 0) {
    io.out('ROLLBACK OK (nothing to do)');
    return 0;
  }

  // safety backup of the current state, written before any Sanity write
  io.out(`SAFETY BACKUP ${io.rel(writeBackup(io, current, '-pre-rollback'))} documents=${current.length}`);
  const revisions = new Map(current.map((d) => [d._id, d._rev]));
  const tx = io.client.transaction();
  for (const p of plan.patches) {
    tx.patch(p.id, (patch) => {
      let guarded = patch.ifRevisionId(revisions.get(p.id));
      if (p.set) guarded = guarded.set(p.set);
      if (p.unset) guarded = guarded.unset(p.unset);
      return guarded;
    });
  }
  let result;
  try {
    result = await tx.commit({ visibility: 'sync' });
  } catch (e) {
    return commitFailed(io, e);
  }
  io.out(`ROLLBACK OK transactionId=${result.transactionId}`);
  return 0;
}

// ── main ─────────────────────────────────────────────────────────────────────
function readEnv(env) {
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
  const token = env.SANITY_TOKEN;
  const missing = Object.entries({ NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_TOKEN: token })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return { projectId, dataset, token, missing };
}

/** Runs the CLI; resolves to the exit code. `deps` (all optional): env, makeClient, root, menuPath, out, err. */
export async function main(argv, deps = {}) {
  const root = deps.root ?? ROOT;
  const io = {
    root,
    makeClient: deps.makeClient ?? createClient,
    menuPath: deps.menuPath ?? join(root, 'scripts/menu-2026/menu-2026.json'),
    out: deps.out ?? ((line) => console.log(line)),
    err: deps.err ?? ((line) => console.error(line)),
    rel(path) {
      const r = relative(root, path);
      return r && !r.startsWith('..') ? r : path;
    },
  };

  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    io.err(`ERROR ${e.message}\n${USAGE}`);
    return 2;
  }
  if (opts.help) {
    io.out(USAGE);
    return 0;
  }

  try {
    let menu;
    if (opts.mode !== 'rollback') {
      menu = loadMenu(opts, io);
      if (!menu) return 1;
    }
    const env = readEnv(deps.env ?? process.env);
    if (env.missing.length) {
      io.err(`ERROR missing env: ${env.missing.join(', ')} (run with node --env-file=.env.local ...)`);
      return 2;
    }
    io.env = env;
    io.out(`Target: ${env.projectId}/${env.dataset}`);
    const config = { projectId: env.projectId, dataset: env.dataset, apiVersion: API_VERSION, token: env.token, useCdn: false };
    io.client = io.makeClient({ ...config, perspective: 'raw' });
    io.publishedClient = io.makeClient({ ...config, perspective: 'published' });
    return opts.mode === 'rollback' ? await runRollback(opts, io) : await runPlan(opts, io, menu);
  } catch (e) {
    io.err(`ERROR ${e?.message ?? e}`);
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
  main(process.argv.slice(2)).then(exit, (e) => {
    console.error(`ERROR ${e?.stack ?? e}`);
    exit(1);
  });
}
