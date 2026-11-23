#!/usr/bin/env node
// Phase 12 / Plan 03: verifies a live URL or a prerendered HTML file against the
// 2026 print transcription (scripts/menu-2026/menu-2026.json) and the `menu.*`
// message files (src/messages/<locale>.json).
//
//   node scripts/menu-2026/verify-live.mjs [--target <url|file>] [--locale fr|en|de|it|zh]
//        [--expect m26|legacy] [--home] [--retries N] [--interval S]
//
// Defaults: --locale fr, --expect m26, --retries 0, --interval 30, target
// https://umai-ramen.fr/<locale>/menu (or https://umai-ramen.fr/<locale> with --home).
//
// expect m26 (menu page): every category / item of the print in print order, each
// price bound to its own item (3/6/9 pcs, 25cl/50cl, 12cl/75cl, « 3 × 6cl »),
// « Prix sur demande », badges, descriptions, JP labels, category notes, page
// notes; absent: `??`, « Asashi », raw message keys, the formules title and the
// legacy dishes.
// expect legacy (menu page): the new code still renders the old data.
// --home: the « Notre Menu » cards (3 Sanity photos) and the Tantan price.
// Menu pages must never render a Sanity image (`MENU_IMAGES`).
//
// Exit codes: 0 = VERIFY OK, 1 = VERIFY FAILED, 2 = usage / fetch / file error.
// No dependencies (Node 24: fetch, import.meta.dirname).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = ['fr', 'en', 'de', 'it', 'zh'];
const EXPECTS = ['m26', 'legacy'];
const BASE_URL = 'https://umai-ramen.fr';
const MAX_FAIL_LINES = 60;

// The legacy « Ramen Paitan » category is translated in EN/DE (« Paitan Ramen »),
// so the legacy marker and the home check are locale-aware.
const LEGACY_PAITAN = { fr: 'Ramen Paitan', en: 'Paitan Ramen', de: 'Paitan Ramen' };
const LEGACY_CHINTAN = { fr: 'Ramen Chintan', en: 'Chintan Ramen', de: 'Chintan Ramen' };

// Legacy (eazee-link 2026-07) names that must be gone from the live menu once the
// 2026 print is published. None of them occurs in menu-2026.json or the messages.
const LEGACY_ABSENT = [
  'Ramen Paitan',
  'Ramen Chintan',
  'Paitan Ramen',
  'Chintan Ramen',
  'Gyoza canard',
  'Gyoza crevette',
  'Menu Gyoza',
  'Hakodate Ramen',
  'Kamo Soba',
  'Katsu Curry Mazesoba',
  'Udon carbonara',
  'Udon Tempura',
  'Kimchi',
  'Panaché',
  'Picon bière',
  'Kokoro',
  'Apérol Spritz',
  'Vieilles prune',
  'Wantan Men Ramen',
  'Yasaï Ramen',
  'Chashu supplémentaire',
  'Portion de nouilles',
];

// A raw next-intl key printed instead of its message.
const RAW_KEY_RE =
  /\bmenu\.(priceOnRequest|serviceIncluded|allergens|intro|section\w*|badge\.\w+|unit\.\w+)/;

class UsageError extends Error {}

