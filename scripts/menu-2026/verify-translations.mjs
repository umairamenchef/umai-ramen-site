#!/usr/bin/env node
/**
 * UMAÏ Ramen: proves that the translated menu pages show French only as the intentional secondary name (Phase 14).
 *
 *   node scripts/menu-2026/verify-translations.mjs [--base <url>] [--locale fr|en|de|it|zh] [--target <url|file>]
 *        [--json <menu json>] [--retries N] [--interval S]
 *
 * Defaults: base https://umai-ramen.fr, the five locales on <base>/<locale>/menu, menu scripts/menu-2026/menu-2026.json
 * (the translations expected on the pages), retries 0, interval 30. `--target` (a URL or an HTML file) needs `--locale`.
 * Per locale (ROADMAP success criteria 1 and 2; rules of translation-checks.mjs):
 *   LANG    the <html lang> is zh-Hans on zh, else the locale code;
 *   FRNAME  the [data-fr-name] lines equal the expected French names, in print order (frenchSecondaryNames);
 *   FRLEAK  (not fr) no French content string (frenchLeakCandidates) appears anywhere else in the visible text.
 * A page that fails is fetched again up to `--retries` times (the site revalidates a few seconds after Sanity changes),
 * `--interval` seconds apart; a fetch error or an HTTP status other than 200 is retried the same way.
 *
 * Output: `OK   <l> frNames=<n> leakChecks=<n> target=<t>` or `FAIL <LANG|FRNAME|FRLEAK> <l> <detail>` lines (40 at most
 * per locale, then `… <n> more`), then `VERIFY TRANSLATIONS OK locales=<n>` (exit 0) or
 * `VERIFY TRANSLATIONS FAILED failures=<n>` (exit 1). Usage, file and network errors exit 2.
 * No dependency (Node 24: fetch). `main(argv, deps)` is exported for the tests (deps: out, err, fetch, sleep, menuPath).
 */
import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { extractFrenchNameLines, frenchLeakCandidates, frenchSecondaryNames, htmlLang, norm, visibleText } from './translation-checks.mjs';

const LOCALES = ['fr', 'en', 'de', 'it', 'zh'];
const DEFAULT_BASE = 'https://umai-ramen.fr';
const MAX_FAIL_LINES = 40;
const USAGE =
  'usage: node scripts/menu-2026/verify-translations.mjs [--base <url>] [--locale fr|en|de|it|zh] [--target <url|file>] [--json <menu json>] [--retries N] [--interval S]';

// French strings that may legitimately sit on a translated page although they are menu texts. Only for a chrome string
// proven not to be menu content, with the reason next to it. Empty on purpose: today nothing is allowed.
const FR_LEAK_ALLOW = [];

class UsageError extends Error {}

// ── arguments ────────────────────────────────────────────────────────────────
const VALUE_FLAGS = new Set(['--base', '--locale', '--target', '--json', '--retries', '--interval']);

