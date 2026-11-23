#!/usr/bin/env node
// Phase 13 / Plan 01: routing verifier for a RUNNING site (local `next start` or live).
//
//   node scripts/i18n/verify-routing.mjs [--base <url>]
//
// Default base: https://umai-ramen.fr. Checks, for IT/ZH as menu-only locales (I18N-02, I18N-05):
//   - the redirect matrix: every non-menu /it/* and /zh/* URL (percent-encoded prefixes
//     included) answers 307 to the same path under /en (query kept); locale detection
//     (Accept-Language or NEXT_LOCALE cookie = it/zh) on unprefixed URLs ends on /en,
//     except /menu which goes to /{it,zh}/menu; / without headers still goes to /fr,
//     de-DE to /de, en-US to /en; /ig-studio still gates to its login
//   - 200 and no hreflang `Link` header on /{fr,en,de}, /{fr,en,de}/infos and /{fr,en,de,it,zh}/menu
//   - on each menu page: <html lang> (zh -> zh-Hans), canonical, and exactly the hreflang set
//     fr, en, de, it, zh-Hans + x-default (-> /fr/menu); /en/infos has no it / zh-Hans
//   - /sitemap.xml: 38 URLs, and its only IT/ZH entries are /it/menu and /zh/menu
//
// Exit codes: 0 = ROUTING OK, 1 = ROUTING FAILED, 2 = usage or network error.
// No dependencies (Node 24: global fetch).

const DEFAULT_BASE = 'https://umai-ramen.fr';
const TIMEOUT_MS = 30_000;
const EXPECTED_SITEMAP_URLS = 38; // 11 pages x fr/en/de + /menu x 5 (2026-11-23)

const FULL_SITE = ['fr', 'en', 'de'];
const ALL = ['fr', 'en', 'de', 'it', 'zh'];
const HTML_LANG = { fr: 'fr', en: 'en', de: 'de', it: 'it', zh: 'zh-Hans' };

const AL_ZH = { 'accept-language': 'zh-CN,zh;q=0.9' };
const AL_IT = { 'accept-language': 'it-IT,it;q=0.9' };
const AL_DE = { 'accept-language': 'de-DE,de;q=0.9' };
const AL_EN = { 'accept-language': 'en-US,en;q=0.9' };

// [path, request headers, expected Location (pathname + search)], status always 307.
const REDIRECTS = [
  ['/it', {}, '/en'],
  ['/zh', {}, '/en'],
  ['/it/infos', {}, '/en/infos'],
  ['/zh/infos', {}, '/en/infos'],
  ['/zh/notre-histoire?ref=qr', {}, '/en/notre-histoire?ref=qr'],
  ['/it/carte-ete', {}, '/en/carte-ete'],
  ['/zh/mentions-legales', {}, '/en/mentions-legales'],
  // next-intl matches the locale prefix on the decoded path: the rule must too.
  ['/z%68/infos', {}, '/en/infos'],
  ['/%69t', {}, '/en'],
  ['/', AL_ZH, '/en'],
  ['/', AL_IT, '/en'],
  ['/', { cookie: 'NEXT_LOCALE=zh' }, '/en'],
  ['/', { cookie: 'NEXT_LOCALE=it' }, '/en'],
  ['/infos', AL_ZH, '/en/infos'],
  ['/menu', { cookie: 'NEXT_LOCALE=zh' }, '/zh/menu'],
  ['/menu', AL_IT, '/it/menu'],
  ['/', {}, '/fr'],
  ['/', AL_DE, '/de'],
  ['/', AL_EN, '/en'],
  ['/ig-studio', {}, '/ig-studio/login'],
];

class UsageError extends Error {}

function usage(message) {
  if (message) console.error(`ERROR ${message}`);
  console.error('usage: node scripts/i18n/verify-routing.mjs [--base <url>]');
  process.exit(2);
}

function parseArgs(argv) {
  let base = DEFAULT_BASE;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') usage();
    if (arg !== '--base') usage(`unknown argument ${arg}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) usage('--base needs a value');
    i += 1;
    base = value;
  }
  let url;
  try {
    url = new URL(base);
  } catch {
    usage(`--base is not a valid URL: ${base}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') usage('--base must be http(s)');
  return url.origin;
}

const base = parseArgs(process.argv.slice(2));

let checks = 0;
const failures = [];

function check(ok, message) {
  checks += 1;
  if (!ok) failures.push(message);
}

async function request(path, headers = {}) {
  const url = new URL(path, base);
  try {
    return await fetch(url, {
      redirect: 'manual',
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new UsageError(`GET ${url} failed: ${error?.cause?.code ?? error?.message ?? error}`);
  }
}

function describe(path, headers) {
  const h = Object.entries(headers).map(([k, v]) => `${k}: ${v}`);
  return h.length ? `${path} [${h.join('; ')}]` : path;
}

function pathAndSearch(location) {
  const url = new URL(location, base);
  return url.pathname + url.search;
}

// ---------------------------------------------------------------- html helpers

function htmlLangOf(html) {
  return /<html\b[^>]*?\slang="([^"]*)"/i.exec(html)?.[1] ?? null;
}

function attr(tag, name) {
  return new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1] ?? null;
}

function linkTags(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
}

