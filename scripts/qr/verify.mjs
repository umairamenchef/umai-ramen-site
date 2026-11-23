#!/usr/bin/env node
// Phase 15: decoder gate for the menu QR codes, the automated proxy for « scan it with
// a real phone ».
//
//   node scripts/qr/verify.mjs [--urls]
//
// checkAssets (always), for each locale of src/lib/qr.ts (QR_LOCALES):
//   a. public/qr/umai-menu-{locale}.svg equals, byte for byte,
//      qrSvg(QRCode.create(url, { errorCorrectionLevel: 'Q' }).modules, url): the file is
//      the contract renderer's output and generation is deterministic;
//   b. the SVG rendered by `mutool draw -w 740` (20 px per module) decodes with jsQR to
//      exactly qrMenuUrl(locale) (https://umai-ramen.fr/{locale}/menu), QR version 3;
//   c. the PNG is 1036 x 1036 px (IHDR) and, rendered by `mutool draw -w 1036`, decodes
//      to the same URL, version 3.
// checkUrls (with --urls): GET each qrMenuUrl(locale) on the live site with
//   redirect: 'manual': the status must be 200 (a 3xx is a failure: a printed code must
//   never depend on a redirect), <html lang> must equal qrLabelLang(locale) (zh-Hans for
//   zh) and the page must carry the menu language switcher (data-menu-locale-switcher).
//   Read-only GETs, user agent umai-qr-verify/1.0, 30 s timeout.
//
// Rendering: mutool (MuPDF tools, `brew install mupdf-tools`) draws every file to a
// binary PGM (P5) in a temporary folder removed at the end; gray pixels become RGBA for
// jsQR (inversionAttempts 'dontInvert'). decode() takes an optional pixel crop.
//
// Output: one line per failure (FAIL <locale> <what>: <detail>), then
//   QR VERIFY OK assets=10 checks=<n>           (exit 0; « urls=5 » before checks= with --urls)
//   QR VERIFY FAILED failures=<n>               (exit 1)
// Exit 2: usage error, mutool not found, a file missing (MISSING FILE <path>).
// Node 24 (native type stripping loads src/lib/qr.ts, global fetch). Dependencies:
// qrcode, jsqr (devDependencies).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import QRCode from 'qrcode';
import jsQRModule from 'jsqr';
import {
  QR_LOCALES,
  QR_EC_LEVEL,
  QR_VERSION,
  QR_PNG_SIZE,
  qrMenuUrl,
  qrLabelLang,
  qrAssetPath,
  qrSvg,
} from '../../src/lib/qr.ts';

// jsqr's UMD bundle may come in as { default: jsQR } depending on the CJS interop.
const jsQR = typeof jsQRModule === 'function' ? jsQRModule : jsQRModule.default;

const ROOT = join(import.meta.dirname, '..', '..');
const TIMEOUT_MS = 30_000;
const USER_AGENT = 'umai-qr-verify/1.0';
const SVG_RENDER_PX = 740;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

class UsageError extends Error {}
class PrerequisiteError extends Error {}

const failures = [];
let checks = 0;
let tmp = null;

function check(ok, line) {
  checks++;
  if (!ok) failures.push(line);
  return ok;
}

function rel(path) {
  return path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path;
}

function assetFile(locale, kind) {
  return join(ROOT, 'public', qrAssetPath(locale, kind));
}

/** Renders `input` with `mutool draw -q <args>` and returns { width, height, gray }. */
function renderPgm(input, args, name) {
  const out = join(tmp, `${name}.pgm`);
  const res = spawnSync('mutool', ['draw', '-q', ...args, '-o', out, input], { encoding: 'utf8' });
  if (res.status !== 0 || !existsSync(out)) {
    throw new Error(`mutool draw failed on ${rel(input)}: ${(res.stderr || '').trim() || `status ${res.status}`}`);
  }
  return parsePgm(readFileSync(out), out);
}

/** Binary PGM: `P5 <width> <height> 255` then width x height gray bytes. */
function parsePgm(buf, label = 'pgm') {
  const header = /^P5\s+(\d+)\s+(\d+)\s+255\s/.exec(buf.subarray(0, 64).toString('latin1'));
  if (!header) throw new Error(`${label}: not a binary 8-bit PGM`);
  const width = Number(header[1]);
  const height = Number(header[2]);
  const gray = buf.subarray(header[0].length, header[0].length + width * height);
  if (gray.length !== width * height) throw new Error(`${label}: truncated pixel data`);
  return { width, height, gray };
}

/**
 * Decodes a gray image (optionally cropped to { x, y, w, h } in pixels, clamped to the
 * image) with jsQR. Returns jsQR's result ({ data, version, location }) or null; the
 * location is relative to the crop.
 */