function usage(message) {
  if (message) console.error(`ERROR ${message}`);
  console.error(
    'usage: node scripts/menu-2026/verify-live.mjs [--target <url|file>] [--locale fr|en|de|it|zh] ' +
      '[--expect m26|legacy] [--home] [--retries N] [--interval S]',
  );
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { target: null, locale: 'fr', expect: 'm26', home: false, retries: 0, interval: 30 };
  const takesValue = new Set(['--target', '--locale', '--expect', '--retries', '--interval']);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--home') {
      opts.home = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') usage();
    if (!takesValue.has(arg)) usage(`unknown argument ${arg}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) usage(`${arg} needs a value`);
    i += 1;
    if (arg === '--target') opts.target = value;
    else if (arg === '--locale') opts.locale = value;
    else if (arg === '--expect') opts.expect = value;
    else if (arg === '--retries') opts.retries = Number(value);
    else if (arg === '--interval') opts.interval = Number(value);
  }
  if (!LOCALES.includes(opts.locale)) usage(`--locale must be one of ${LOCALES.join('|')}`);
  if (!EXPECTS.includes(opts.expect)) usage(`--expect must be one of ${EXPECTS.join('|')}`);
  if (!Number.isInteger(opts.retries) || opts.retries < 0) usage('--retries must be an integer >= 0');
  if (!Number.isFinite(opts.interval) || opts.interval < 0) usage('--interval must be a number >= 0');
  if (['it', 'zh'].includes(opts.locale) && (opts.home || opts.expect === 'legacy')) usage('--locale it|zh: menu page with --expect m26 only (IT/ZH are menu-only)');
  if (!opts.target) {
    opts.target = opts.home ? `${BASE_URL}/${opts.locale}` : `${BASE_URL}/${opts.locale}/menu`;
  }
  return opts;
}

// ---------------------------------------------------------------- data + messages

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new UsageError(`cannot read ${path}: ${err.message}`);
  }
}

function loadContext(locale) {
  const root = join(import.meta.dirname, '..', '..');
  const menu = readJson(join(import.meta.dirname, 'menu-2026.json'));
  const messages = readJson(join(root, 'src', 'messages', `${locale}.json`));
  if (!Array.isArray(menu.categories)) throw new UsageError('menu-2026.json has no categories[]');
  return { menu, messages };
}

function message(messages, path) {
  const value = path.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages);
  if (typeof value !== 'string' || value === '') {
    throw new UsageError(`missing message ${path}`);
  }
  return value;
}

/** Minimal ICU: `{count}` and one `{count, plural, =n {…} one {…} other {…}}`, `#` = count. */
function formatMessage(pattern, count, locale) {
  const plural = pattern.match(/\{count,\s*plural,\s*([\s\S]*)\}\s*$/);
  if (plural) {
    const branches = {};
    const re = /(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(plural[1])) !== null) branches[m[1]] = m[2];
    const category = new Intl.PluralRules(locale).select(count);
    const branch = branches[`=${count}`] ?? branches[category] ?? branches.other ?? '';
    const prefix = pattern.slice(0, plural.index);
    return (prefix + branch.replace(/#/g, String(count))).replace(/\{count\}/g, String(count));
  }
  return pattern.replace(/\{count\}/g, String(count));
}

// ---------------------------------------------------------------- text helpers

/** NBSP / narrow NBSP -> space, collapse whitespace (applied to page text AND expectations). */
function norm(value) {
  return String(value ?? '')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const squash = (value) => String(value ?? '').replace(/[\s  ]+/g, '');

function decodeEntities(value) {
  return value
    .replace(/&(?:#x27|#39|apos);/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&amp;/g, '&');
}

/**
 * Visible text only: drops <script> (JSON-LD, RSC payload) and <style>, then HTML
 * comments (React splits adjacent text nodes with `<!-- -->`), then the tags.
 */
function toText(html) {
  const withoutBlocks = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '');
  return norm(decodeEntities(withoutBlocks.replace(/<[^>]+>/g, ' ')));
}

/**
 * `needle` (squashed, starts with a digit for prices) occurs in `hay` (squashed) and
 * is not glued to a preceding digit, so « 8,90€ » never matches inside « 18,90€ ».
 */
function containsBounded(hay, needle) {
  if (!needle) return false;
  let from = 0;
  for (;;) {
    const at = hay.indexOf(needle, from);
    if (at === -1) return false;
    const before = at > 0 ? hay[at - 1] : '';
    if (!/[0-9]/.test(before)) return true;
    from = at + 1;
  }
}

// ---------------------------------------------------------------- checks

function makeChecker() {
  const failures = [];
  let checks = 0;
  return {
    failures,
    get checks() {
      return checks;
    },
    check(ok, failLine) {
      checks += 1;
      if (!ok) failures.push(`FAIL ${failLine}`);
      return ok;
    },
  };
}

const short = (value, max = 50) => {
  const s = norm(value);
  return s.length > max ? `« ${s.slice(0, max - 1)}… »` : `« ${s} »`;
};

function imgTagsWithSanity(html) {
  return (html.match(/<img\b[^>]*>/gi) ?? []).filter((tag) => tag.includes('cdn.sanity.io'));
}

/** `<a … href="/<locale>/menu" …>…</a>` blocks whose inner HTML holds a Sanity <img>. */
function homeCardImages(html, locale) {
  const re = new RegExp(
    `<a\\b[^>]*\\bhref="\\/${locale}\\/menu(?:[?#][^"]*)?"[^>]*>([\\s\\S]*?)<\\/a\\s*>`,
    'gi',
  );
  let count = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (imgTagsWithSanity(m[1]).length > 0) count += 1;
  }
  return count;
}

function verifyMenuM26(text, ctx, locale, c) {
  const { menu, messages } = ctx;
  const L = (field) => norm(field?.[locale] ?? field?.fr ?? '');
  const eur = (n) => `${n.toFixed(2).replace('.', ',')}€`;
  const qty = (v) => {
    const label = L(v.label);
    if (label) return label;
    if (v.quantity == null) return '';
    if (v.unit === 'pcs' || v.unit === 'scoop') {
      return formatMessage(message(messages, `menu.unit.${v.unit}`), v.quantity, locale);
    }
    if (v.unit === 'cl' || v.unit === 'l') return `${String(v.quantity).replace('.', ',')}${v.unit}`;
    return '';
  };

  // a. category names, notes, sub-group labels, category JP labels
  for (const cat of menu.categories) {
    const name = L(cat.name);
    c.check(name !== '' && text.includes(name), `CATEGORY ${cat.key} ${short(name)}`);
    if (cat.nameJp) c.check(text.includes(norm(cat.nameJp)), `JP ${cat.key} ${cat.nameJp}`);
    for (const field of ['description', 'footnote']) {
      const value = L(cat[field]);
      if (value) c.check(text.includes(value), `TEXT ${cat.key}.${field} ${short(value)}`);
    }
    const subgroups = new Set();
    for (const item of cat.items ?? []) {
      const subgroup = L(item.subgroup);
      if (!subgroup || subgroups.has(subgroup)) continue;
      subgroups.add(subgroup);
      c.check(text.includes(subgroup), `TEXT ${item.key}.subgroup ${short(subgroup)}`);
    }
  }

  // b. order + price binding: walk the items in print order with a cursor.
  const items = menu.categories.flatMap((cat) => cat.items ?? []);
  const found = [];
  let cursor = 0;
  for (const item of items) {
    const name = L(item.name);
    const pos = name ? text.indexOf(name, cursor) : -1;
    if (pos === -1) {
      const elsewhere = name !== '' && text.includes(name);
      c.check(false, `${elsewhere ? 'ORDER' : 'MISSING'} ${item.key} ${short(name)}`);
      continue;
    }
    c.check(true, '');
    found.push({ item, pos });
    cursor = pos + name.length;
  }
  for (let i = 0; i < found.length; i += 1) {
    const { item, pos } = found[i];
    const end = i + 1 < found.length ? found[i + 1].pos : text.length;
    const segment = squash(text.slice(pos, end));

    if (item.priceOnRequest === true) {
      const expected = message(messages, 'menu.priceOnRequest');
      c.check(segment.includes(squash(expected)), `PRICE ${item.key} ${short(expected)}`);
    } else if (Array.isArray(item.prices) && item.prices.length > 0) {
      for (const variant of item.prices) {
        const expected = `${qty(variant)}${eur(variant.price)}`;
        c.check(containsBounded(segment, squash(expected)), `PRICE ${item.key} ${short(expected)}`);
      }
    } else if (typeof item.price === 'number') {
      const expected = eur(item.price);
      c.check(containsBounded(segment, squash(expected)), `PRICE ${item.key} ${short(expected)}`);
    } else {
      c.check(false, `PRICE ${item.key} (no price in menu-2026.json)`);
    }

    for (const badge of item.badges ?? []) {
      const expected = message(messages, `menu.badge.${badge}`);
      c.check(segment.includes(squash(expected)), `BADGE ${item.key} ${short(expected)}`);
    }
    const description = L(item.description);
    if (description) {
      c.check(segment.includes(squash(description)), `DESC ${item.key} ${short(description)}`);
    }
    if (item.nameJp) c.check(segment.includes(squash(item.nameJp)), `JP ${item.key} ${item.nameJp}`);
  }

  // c. page notes and section headings
  for (const key of ['intro', 'allergens', 'serviceIncluded', 'sectionFood', 'sectionDrinks']) {
    const expected = norm(message(messages, `menu.${key}`));
    c.check(text.includes(expected), `NOTE ${key} ${short(expected)}`);
  }

  // d. must be absent
  const formulesTitle = norm(message(messages, 'menu.formulesTitle'));
  for (const absent of ['??', 'Asashi', formulesTitle, ...LEGACY_ABSENT]) {
    c.check(!text.includes(absent), `PRESENT ${absent}`);
  }
  const rawKey = text.match(RAW_KEY_RE);
  c.check(!rawKey, `PRESENT raw message key ${rawKey?.[0] ?? ''}`);
}

function verifyMenuLegacy(text, ctx, locale, c) {
  const service = norm(message(ctx.messages, 'menu.serviceIncluded'));
  for (const present of [LEGACY_PAITAN[locale], 'Menu Gyoza', service]) {
    c.check(text.includes(present), `MISSING ${present}`);
  }
  c.check(!text.includes('??'), 'PRESENT ??');
  const rawKey = text.match(RAW_KEY_RE);
  c.check(!rawKey, `PRESENT raw message key ${rawKey?.[0] ?? ''}`);
}

function verifyHome(text, html, ctx, locale, expect, c) {
  const { menu } = ctx;
  const L = (field) => norm(field?.[locale] ?? field?.fr ?? '');
  if (expect === 'm26') {
    for (const absent of new Set(['Ramen Paitan', 'Ramen Chintan', LEGACY_PAITAN[locale], LEGACY_CHINTAN[locale]])) {
      c.check(!text.includes(absent), `PRESENT ${absent}`);
    }
    for (const cat of menu.categories.slice(0, 3)) {
      const name = L(cat.name);
      c.check(name !== '' && text.includes(name), `CATEGORY ${cat.key} ${short(name)}`);
    }
    const tantan = menu.categories
      .flatMap((cat) => cat.items ?? [])
      .find((item) => item.key === 'tantan-ramen' || item.name?.fr === 'Tantan Ramen');
    if (!tantan || typeof tantan.price !== 'number') {
      c.check(false, 'PRICE tantan-ramen (no single price in menu-2026.json)');
    } else {
      const expected = tantan.price.toFixed(2).replace('.', ',');
      c.check(text.includes(expected), `PRICE tantan-ramen ${expected}`);
    }
  } else {
    for (const present of [LEGACY_PAITAN[locale], '14,90']) {
      c.check(text.includes(present), `MISSING ${present}`);
    }
  }
  c.check(!text.includes('??'), 'PRESENT ??');
  const cards = homeCardImages(html, locale);
  c.check(cards === 3, `HOME_CARD_IMAGES ${cards}/3`);
}

function runChecks(html, ctx, opts) {
  const c = makeChecker();
  const text = toText(html);
  if (opts.home) {
    verifyHome(text, html, ctx, opts.locale, opts.expect, c);
  } else {
    if (opts.expect === 'm26') verifyMenuM26(text, ctx, opts.locale, c);
    else verifyMenuLegacy(text, ctx, opts.locale, c);
    const menuImages = imgTagsWithSanity(html).length;
    c.check(menuImages === 0, `MENU_IMAGES ${menuImages}`);
  }
  return c;
}

// ---------------------------------------------------------------- fetch + main

const isUrl = (target) => /^https?:\/\//i.test(target);

async function load(target) {
  if (isUrl(target)) {
    let res;
    try {
      res = await fetch(target, {
        redirect: 'follow',
        headers: { 'user-agent': 'umai-verify-live/1.0', 'cache-control': 'no-cache' },
        signal: AbortSignal.timeout(60_000),
      });
    } catch (err) {
      throw new UsageError(`fetch ${target}: ${err.cause?.code ?? err.message}`);
    }
    const body = await res.text();
    if (res.status !== 200) throw new UsageError(`fetch ${target}: HTTP ${res.status}`);
    return body;
  }
  try {
    return readFileSync(target, 'utf8');
  } catch (err) {
    throw new UsageError(`cannot read ${target}: ${err.message}`);
  }
}

const wait = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

// Most significant failures first when the output is capped (stable inside a kind).
const SEVERITY = [
  'MISSING',
  'ORDER',
  'PRICE',
  'HOME_CARD_IMAGES',
  'MENU_IMAGES',
  'PRESENT',
  'CATEGORY',
  'BADGE',
  'DESC',
  'NOTE',
  'TEXT',
  'JP',
];
const kindOf = (line) => line.split(' ')[1] ?? '';
const rank = (line) => {
  const at = SEVERITY.indexOf(kindOf(line));
  return at === -1 ? SEVERITY.length : at;
};

function printFailures(failures) {
  const sorted = failures
    .map((line, index) => ({ line, index }))
    .sort((a, b) => rank(a.line) - rank(b.line) || a.index - b.index)
    .map(({ line }) => line);
  for (const line of sorted.slice(0, MAX_FAIL_LINES)) console.log(line);
  if (sorted.length > MAX_FAIL_LINES) console.log(`… ${sorted.length - MAX_FAIL_LINES} more`);
  const kinds = new Map();
  for (const line of failures) kinds.set(kindOf(line), (kinds.get(kindOf(line)) ?? 0) + 1);
  console.log(
    `failures by kind: ${[...kinds].sort((a, b) => rank(`F ${a[0]}`) - rank(`F ${b[0]}`)).map(([k, n]) => `${k}=${n}`).join(' ')}`,
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const ctx = loadContext(opts.locale);
  const attempts = isUrl(opts.target) ? opts.retries + 1 : 1;
  const label = `target=${opts.target} locale=${opts.locale} expect=${opts.expect}${opts.home ? ' home' : ''}`;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const last = attempt === attempts;
    let html;
    try {
      html = await load(opts.target);
    } catch (err) {
      if (!(err instanceof UsageError) || last) throw err;
      console.log(`attempt ${attempt}/${attempts} error: ${err.message}`);
      await wait(opts.interval);
      continue;
    }
    const c = runChecks(html, ctx, opts);
    if (c.failures.length === 0) {
      console.log(`VERIFY OK ${label} checks=${c.checks}`);
      return 0;
    }
    if (!last) {
      const worst = c.failures.reduce((a, b) => (rank(b) < rank(a) ? b : a));
      console.log(`attempt ${attempt}/${attempts} failures=${c.failures.length} (e.g. ${worst})`);
      await wait(opts.interval);
      continue;
    }
    if (attempts > 1) console.log(`attempt ${attempt}/${attempts} failures=${c.failures.length}`);
    printFailures(c.failures);
    console.log(`VERIFY FAILED failures=${c.failures.length} ${label}`);
    return 1;
  }
  return 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`ERROR ${err instanceof UsageError ? err.message : err.stack ?? err}`);
    process.exit(2);
  },
);
