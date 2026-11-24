#!/usr/bin/env node
// Phase 15: decoder gate for the menu QR codes and their print files, the automated proxy
// for « scan it with a real phone ».
//
//   node scripts/qr/verify.mjs [--urls] [--verbose]
//
// checkAssets (always), for each locale of src/lib/qr.ts (QR_LOCALES):
//   a. public/qr/umai-menu-{locale}.svg equals, byte for byte,
//      qrSvg(QRCode.create(url, { errorCorrectionLevel: 'Q' }).modules, url): the file is
//      the contract renderer's output and generation is deterministic;
//   b. the SVG rendered by `mutool draw -w 740` (20 px per module) decodes with jsQR to
//      exactly qrMenuUrl(locale) (https://umai-ramen.fr/{locale}/menu), QR version 3;
//   c. the PNG is 1036 x 1036 px (IHDR) and, rendered by `mutool draw -w 1036`, decodes
//      to the same URL, version 3.
// checkPdfs (always): the A4 sheet and the A6 card of QR_PDFS (pdfFiles=2, 1 + 2 pages,
//   pdfCodes=15) and the Exaprint bleed variants of QR_TENT_VARIANTS (variants=2, 2 pages
//   each, variantCodes=20):
//   - python3 scripts/qr/pdftool.py check <pdf> --kind a4|a6 [--bleed-mm B] must pass
//     (boxes, vector only, embedded OFL fonts only, labels, safe area); its FAIL lines are
//     repeated here;
//   - pdftool.py info gives the TrimBox inset (bleed) -> a4Layout() / a6Layout({ bleed })
//     of scripts/qr/layout.mjs says where each tile is;
//   - every page is rendered at 300 dpi (mutool) and each tile, cropped with a 3 mm margin,
//     must decode to its own qrMenuUrl(locale), version 3; the symbol width (mean width and
//     height of the dark-pixel box found around jsQR's location: the finder patterns touch
//     the 4 symbol edges; jsQR's extrapolated corners were seen 0.4 mm off, so they only
//     locate the code) must be >= the layout minimum and within 0.4 mm of 29 modules
//     (A4 43.5 mm, A6 25.52 mm); in the band between that symbol box enlarged by 0.75 and
//     by 3.5 modules, >= 99.5 % of the pixels must be white (>= 250): the 4-module quiet
//     zone is there;
//   - the text span whose top lies within [tile bottom, + 6 mm] and whose centre is inside
//     the tile's x range is QR_LABELS[locale]; on the A4 the span within
//     [tile bottom + 4, + 12 mm] in that column is qrDisplayUrl(locale).
// checkUrls (with --urls): GET each qrMenuUrl(locale) on the live site with
//   redirect: 'manual': the status must be 200 (a 3xx is a failure: a printed code must
//   never depend on a redirect), <html lang> must equal qrLabelLang(locale) (zh-Hans for
//   zh) and the page must carry the menu language switcher (data-menu-locale-switcher).
//   Read-only GETs, user agent umai-qr-verify/1.0, 30 s timeout.
// --verbose prints one CODE line per printed code (decoded URL, symbol width, quiet zone).
//
// Rendering: mutool (MuPDF tools, `brew install mupdf-tools`) draws every file to a
// binary PGM (P5) in a temporary folder removed at the end; gray pixels become RGBA for
// jsQR (inversionAttempts 'dontInvert'). decode() takes an optional pixel crop.
//
// Output: one line per failure (FAIL <locale or file> <what>: <detail>), then
//   QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15 variants=2 variantCodes=20 checks=<n>
//   (exit 0; with --urls « urls=5 » comes right after pdfCodes=15), or
//   QR VERIFY FAILED failures=<n> (exit 1).
// Exit 2: usage error, mutool or python3 (PyMuPDF + pypdf) missing, a file missing
// (MISSING FILE <path>).
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
  QR_MODULES,
  QR_PNG_SIZE,
  QR_LABELS,
  QR_PDFS,
  QR_TENT_BLEED_MM,
  QR_TENT_VARIANTS,
  qrMenuUrl,
  qrDisplayUrl,
  qrLabelLang,
  qrAssetPath,
  qrSvg,
} from '../../src/lib/qr.ts';
import { a4Layout, a6Layout } from './layout.mjs';

// jsqr's UMD bundle may come in as { default: jsQR } depending on the CJS interop.
const jsQR = typeof jsQRModule === 'function' ? jsQRModule : jsQRModule.default;