function decode(img, crop) {
  const x0 = Math.max(0, Math.round(crop?.x ?? 0));
  const y0 = Math.max(0, Math.round(crop?.y ?? 0));
  const x1 = Math.min(img.width, Math.round(crop ? crop.x + crop.w : img.width));
  const y1 = Math.min(img.height, Math.round(crop ? crop.y + crop.h : img.height));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0) return null;
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const row = (y0 + y) * img.width + x0;
    for (let x = 0; x < w; x++) {
      const v = img.gray[row + x];
      const o = (y * w + x) * 4;
      rgba[o] = v;
      rgba[o + 1] = v;
      rgba[o + 2] = v;
      rgba[o + 3] = 255;
    }
  }
  return jsQR(rgba, w, h, { inversionAttempts: 'dontInvert' });
}

/** Width and height from the PNG IHDR chunk, or null when the file is not a PNG. */
function pngSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** URL and version of a decode result against the locale's contract. */
function checkDecoded(locale, what, result) {
  const url = qrMenuUrl(locale);
  if (!check(result !== null, `${locale} ${what}: no QR code found`)) return;
  check(result.data === url, `${locale} ${what}: decodes to ${JSON.stringify(result.data)}, expected ${url}`);
  check(
    result.version === QR_VERSION,
    `${locale} ${what}: QR version ${result.version}, expected ${QR_VERSION}`,
  );
}

function checkPrerequisites() {
  const probe = spawnSync('mutool', ['-v'], { encoding: 'utf8' });
  if (probe.error) throw new PrerequisiteError('ERROR mutool not found (brew install mupdf-tools)');
  for (const locale of QR_LOCALES) {
    for (const kind of ['svg', 'png']) {
      const file = assetFile(locale, kind);
      if (!existsSync(file)) throw new PrerequisiteError(`MISSING FILE ${rel(file)}`);
    }
  }
}

function checkAssets() {
  for (const locale of QR_LOCALES) {
    const url = qrMenuUrl(locale);

    // a. byte-identical regeneration of the SVG
    const svgPath = assetFile(locale, 'svg');
    const expected = qrSvg(QRCode.create(url, { errorCorrectionLevel: QR_EC_LEVEL }).modules, url);
    check(
      readFileSync(svgPath, 'utf8') === expected,
      `${locale} svg content: ${rel(svgPath)} differs from qrSvg() of ${url} (run node scripts/qr/generate.mjs)`,
    );

    // b. the SVG decodes
    checkDecoded(locale, 'svg decode', decode(renderPgm(svgPath, ['-w', String(SVG_RENDER_PX)], `${locale}-svg`)));

    // c. the PNG has the contract size and decodes
    const pngPath = assetFile(locale, 'png');
    const size = pngSize(pngPath);
    check(
      size !== null && size.width === QR_PNG_SIZE && size.height === QR_PNG_SIZE,
      `${locale} png size: ${size ? `${size.width}x${size.height}` : 'not a PNG'}, expected ${QR_PNG_SIZE}x${QR_PNG_SIZE}`,
    );
    checkDecoded(locale, 'png decode', decode(renderPgm(pngPath, ['-w', String(QR_PNG_SIZE)], `${locale}-png`)));
  }
}

async function checkUrls() {
  for (const locale of QR_LOCALES) {
    const url = qrMenuUrl(locale);
    let res;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      check(false, `${locale} url: GET ${url} failed (${error.cause?.code ?? error.message})`);
      continue;
    }
    const location = res.headers.get('location');
    if (!check(res.status === 200, `${locale} url: GET ${url} answered ${res.status}${location ? ` -> ${location}` : ''}, expected 200 with no redirect`)) {
      continue;
    }
    const body = await res.text();
    const lang = /<html[^>]*\slang="([^"]+)"/.exec(body)?.[1] ?? null;
    check(lang === qrLabelLang(locale), `${locale} url: <html lang> is ${JSON.stringify(lang)}, expected ${qrLabelLang(locale)}`);
    check(body.includes('data-menu-locale-switcher'), `${locale} url: ${url} has no data-menu-locale-switcher (not the menu page?)`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== '--urls');
  if (unknown.length > 0) {
    throw new UsageError(`unknown argument ${unknown[0]} (usage: node scripts/qr/verify.mjs [--urls])`);
  }
  const withUrls = args.includes('--urls');

  checkPrerequisites();
  tmp = mkdtempSync(join(tmpdir(), 'umai-qr-verify-'));
  try {
    checkAssets();
    if (withUrls) await checkUrls();
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    for (const line of failures) console.log(`FAIL ${line}`);
    console.log(`QR VERIFY FAILED failures=${failures.length}`);
    return 1;
  }
  const assets = QR_LOCALES.length * 2;
  console.log(`QR VERIFY OK assets=${assets}${withUrls ? ` urls=${QR_LOCALES.length}` : ''} checks=${checks}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    if (error instanceof PrerequisiteError) {
      console.log(error.message);
    } else {
      console.error(`ERROR ${error instanceof UsageError ? error.message : (error.stack ?? error)}`);
    }
    process.exit(2);
  },
);
