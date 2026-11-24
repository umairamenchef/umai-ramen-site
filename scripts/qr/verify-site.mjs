#!/usr/bin/env node
// Phase 15 / Plan 03: HTTP contract of the /menu/qr download page and of the /qr/* files on
// a RUNNING site (local `next start` or production).
//
//   node scripts/qr/verify-site.mjs [--base https://umai-ramen.fr] [--retries N] [--interval S]
//
// Read-only GETs (redirect: 'manual', user agent umai-qr-verify-site/1.0, 30 s timeout).
// Everything expected comes from src/lib/qr.ts and src/messages/*.json:
//   page, for each locale l of QR_LOCALES: GET /<l>/menu/qr answers 200; <html lang> is
//     qrLabelLang(l) (zh-Hans for zh); exactly one <meta name="robots">, content
//     "noindex, nofollow"; no <link rel="alternate"> with an hreflang; one <h1> whose text is
//     qrPage.title of src/messages/<l>.json (it/zh: the en value, served by the Phase 13
//     merge); it/zh wrap the page in a <div lang="en">, fr/en/de have no such div; five
//     data-qr-card in the order fr,en,de,it,zh; every QR_LABELS[x] in an element with
//     lang="<qrLabelLang(x)>"; every qrDisplayUrl(x) in the text; every code image (src = its
//     SVG path) with the localized alt; the <a download> hrefs are exactly the 12 files of
//     qrAllAssetPaths() plus the Exaprint variants of QR_TENT_VARIANTS (14 downloads);
//   unprefixed: GET /menu/qr with accept-language fr-FR answers 307 to /fr/menu/qr;
//   files: each of the 14 paths answers 200 with its content type (image/svg+xml, image/png,
//     application/pdf), the sha256 of public<path> in the repo and an X-Robots-Tag noindex;
//   sitemap: /sitemap.xml answers 200 with exactly 38 <url> entries and no /menu/qr;
//   menu: /fr/menu neither links to a /menu/qr URL nor declares one (alternate / canonical).
//
// --retries N re-runs the whole verification (connection errors included) up to N more
// times, --interval S seconds apart (default 10): a server still starting is not a failure.
// Output: one FAIL line per failure (of the last run), then
//   QR SITE OK base=<base> checks=<n> (exit 0) or QR SITE FAILED base=<base> failures=<n> (exit 1).
// Exit 2: usage error. Node 24 (native type stripping loads src/lib/qr.ts, global fetch);
// no dependency.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  QR_LOCALES,
  QR_LABELS,
  QR_TENT_VARIANTS,
  qrAllAssetPaths,
  qrAssetPath,
  qrDisplayUrl,
  qrLabelLang,
} from '../../src/lib/qr.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const DEFAULT_BASE = 'https://umai-ramen.fr';
const USER_AGENT = 'umai-qr-verify-site/1.0';
const TIMEOUT_MS = 30_000;
const EXPECTED_SITEMAP_URLS = 38; // 11 pages x fr/en/de + /menu x 5; /menu/qr is never listed
const MENU_ONLY = ['it', 'zh'];
const CONTENT_TYPES = { svg: 'image/svg+xml', png: 'image/png', pdf: 'application/pdf' };

/** Downloads of the page: the 12 main files (codes, A4, A6 card), then the A6 bleed variants. */
const DOWNLOADS = [...qrAllAssetPaths(), ...QR_TENT_VARIANTS.map((variant) => variant.path)];

const USAGE = 'usage: node scripts/qr/verify-site.mjs [--base <origin>] [--retries N] [--interval S]';