/** Sorted « lang=/path » strings of every <link rel="alternate" hreflang> of the page. */
function alternatesOf(html) {
  const out = [];
  for (const tag of linkTags(html)) {
    if (attr(tag, 'rel')?.toLowerCase() !== 'alternate') continue;
    const lang = attr(tag, 'hreflang');
    const href = attr(tag, 'href');
    if (lang === null || href === null) continue;
    out.push(`${lang}=${new URL(href, base).pathname}`);
  }
  return out.sort();
}

function canonicalsOf(html) {
  const out = [];
  for (const tag of linkTags(html)) {
    if (attr(tag, 'rel')?.toLowerCase() !== 'canonical') continue;
    const href = attr(tag, 'href');
    if (href !== null) out.push(new URL(href, base).pathname);
  }
  return out;
}

// ---------------------------------------------------------------- checks

async function checkRedirects() {
  for (const [path, headers, expected] of REDIRECTS) {
    const label = describe(path, headers);
    const res = await request(path, headers);
    await res.body?.cancel();
    check(res.status === 307, `${label}: expected status 307, got ${res.status}`);
    const location = res.headers.get('location');
    if (location === null) {
      check(false, `${label}: no Location header (expected ${expected})`);
      continue;
    }
    const actual = pathAndSearch(location);
    check(actual === expected, `${label}: expected Location ${expected}, got ${actual}`);
  }
}

/** 200 and no hreflang Link header (next-intl alternateLinks is off). Returns the HTML or null. */
async function checkPage(path, { expectBody = false } = {}) {
  const res = await request(path);
  const status = res.status;
  check(status === 200, `${path}: expected status 200, got ${status}`);
  const link = res.headers.get('link');
  check(link === null || !/hreflang/i.test(link), `${path}: carries an hreflang Link header: ${link}`);
  if (!expectBody || status !== 200) {
    await res.body?.cancel();
    return null;
  }
  return res.text();
}

async function checkMenuPages() {
  const expectedAlternates = [
    'fr=/fr/menu',
    'en=/en/menu',
    'de=/de/menu',
    'it=/it/menu',
    'zh-Hans=/zh/menu',
    'x-default=/fr/menu',
  ].sort();
  for (const locale of ALL) {
    const path = `/${locale}/menu`;
    const html = await checkPage(path, { expectBody: true });
    if (html === null) continue;
    const lang = htmlLangOf(html);
    check(lang === HTML_LANG[locale], `${path}: expected <html lang="${HTML_LANG[locale]}">, got ${lang}`);
    const alternates = alternatesOf(html);
    check(
      alternates.join(' ') === expectedAlternates.join(' '),
      `${path}: hreflang set is [${alternates.join(', ')}], expected [${expectedAlternates.join(', ')}]`,
    );
    const canonicals = canonicalsOf(html);
    check(
      canonicals.length === 1 && canonicals[0] === path,
      `${path}: canonical is [${canonicals.join(', ')}], expected [${path}]`,
    );
  }
}

async function checkFullSitePages() {
  for (const locale of FULL_SITE) await checkPage(`/${locale}`);
  for (const locale of FULL_SITE) {
    const path = `/${locale}/infos`;
    const html = await checkPage(path, { expectBody: locale === 'en' });
    if (html === null) continue;
    // Non-menu pages keep fr / en / de + x-default only: no it, no zh-Hans.
    const expected = [...FULL_SITE.map((l) => `${l}=/${l}/infos`), 'x-default=/fr/infos'].sort();
    const alternates = alternatesOf(html);
    check(
      alternates.join(' ') === expected.join(' '),
      `${path}: hreflang set is [${alternates.join(', ')}], expected [${expected.join(', ')}]`,
    );
  }
}

async function checkSitemap() {
  const res = await request('/sitemap.xml');
  check(res.status === 200, `/sitemap.xml: expected status 200, got ${res.status}`);
  if (res.status !== 200) {
    await res.body?.cancel();
    return;
  }
  const xml = await res.text();
  const urlCount = (xml.match(/<url>/g) ?? []).length;
  check(urlCount === EXPECTED_SITEMAP_URLS, `/sitemap.xml: expected ${EXPECTED_SITEMAP_URLS} <url> entries, got ${urlCount}`);
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const locale of ['it', 'zh']) {
    const own = paths.filter((p) => p.startsWith(`/${locale}/`));
    check(
      own.length === 1 && own[0] === `/${locale}/menu`,
      `/sitemap.xml: ${locale} entries are [${own.join(', ')}], expected [/${locale}/menu]`,
    );
  }
  for (const lang of ['zh-Hans', 'it']) {
    const n = (xml.match(new RegExp(`hreflang="${lang}"`, 'g')) ?? []).length;
    check(n === 5, `/sitemap.xml: hreflang="${lang}" occurs ${n} times, expected 5`);
  }
}

async function main() {
  await checkRedirects();
  await checkFullSitePages();
  await checkMenuPages();
  await checkSitemap();

  if (failures.length === 0) {
    console.log(`ROUTING OK base=${base} checks=${checks}`);
    return 0;
  }
  for (const line of failures) console.log(`FAIL ${line}`);
  console.log(`ROUTING FAILED failures=${failures.length} base=${base}`);
  return 1;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`ERROR ${error instanceof UsageError ? error.message : (error.stack ?? error)}`);
    process.exit(2);
  },
);
