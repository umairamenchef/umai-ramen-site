#!/usr/bin/env node
// Phase 15 / Plan 02: the fonts of the QR print files (A4 sheet, A6 table card).
//
//   node scripts/qr/fetch-fonts.mjs           download the 4 fonts + 3 licences, write fonts.json
//   node scripts/qr/fetch-fonts.mjs --check   offline: files, sha256, TTF magic, CJK subset text
//
// Fonts (static TrueType, written to scripts/qr/fonts/):
//   Outfit 400 + 600           -> Outfit-400.ttf, Outfit-600.ttf (labels, URLs, hints, footer)
//   DM Serif Display 400       -> DMSerifDisplay-400.ttf (A4 title)
//   Noto Sans SC 600 (subset)  -> NotoSansSC-600-subset.ttf, exactly the glyphs of
//                                 qrPrintCjkChars() of src/lib/qr.ts (中文菜单, 用手机相机扫码, 菜单)
// Source: the Google Fonts CSS API (https://fonts.googleapis.com/css2?family=...) asked with a
// non-browser user agent (curl/8.7.1), which answers one @font-face per request with a static
// .ttf URL on fonts.gstatic.com (the Noto request uses &text= to get a few-KB subset).
// Licence: SIL Open Font License 1.1, redistributed with their OFL texts (OFL-*.txt, from
// https://raw.githubusercontent.com/google/fonts/main/ofl/<family>/OFL.txt).
// fonts.json records family, weight, file, bytes, sha256, source (CSS URL), url (font file)
// and, for Noto, the subset text. When the print strings of src/lib/qr.ts gain a new CJK
// character, --check fails (FONTS STALE) until this script is re-run.
//
// Exit codes: 0 = FONTS OK, 1 = a check failed (FONTS STALE / FONTS FAILED), 2 = usage or
// network error. Node 24 (global fetch, native type stripping loads src/lib/qr.ts).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { qrPrintCjkChars } from '../../src/lib/qr.ts';

export const FONTS_DIR = join(import.meta.dirname, 'fonts');
export const MANIFEST = join(FONTS_DIR, 'fonts.json');

const CSS_API = 'https://fonts.googleapis.com/css2';
const USER_AGENT = 'curl/8.7.1';
const TIMEOUT_MS = 30_000;
const TTF_MAGIC = Buffer.from([0x00, 0x01, 0x00, 0x00]);

/** The four fonts, in manifest order. */
export function fontSpecs() {
  const cjk = qrPrintCjkChars();
  return [
    { family: 'Outfit', weight: 400, file: 'Outfit-400.ttf', source: `${CSS_API}?family=Outfit:wght@400` },
    { family: 'Outfit', weight: 600, file: 'Outfit-600.ttf', source: `${CSS_API}?family=Outfit:wght@600` },
    { family: 'DM Serif Display', weight: 400, file: 'DMSerifDisplay-400.ttf', source: `${CSS_API}?family=DM+Serif+Display` },
    {
      family: 'Noto Sans SC',
      weight: 600,
      file: 'NotoSansSC-600-subset.ttf',
      source: `${CSS_API}?family=Noto+Sans+SC:wght@600&text=${encodeURIComponent(cjk)}`,
      text: cjk,
    },
  ];
}