const ROOT = join(import.meta.dirname, '..', '..');
const PDFTOOL = join(import.meta.dirname, 'pdftool.py');
const TIMEOUT_MS = 30_000;
const USER_AGENT = 'umai-qr-verify/1.0';
const SVG_RENDER_PX = 740;
const PDF_DPI = 300;
const PX_PER_MM = PDF_DPI / 25.4;
const CROP_MARGIN_MM = 3;
const SYMBOL_TOLERANCE_MM = 0.4;
const QUIET_INNER_MODULES = 0.75;
const QUIET_OUTER_MODULES = 3.5;
const QUIET_MIN_WHITE = 0.995;
const WHITE = 250;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

class UsageError extends Error {}
class PrerequisiteError extends Error {}

const failures = [];
let checks = 0;
let tmp = null;
let verbose = false;

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

/** The print files: the two of QR_PDFS, then the A6 bleed variants. */
function pdfFiles() {
  return [
    { kind: 'a4', path: join(ROOT, 'public', QR_PDFS.a4), bleed: 0, variant: false },
    { kind: 'a6', path: join(ROOT, 'public', QR_PDFS.tent), bleed: QR_TENT_BLEED_MM, variant: false },
    ...QR_TENT_VARIANTS.map((v) => ({ kind: 'a6', path: join(ROOT, 'public', v.path), bleed: v.bleedMm, variant: true })),
  ];
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

/** Renders every page of a PDF at PDF_DPI; returns one gray image per page. */
function renderPdfPages(pdf, name, count) {
  const res = spawnSync('mutool', ['draw', '-q', '-r', String(PDF_DPI), '-o', join(tmp, `${name}-%d.pgm`), pdf], {
    encoding: 'utf8',
  });
  if (res.status !== 0) throw new Error(`mutool draw failed on ${rel(pdf)}: ${(res.stderr || '').trim()}`);
  const pages = [];
  for (let i = 1; i <= count; i++) {
    const file = join(tmp, `${name}-${i}.pgm`);
    if (!existsSync(file)) throw new Error(`mutool draw wrote no page ${i} for ${rel(pdf)}`);
    pages.push(parsePgm(readFileSync(file), file));
  }
  return pages;
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

/** Integer pixel crop { x, y, w, h } clamped to the image. */
function clampCrop(img, crop) {
  const x0 = Math.max(0, Math.round(crop?.x ?? 0));
  const y0 = Math.max(0, Math.round(crop?.y ?? 0));
  const x1 = Math.min(img.width, Math.round(crop ? crop.x + crop.w : img.width));
  const y1 = Math.min(img.height, Math.round(crop ? crop.y + crop.h : img.height));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Decodes a gray image (optionally cropped to { x, y, w, h } in pixels, clamped to the
 * image) with jsQR. Returns jsQR's result ({ data, version, location }) or null; the
 * location is relative to the crop.
 */
function decode(img, crop) {
  const { x: x0, y: y0, w, h } = clampCrop(img, crop);
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
  if (!check(result !== null, `${locale} ${what}: no QR code found`)) return false;
  const urlOk = check(result.data === url, `${locale} ${what}: decodes to ${JSON.stringify(result.data)}, expected ${url}`);
  const versionOk = check(
    result.version === QR_VERSION,
    `${locale} ${what}: QR version ${result.version}, expected ${QR_VERSION}`,
  );
  return urlOk && versionOk;
}

function python(args) {
  return spawnSync('python3', [PDFTOOL, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function checkPrerequisites() {
  const probe = spawnSync('mutool', ['-v'], { encoding: 'utf8' });
  if (probe.error) throw new PrerequisiteError('ERROR mutool not found (brew install mupdf-tools)');
  const py = spawnSync('python3', ['-c', 'import fitz, pypdf'], { encoding: 'utf8' });
  if (py.error || py.status !== 0) {
    throw new PrerequisiteError('ERROR python3 with PyMuPDF and pypdf not found (python3 -m pip install --user pymupdf pypdf)');
  }
  const files = [];
  for (const locale of QR_LOCALES) files.push(assetFile(locale, 'svg'), assetFile(locale, 'png'));
  for (const pdf of pdfFiles()) files.push(pdf.path);
  for (const file of files) {
    if (!existsSync(file)) throw new PrerequisiteError(`MISSING FILE ${rel(file)}`);
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

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const r2 = (v) => Math.round(v * 100) / 100;

/** Share of white pixels (>= WHITE) in `outer` minus `inner` (image pixel boxes x0, y0, x1, y1). */
function whiteShare(img, outer, inner) {
  let total = 0;
  let white = 0;
  const x0 = Math.max(0, Math.floor(outer.x0));
  const y0 = Math.max(0, Math.floor(outer.y0));
  const x1 = Math.min(img.width, Math.ceil(outer.x1));
  const y1 = Math.min(img.height, Math.ceil(outer.y1));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (x >= inner.x0 && x < inner.x1 && y >= inner.y0 && y < inner.y1) continue;
      total++;
      if (img.gray[y * img.width + x] >= WHITE) white++;
    }
  }
  return total === 0 ? 0 : white / total;
}

/**
 * Bounding box (image pixels, x1/y1 exclusive) of the dark pixels (< 128) inside `region`,
 * or null. Around a decoded symbol this is the symbol itself: its three finder patterns
 * touch the four symbol edges, and the quiet zone around it is white.
 */
function darkBox(img, region) {
  const rx0 = Math.max(0, Math.floor(region.x0));
  const ry0 = Math.max(0, Math.floor(region.y0));
  const rx1 = Math.min(img.width, Math.ceil(region.x1));
  const ry1 = Math.min(img.height, Math.ceil(region.y1));
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let y = ry0; y < ry1; y++) {
    for (let x = rx0; x < rx1; x++) {
      if (img.gray[y * img.width + x] >= 128) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < x0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/** Spans of `spans` (top-left mm) whose top is in [top, bottom] and centre in [x0, x1]. */
function spansIn(spans, top, bottom, x0, x1) {
  return spans.filter((s) => {
    const cx = (s.bbox[0] + s.bbox[2]) / 2;
    return s.bbox[1] >= top && s.bbox[1] <= bottom && cx >= x0 && cx <= x1;
  });
}

/** One printed code: decode, symbol size, quiet zone, label (and URL on the A4). */
function checkPrintedCode(name, pageNo, layout, tile, img, spans) {
  const where = `${name} p${pageNo}`;
  const crop = clampCrop(img, {
    x: (tile.x - CROP_MARGIN_MM) * PX_PER_MM,
    y: (tile.y - CROP_MARGIN_MM) * PX_PER_MM,
    w: (tile.size + 2 * CROP_MARGIN_MM) * PX_PER_MM,
    h: (tile.size + 2 * CROP_MARGIN_MM) * PX_PER_MM,
  });
  const result = decode(img, crop);
  checkDecoded(tile.locale, `${where} decode`, result);

  let symbolMm = null;
  let cornerMm = null;
  let quiet = null;
  if (result) {
    // jsQR's corners are extrapolated from the finder-pattern centres (seen up to 0.4 mm
    // off at 300 dpi): they only locate the symbol. Its size is measured on the pixels.
    const loc = result.location;
    const cornerPx = (dist(loc.topLeftCorner, loc.topRightCorner) + dist(loc.topLeftCorner, loc.bottomLeftCorner)) / 2;
    cornerMm = cornerPx / PX_PER_MM;
    const corners = [loc.topLeftCorner, loc.topRightCorner, loc.bottomLeftCorner, loc.bottomRightCorner];
    const xs = corners.map((p) => p.x + crop.x);
    const ys = corners.map((p) => p.y + crop.y);
    const located = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    const modulePx = layout.moduleMm * PX_PER_MM;
    const grow = (b, d) => ({ x0: b.x0 - d, y0: b.y0 - d, x1: b.x1 + d, y1: b.y1 + d });
    const box = darkBox(img, grow(located, 2 * modulePx));

    const expected = QR_MODULES * layout.moduleMm;
    if (check(box !== null, `${tile.locale} ${where} symbol: no dark pixel around the decoded code`)) {
      symbolMm = (box.x1 - box.x0 + (box.y1 - box.y0)) / 2 / PX_PER_MM;
      check(
        symbolMm >= layout.minSymbolMm,
        `${tile.locale} ${where} symbol: ${r2(symbolMm)} mm < minimum ${layout.minSymbolMm} mm`,
      );
      check(
        Math.abs(symbolMm - expected) <= SYMBOL_TOLERANCE_MM,
        `${tile.locale} ${where} symbol: ${r2(symbolMm)} mm, expected ${r2(expected)} +/- ${SYMBOL_TOLERANCE_MM} mm`,
      );
      quiet = whiteShare(img, grow(box, QUIET_OUTER_MODULES * modulePx), grow(box, QUIET_INNER_MODULES * modulePx));
      check(
        quiet >= QUIET_MIN_WHITE,
        `${tile.locale} ${where} quiet zone: ${r2(quiet * 100)} % white between ${QUIET_INNER_MODULES} and ${QUIET_OUTER_MODULES} modules around the symbol, expected >= ${QUIET_MIN_WHITE * 100} %`,
      );
    }
  }

  const tileBottom = tile.y + tile.size;
  const label = spansIn(spans, tileBottom, tileBottom + 6, tile.x, tile.x + tile.size);
  const labelText = label.map((s) => s.text.trim());
  check(
    labelText.length === 1 && labelText[0] === QR_LABELS[tile.locale],
    `${tile.locale} ${where} label: text under the code is ${JSON.stringify(labelText)}, expected ${JSON.stringify(QR_LABELS[tile.locale])}`,
  );
  let urlText = null;
  if (layout.id === 'a4') {
    urlText = spansIn(spans, tileBottom + 4, tileBottom + 12, tile.x, tile.x + tile.size).map((s) => s.text.trim());
    check(
      urlText.length === 1 && urlText[0] === qrDisplayUrl(tile.locale),
      `${tile.locale} ${where} url line: ${JSON.stringify(urlText)}, expected ${JSON.stringify(qrDisplayUrl(tile.locale))}`,
    );
  }
  if (verbose) {
    console.log(
      `CODE ${where} ${tile.locale} data=${result ? result.data : 'none'} v${result ? result.version : '-'} ` +
        `symbol=${symbolMm === null ? '-' : r2(symbolMm)}mm (expected ${r2(QR_MODULES * layout.moduleMm)}, ` +
        `jsQR corners ${cornerMm === null ? '-' : r2(cornerMm)}) ` +
        `quiet=${quiet === null ? '-' : r2(quiet * 100)}% label=${JSON.stringify(labelText.join(' | '))}` +
        (urlText ? ` url=${JSON.stringify(urlText.join(' | '))}` : ''),
    );
  }
}

function checkPdfs() {
  const stats = { pdfFiles: 0, pdfCodes: 0, variants: 0, variantCodes: 0 };
  pdfFiles().forEach((file, index) => {
    const name = rel(file.path);
    if (file.variant) stats.variants++;
    else stats.pdfFiles++;

    const args = ['check', file.path, '--kind', file.kind];
    if (file.kind === 'a6') args.push('--bleed-mm', String(file.bleed));
    const res = python(args);
    if (!check(res.status === 0, `${name} pdf check: pdftool.py check exited ${res.status}`)) {
      for (const line of `${res.stdout}\n${res.stderr}`.split('\n')) {
        if (line.startsWith('FAIL ') || line.startsWith('ERROR ')) failures.push(`${name} pdf check: ${line.replace(/^FAIL /, '')}`);
      }
    }

    const info = python(['info', file.path]);
    if (!check(info.status === 0, `${name} info: pdftool.py info exited ${info.status} ${info.stdout.trim()}`)) return;
    const pages = JSON.parse(info.stdout).pages;
    const bleed = file.kind === 'a4' ? 0 : pages[0].trim_mm[0];
    const layout = file.kind === 'a4' ? a4Layout() : a6Layout({ bleed });
    if (!check(pages.length === layout.faces.length, `${name} pages: ${pages.length}, expected ${layout.faces.length}`)) return;

    const images = renderPdfPages(file.path, `pdf${index}`, pages.length);
    layout.faces.forEach((face, p) => {
      for (const tile of face.tiles) {
        checkPrintedCode(name, p + 1, layout, tile, images[p], pages[p].spans);
        if (file.variant) stats.variantCodes++;
        else stats.pdfCodes++;
      }
    });
  });
  return stats;
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
  const unknown = args.filter((a) => a !== '--urls' && a !== '--verbose');
  if (unknown.length > 0) {
    throw new UsageError(`unknown argument ${unknown[0]} (usage: node scripts/qr/verify.mjs [--urls] [--verbose])`);
  }
  const withUrls = args.includes('--urls');
  verbose = args.includes('--verbose');

  checkPrerequisites();
  tmp = mkdtempSync(join(tmpdir(), 'umai-qr-verify-'));
  let stats;
  try {
    checkAssets();
    stats = checkPdfs();
    if (withUrls) await checkUrls();
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    for (const line of failures) console.log(`FAIL ${line}`);
    console.log(`QR VERIFY FAILED failures=${failures.length}`);
    return 1;
  }
  const parts = [`assets=${QR_LOCALES.length * 2}`, `pdfFiles=${stats.pdfFiles}`, `pdfCodes=${stats.pdfCodes}`];
  if (withUrls) parts.push(`urls=${QR_LOCALES.length}`);
  parts.push(`variants=${stats.variants}`, `variantCodes=${stats.variantCodes}`, `checks=${checks}`);
  console.log(`QR VERIFY OK ${parts.join(' ')}`);
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