function usage(message) {
  if (message) console.error(`ERROR ${message}`);
  console.error(USAGE);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { base: DEFAULT_BASE, retries: 0, interval: 10 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') usage();
    if (!['--base', '--retries', '--interval'].includes(arg)) usage(`unknown argument ${arg}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) usage(`${arg} needs a value`);
    i += 1;
    if (arg === '--base') opts.base = value;
    else if (arg === '--retries') opts.retries = Number(value);
    else opts.interval = Number(value);
  }
  let url;
  try {
    url = new URL(opts.base);
  } catch {
    usage(`--base is not a valid URL: ${opts.base}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') usage('--base must be http(s)');
  if (url.pathname !== '/' || url.search !== '') usage('--base must be an origin such as https://umai-ramen.fr');
  if (!Number.isInteger(opts.retries) || opts.retries < 0) usage('--retries must be an integer >= 0');
  if (!Number.isFinite(opts.interval) || opts.interval < 0) usage('--interval must be a number >= 0');
  return { ...opts, base: url.origin };
}

// ---------------------------------------------------------------- html helpers

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

/** Markup without scripts (RSC payload), styles and comments. */
function withoutScripts(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** Visible text: tags out, entities decoded, NBSP -> space, whitespace collapsed. */
function toText(html) {
  return decodeEntities(withoutScripts(html).replace(/<[^>]+>/g, ' '))
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tags(markup, name) {
  return [...markup.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
}

/** Attribute value of a tag (or of an attribute string), case-insensitive name; null if absent. */
function attr(tag, name) {
  const value = new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1];
  return value === undefined ? null : decodeEntities(value);
}

const hasAttr = (tag, name) => new RegExp(`\\s${name}(?:[\\s=/>]|$)`, 'i').test(tag);

/** Leaf elements (text only inside): { lang, text }. */
function leafElements(markup) {
  return [...markup.matchAll(/<([a-z][a-z0-9]*)(\s[^>]*)?>([^<]*)<\/\1>/gi)].map((m) => ({
    lang: attr(m[2] ?? '', 'lang'),
    text: toText(m[3]),
  }));
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function messages(locale) {
  return JSON.parse(readFileSync(join(ROOT, 'src', 'messages', `${locale}.json`), 'utf8'));
}

/** qrPage strings as the site renders them: it/zh have none, the Phase 13 merge serves English. */
function qrPageStrings(locale) {
  return messages(MENU_ONLY.includes(locale) ? 'en' : locale).qrPage;
}

// ---------------------------------------------------------------- one run

async function runOnce(base) {
  let checks = 0;
  const failures = [];
  const check = (ok, message) => {
    checks += 1;
    if (!ok) failures.push(message);
    return ok;
  };

  async function request(path, headers = {}) {
    const url = new URL(path, base);
    try {
      return await fetch(url, {
        redirect: 'manual',
        headers: { 'user-agent': USER_AGENT, ...headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      check(false, `GET ${url.pathname} failed (${error?.cause?.code ?? error?.message ?? error})`);
      return null;
    }
  }

  /** GET that must answer 200; returns the body text or null. */
  async function page(path) {
    const res = await request(path);
    if (!res) return null;
    if (!check(res.status === 200, `${path}: status ${res.status}, expected 200`)) {
      await res.body?.cancel();
      return null;
    }
    return res.text();
  }

  // Page, per locale.
  for (const locale of QR_LOCALES) {
    const path = `/${locale}/menu/qr`;
    const html = await page(path);
    if (html === null) continue;
    const markup = withoutScripts(html);
    const strings = qrPageStrings(locale);

    const lang = /<html\b[^>]*?\slang="([^"]*)"/i.exec(html)?.[1] ?? null;
    check(lang === qrLabelLang(locale), `${path}: <html lang> is ${JSON.stringify(lang)}, expected ${qrLabelLang(locale)}`);

    const robots = tags(markup, 'meta').filter((tag) => attr(tag, 'name')?.toLowerCase() === 'robots');
    check(
      robots.length === 1 && attr(robots[0], 'content') === 'noindex, nofollow',
      `${path}: robots meta [${robots.join(' ')}], expected exactly one with content "noindex, nofollow"`,
    );

    const hreflangs = tags(markup, 'link').filter(
      (tag) => attr(tag, 'rel')?.toLowerCase() === 'alternate' && attr(tag, 'hreflang') !== null,
    );
    check(hreflangs.length === 0, `${path}: ${hreflangs.length} hreflang alternate link(s), expected none`);

    const h1 = [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => toText(m[1]));
    check(h1.length === 1 && h1[0] === strings.title, `${path}: <h1> [${h1.join(' | ')}], expected one « ${strings.title} »`);

    const englishDivs = tags(markup, 'div').filter((tag) => attr(tag, 'lang') === 'en').length;
    if (MENU_ONLY.includes(locale)) {
      check(englishDivs >= 1, `${path}: no <div lang="en"> around the English page strings`);
    } else {
      check(englishDivs === 0, `${path}: ${englishDivs} <div lang="en">, expected none on a ${locale} page`);
    }

    const cards = [...markup.matchAll(/\sdata-qr-card="([^"]*)"/g)].map((m) => m[1]).join(',');
    check(cards === QR_LOCALES.join(','), `${path}: data-qr-card order "${cards}", expected "${QR_LOCALES.join(',')}"`);

    const leaves = leafElements(markup);
    const text = toText(markup);
    const images = tags(markup, 'img');
    for (const x of QR_LOCALES) {
      const want = qrLabelLang(x);
      check(
        leaves.some((leaf) => leaf.lang === want && leaf.text === QR_LABELS[x]),
        `${path}: « ${QR_LABELS[x]} » is not in an element with lang="${want}"`,
      );
      check(text.includes(qrDisplayUrl(x)), `${path}: ${qrDisplayUrl(x)} is not shown`);
      const src = qrAssetPath(x, 'svg');
      const alt = strings.qrAlt.replace('{url}', qrDisplayUrl(x));
      check(
        images.some((tag) => attr(tag, 'src') === src && attr(tag, 'alt') === alt),
        `${path}: no <img src="${src}" alt="${alt}">`,
      );
    }

    const downloads = tags(markup, 'a')
      .filter((tag) => hasAttr(tag, 'download'))
      .map((tag) => attr(tag, 'href'));
    for (const file of DOWNLOADS) {
      check(downloads.includes(file), `${path}: no <a download> with href="${file}"`);
    }
    check(
      downloads.length === DOWNLOADS.length,
      `${path}: ${downloads.length} download links [${downloads.join(', ')}], expected ${DOWNLOADS.length}`,
    );
  }

  // Unprefixed URL (Node's fetch sends accept-language: * otherwise).
  {
    const res = await request('/menu/qr', { 'accept-language': 'fr-FR' });
    if (res) {
      await res.body?.cancel();
      const location = res.headers.get('location');
      const target = location === null ? null : new URL(location, base).pathname;
      check(
        res.status === 307 && target === '/fr/menu/qr',
        `/menu/qr [accept-language: fr-FR]: ${res.status} -> ${location}, expected 307 -> /fr/menu/qr`,
      );
    }
  }

  // Files.
  for (const file of DOWNLOADS) {
    const res = await request(file);
    if (!res) continue;
    if (!check(res.status === 200, `${file}: status ${res.status}, expected 200`)) {
      await res.body?.cancel();
      continue;
    }
    const expectedType = CONTENT_TYPES[file.slice(file.lastIndexOf('.') + 1)];
    const type = res.headers.get('content-type') ?? '';
    check(type.startsWith(expectedType), `${file}: content-type "${type}", expected ${expectedType}`);
    const robots = res.headers.get('x-robots-tag') ?? '';
    check(/noindex/i.test(robots), `${file}: X-Robots-Tag "${robots}", expected noindex`);
    const served = Buffer.from(await res.arrayBuffer());
    let local = null;
    try {
      local = readFileSync(join(ROOT, 'public', file));
    } catch {
      // reported below
    }
    check(
      local !== null && sha256(served) === sha256(local),
      `${file}: served ${served.length} B differ from public${file} (${local === null ? 'missing' : `${local.length} B`})`,
    );
  }

  // Sitemap.
  {
    const xml = await page('/sitemap.xml');
    if (xml !== null) {
      const urls = (xml.match(/<url>/g) ?? []).length;
      check(urls === EXPECTED_SITEMAP_URLS, `/sitemap.xml: ${urls} <url> entries, expected ${EXPECTED_SITEMAP_URLS}`);
      check(!xml.includes('/menu/qr'), '/sitemap.xml lists a /menu/qr URL');
    }
  }

  // The tourist menu does not point to the tool page.
  {
    const html = await page('/fr/menu');
    if (html !== null) {
      const markup = withoutScripts(html);
      const declared = tags(markup, 'link').filter(
        (tag) =>
          ['alternate', 'canonical'].includes(attr(tag, 'rel')?.toLowerCase() ?? '') &&
          (attr(tag, 'href') ?? '').includes('/menu/qr'),
      );
      check(declared.length === 0, `/fr/menu: ${declared.length} alternate / canonical link(s) to a /menu/qr URL`);
      const linked = tags(markup, 'a')
        .map((tag) => attr(tag, 'href') ?? '')
        .filter((href) => href.includes('/menu/qr'));
      check(linked.length === 0, `/fr/menu links to the QR tool page (${linked.join(', ')})`);
    }
  }

  return { checks, failures };
}

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const runs = opts.retries + 1;
  for (let run = 1; ; run += 1) {
    const { checks, failures } = await runOnce(opts.base);
    if (failures.length === 0) {
      console.log(`QR SITE OK base=${opts.base} checks=${checks}`);
      return 0;
    }
    if (run < runs) {
      console.log(
        `QR SITE run ${run}/${runs}: ${failures.length} failure(s), first: ${failures[0]}; retrying in ${opts.interval}s`,
      );
      await new Promise((done) => setTimeout(done, opts.interval * 1000));
      continue;
    }
    for (const line of failures) console.log(`FAIL ${line}`);
    console.log(`QR SITE FAILED base=${opts.base} failures=${failures.length}`);
    return 1;
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`ERROR ${error?.stack ?? error}`);
    process.exit(2);
  },
);