export const LICENSES = [
  { file: 'OFL-Outfit.txt', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt' },
  { file: 'OFL-DMSerifDisplay.txt', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmserifdisplay/OFL.txt' },
  { file: 'OFL-NotoSansSC.txt', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt' },
];

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Offline consistency check of scripts/qr/fonts/ (also used by print.mjs before printing).
 * Returns { problems: string[], fonts: [{ family, weight, file, path }] }.
 */
export function checkFonts() {
  const problems = [];
  if (!existsSync(MANIFEST)) {
    return { problems: [`missing ${MANIFEST}`], fonts: [] };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (error) {
    return { problems: [`fonts.json is not valid JSON (${error.message})`], fonts: [] };
  }
  const entries = Array.isArray(manifest.fonts) ? manifest.fonts : [];
  const specs = fontSpecs();
  const fonts = [];
  for (const spec of specs) {
    const entry = entries.find((e) => e.file === spec.file);
    if (!entry) {
      problems.push(`fonts.json has no entry for ${spec.file}`);
      continue;
    }
    const path = join(FONTS_DIR, spec.file);
    if (!existsSync(path)) {
      problems.push(`missing font file ${spec.file}`);
      continue;
    }
    const buf = readFileSync(path);
    if (!buf.subarray(0, 4).equals(TTF_MAGIC)) problems.push(`${spec.file} is not a TrueType font (magic)`);
    if (sha256(buf) !== entry.sha256) problems.push(`${spec.file} sha256 differs from fonts.json`);
    if (entry.family !== spec.family || entry.weight !== spec.weight) {
      problems.push(`${spec.file} is recorded as ${entry.family} ${entry.weight}, expected ${spec.family} ${spec.weight}`);
    }
    if (spec.text !== undefined && entry.text !== spec.text) {
      problems.push(`${spec.file} subset text ${JSON.stringify(entry.text)} != qrPrintCjkChars() ${JSON.stringify(spec.text)}`);
    }
    fonts.push({ family: spec.family, weight: spec.weight, file: spec.file, path });
  }
  if (entries.length !== specs.length) problems.push(`fonts.json lists ${entries.length} fonts, expected ${specs.length}`);
  for (const license of LICENSES) {
    const path = join(FONTS_DIR, license.file);
    if (!existsSync(path)) problems.push(`missing licence ${license.file}`);
    else if (!readFileSync(path, 'utf8').includes('SIL Open Font License')) problems.push(`${license.file} is not an OFL text`);
  }
  return { problems, fonts };
}

class UsageError extends Error {}
class NetworkError extends Error {}

async function get(url) {
  let res;
  try {
    res = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new NetworkError(`GET ${url} failed (${error.cause?.code ?? error.message})`);
  }
  if (res.status !== 200) throw new NetworkError(`GET ${url} answered ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function download() {
  mkdirSync(FONTS_DIR, { recursive: true });
  const failures = [];
  const manifest = { license: 'SIL OFL 1.1 (see OFL-*.txt)', fonts: [] };
  for (const spec of fontSpecs()) {
    const css = (await get(spec.source)).toString('utf8');
    const urls = [...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/g)].map((m) => m[1]);
    if (urls.length !== 1) {
      failures.push(`${spec.file}: expected exactly one truetype src in ${spec.source}, found ${urls.length}`);
      continue;
    }
    const buf = await get(urls[0]);
    if (!buf.subarray(0, 4).equals(TTF_MAGIC)) {
      failures.push(`${spec.file}: ${urls[0]} is not a TrueType font (first bytes ${buf.subarray(0, 4).toString('hex')})`);
      continue;
    }
    writeFileSync(join(FONTS_DIR, spec.file), buf);
    const entry = {
      family: spec.family,
      weight: spec.weight,
      file: spec.file,
      bytes: buf.length,
      sha256: sha256(buf),
      source: spec.source,
      url: urls[0],
    };
    if (spec.text !== undefined) entry.text = spec.text;
    manifest.fonts.push(entry);
    console.log(`FONT ${spec.file} ${buf.length} bytes sha256 ${entry.sha256.slice(0, 12)}`);
  }
  for (const license of LICENSES) {
    const text = (await get(license.url)).toString('utf8');
    if (!text.includes('SIL Open Font License')) {
      failures.push(`${license.file}: ${license.url} is not an OFL text`);
      continue;
    }
    writeFileSync(join(FONTS_DIR, license.file), text);
  }
  if (failures.length > 0) {
    for (const line of failures) console.log(`FAIL ${line}`);
    console.log(`FONTS FAILED failures=${failures.length}`);
    return 1;
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  const { problems } = checkFonts();
  if (problems.length > 0) {
    for (const line of problems) console.log(`FAIL ${line}`);
    console.log(`FONTS FAILED failures=${problems.length}`);
    return 1;
  }
  console.log(`FONTS OK files=${manifest.fonts.length} licenses=${LICENSES.length}`);
  return 0;
}

function check() {
  const { problems, fonts } = checkFonts();
  if (problems.length > 0) {
    for (const line of problems) console.log(`FAIL ${line}`);
    console.log('FONTS STALE: run node scripts/qr/fetch-fonts.mjs');
    return 1;
  }
  console.log(`FONTS OK files=${fonts.length} licenses=${LICENSES.length} (check)`);
  return 0;
}

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== '--check');
  if (unknown.length > 0) {
    throw new UsageError(`unknown argument ${unknown[0]} (usage: node scripts/qr/fetch-fonts.mjs [--check])`);
  }
  return args.includes('--check') ? check() : download();
}

// Run only as a CLI (print.mjs imports checkFonts from this file).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      const known = error instanceof UsageError || error instanceof NetworkError;
      console.error(`ERROR ${known ? error.message : (error.stack ?? error)}`);
      process.exit(2);
    },
  );
}