function parseArgs(argv) {
  const opts = { base: DEFAULT_BASE, locale: null, target: null, json: null, retries: 0, interval: 30 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') return { help: true };
    if (!VALUE_FLAGS.has(arg)) throw new UsageError(`unknown argument ${arg}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new UsageError(`${arg} needs a value`);
    i += 1;
    if (arg === '--base') opts.base = value;
    else if (arg === '--locale') opts.locale = value;
    else if (arg === '--target') opts.target = value;
    else if (arg === '--json') opts.json = value;
    else if (arg === '--retries') opts.retries = Number(value);
    else opts.interval = Number(value);
  }
  if (opts.locale !== null && !LOCALES.includes(opts.locale)) throw new UsageError(`--locale must be one of ${LOCALES.join('|')}`);
  if (opts.target !== null && opts.locale === null) throw new UsageError('--target needs --locale');
  if (!Number.isInteger(opts.retries) || opts.retries < 0) throw new UsageError('--retries must be an integer >= 0');
  if (!Number.isFinite(opts.interval) || opts.interval < 0) throw new UsageError('--interval must be a number >= 0');
  return opts;
}

// ── page ─────────────────────────────────────────────────────────────────────
const isUrl = (target) => /^https?:\/\//i.test(target);

async function load(target, io) {
  if (isUrl(target)) {
    let res;
    try {
      res = await io.fetch(target, {
        redirect: 'follow',
        headers: { 'user-agent': 'umai-verify-translations/1.0', 'cache-control': 'no-cache' },
        signal: AbortSignal.timeout(60_000),
      });
    } catch (e) {
      throw new UsageError(`fetch ${target}: ${e.cause?.code ?? e.message}`);
    }
    const body = await res.text();
    if (res.status !== 200) throw new UsageError(`fetch ${target}: HTTP ${res.status}`);
    return body;
  }
  try {
    return readFileSync(target, 'utf8');
  } catch (e) {
    throw new UsageError(`cannot read ${target}: ${e.message}`);
  }
}

const quoted = (value) => (value === undefined ? '(none)' : JSON.stringify(value));

/** LANG, FRNAME and FRLEAK checks of one page: { failures: string[] (FAIL lines), frNames, leakChecks }. */
function checkPage(html, menu, locale) {
  const failures = [];
  const expectedLang = locale === 'zh' ? 'zh-Hans' : locale;
  const lang = htmlLang(html);
  if (lang !== expectedLang) failures.push(`FAIL LANG ${locale} html lang=${quoted(lang ?? undefined)}, expected ${JSON.stringify(expectedLang)}`);

  const expected = frenchSecondaryNames(menu, locale);
  const found = extractFrenchNameLines(html);
  if (found.length !== expected.length || found.some((name, i) => name !== expected[i])) {
    const at = [...Array(Math.max(found.length, expected.length)).keys()].find((i) => found[i] !== expected[i]);
    failures.push(
      `FAIL FRNAME ${locale} page has ${found.length} French line(s), expected ${expected.length}; first difference at index ${at}: page=${quoted(found[at])} expected=${quoted(expected[at])}`,
    );
  }

  let leakChecks = 0;
  if (locale !== 'fr') {
    const text = visibleText(html, { dropFrenchNameLines: true });
    for (const candidate of frenchLeakCandidates(menu, locale)) {
      if (FR_LEAK_ALLOW.includes(candidate)) continue;
      leakChecks += 1;
      if (text.includes(norm(candidate))) failures.push(`FAIL FRLEAK ${locale} French text on the page: ${JSON.stringify(candidate)}`);
    }
  }
  return { failures, frNames: found.length, leakChecks };
}

async function verifyLocale(locale, target, menu, opts, io) {
  const attempts = isUrl(target) ? opts.retries + 1 : 1;
  for (let attempt = 1; ; attempt += 1) {
    const last = attempt >= attempts;
    let html;
    try {
      html = await load(target, io);
    } catch (e) {
      if (!(e instanceof UsageError) || last) throw e;
      io.out(`attempt ${attempt}/${attempts} ${locale} error: ${e.message}`);
      await io.sleep(opts.interval);
      continue;
    }
    const result = checkPage(html, menu, locale);
    if (result.failures.length === 0 || last) return result;
    io.out(`attempt ${attempt}/${attempts} ${locale} failures=${result.failures.length} (e.g. ${result.failures[0].slice('FAIL '.length)})`);
    await io.sleep(opts.interval);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function run(opts, io) {
  let menu;
  try {
    menu = JSON.parse(readFileSync(opts.json ?? io.menuPath, 'utf8'));
  } catch (e) {
    throw new UsageError(`cannot read the menu JSON ${opts.json ?? io.menuPath}: ${e.message}`);
  }
  if (!Array.isArray(menu?.categories)) throw new UsageError('the menu JSON has no categories[]');

  const locales = opts.locale ? [opts.locale] : LOCALES;
  const base = opts.base.replace(/\/+$/, '');
  let failures = 0;
  for (const locale of locales) {
    const target = opts.target ?? `${base}/${locale}/menu`;
    const result = await verifyLocale(locale, target, menu, opts, io);
    if (result.failures.length === 0) {
      io.out(`OK   ${locale} frNames=${result.frNames} leakChecks=${result.leakChecks} target=${target}`);
      continue;
    }
    for (const line of result.failures.slice(0, MAX_FAIL_LINES)) io.out(line);
    if (result.failures.length > MAX_FAIL_LINES) io.out(`… ${result.failures.length - MAX_FAIL_LINES} more`);
    failures += result.failures.length;
  }
  if (failures === 0) {
    io.out(`VERIFY TRANSLATIONS OK locales=${locales.length}`);
    return 0;
  }
  io.out(`VERIFY TRANSLATIONS FAILED failures=${failures}`);
  return 1;
}

/** Runs the CLI; resolves to the exit code. `deps` (all optional): out, err, fetch, sleep, menuPath. */
export async function main(argv, deps = {}) {
  const io = {
    out: deps.out ?? ((line) => console.log(line)),
    err: deps.err ?? ((line) => console.error(line)),
    fetch: deps.fetch ?? ((...args) => globalThis.fetch(...args)),
    sleep: deps.sleep ?? ((seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))),
    menuPath: deps.menuPath ?? join(import.meta.dirname, 'menu-2026.json'),
  };
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    io.err(`ERROR ${e.message}`);
    io.err(USAGE);
    return 2;
  }
  if (opts.help) {
    io.out(USAGE);
    return 0;
  }
  try {
    return await run(opts, io);
  } catch (e) {
    io.err(`ERROR ${e instanceof UsageError ? e.message : (e?.stack ?? e)}`);
    return 2;
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
    (code) => process.stdout.write('', () => process.exit(code)),
    (e) => {
      console.error(`ERROR ${e?.stack ?? e}`);
      process.exit(2);
    },
  );
}
