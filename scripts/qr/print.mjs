#!/usr/bin/env node
// Phase 15 / Plan 02: prints the QR print files (vector PDF) from HTML with headless Chromium.
//
//   node scripts/qr/print.mjs [--only a4|a6] [--bleed <mm>] [--out <file>] [--keep-html <dir>]
//
// Without options it writes the committed files of public/qr/:
//   umai-qr-a4.pdf                 A4 sheet 210 x 297 mm, 1 page, white (office printing)
//   umai-qr-chevalet-a6.pdf        A6 table card, 2 identical pages (recto / verso), 3 mm bleed:
//                                  page 111 x 154 mm, TrimBox 105 x 148 mm inset 3 mm
//   umai-qr-chevalet-a6-fp1mm.pdf  the same card with a 1 mm bleed (Exaprint flyers)
//   umai-qr-chevalet-a6-fp2mm.pdf  the same card with a 2 mm bleed (other Exaprint products)
// Options:
//   --only a4|a6       only the A4 sheet, or only the three A6 files
//   --bleed <mm>       A6 bleed, 0 to 5 mm; needs --only a6 and --out (the public/qr/ names
//                      carry their bleed, so an ad-hoc bleed never overwrites them)
//   --out <file>       needs --only: writes that single file instead of public/qr/, e.g.
//                      node scripts/qr/print.mjs --only a6 --bleed 2 --out ~/Desktop/chevalet-fp2.pdf
//   --keep-html <dir>  keeps the generated HTML there (to inspect it or print it by hand)
//
// Pipeline: scripts/qr/layout.mjs positions (mm) -> one HTML document per file (fonts from
// scripts/qr/fonts/ through @font-face file:// URLs, the QR SVG files of public/qr/ and the
// logo scripts/qr/assets/umai-logo.svg inlined, so everything stays vector) -> Chromium
// --print-to-pdf -> python3 scripts/qr/pdftool.py boxes (exact MediaBox / TrimBox / BleedBox,
// metadata). The codes are the very files the /menu/qr page offers: no second QR encoder.
//
// Prerequisites (exit 2 with a message when missing): Chromium (QR_CHROME env, else the
// Playwright Chromium headless shell / Chrome for Testing 1228, else Google Chrome),
// python3 with PyMuPDF + pypdf, the fonts of scripts/qr/fonts/fonts.json (sha256 and CJK
// subset text, as node scripts/qr/fetch-fonts.mjs --check), the 5 public/qr/umai-menu-*.svg,
// the logo, a layout without problems (validateLayout).
// Output: PRINT OK <id> -> <file> (<size>, ...) per file, exit 0; PRINT FAILED ... exit 1.
// Checked by: python3 scripts/qr/pdftool.py check, node scripts/qr/verify.mjs.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { QR_LOCALES, QR_PDFS, QR_TENT_BLEED_MM, QR_TENT_VARIANTS, qrAssetPath } from '../../src/lib/qr.ts';
import { a4Layout, a6Layout, validateLayout, LOGO_FILE, COLORS } from './layout.mjs';
import { checkFonts } from './fetch-fonts.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const PDFTOOL = join(import.meta.dirname, 'pdftool.py');
const CHROME_TIMEOUT_MS = 120_000;
const CHROME_CANDIDATES = [
  '~/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-x64/chrome-headless-shell',
  '~/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const TITLES = {
  a4: 'Umaï Ramen · QR codes du menu (A4)',
  a6: 'Umaï Ramen · Chevalet QR A6 recto verso',
};

class UsageError extends Error {}
class PrerequisiteError extends Error {}
class PrintError extends Error {}

function expandHome(path) {
  return path === '~' || path.startsWith('~/') ? join(homedir(), path.slice(1)) : path;
}

function shown(path) {
  const rel = relative(ROOT, path);
  return rel.startsWith('..') ? path : rel;
}

function mm(value) {
  return `${Math.round(value * 1000) / 1000}mm`;
}

function num(value) {
  return String(Math.round(value * 100) / 100);
}

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Options and prerequisites
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { only: null, bleed: null, out: null, keepHtml: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new UsageError(`${arg} needs a value`);
      return v;
    };
    if (arg === '--only') opts.only = value();
    else if (arg === '--bleed') opts.bleed = value();
    else if (arg === '--out') opts.out = value();
    else if (arg === '--keep-html') opts.keepHtml = value();
    else throw new UsageError(`unknown argument ${arg}`);
  }
  if (opts.only !== null && opts.only !== 'a4' && opts.only !== 'a6') {
    throw new UsageError(`--only must be a4 or a6, got ${opts.only}`);
  }
  if (opts.out !== null && opts.only === null) throw new UsageError('--out needs --only a4 or --only a6');
  if (opts.bleed !== null) {
    if (opts.only !== 'a6') throw new UsageError('--bleed applies to the A6 card only (--only a6)');
    if (opts.out === null) {
      throw new UsageError('--bleed needs --out: public/qr/ holds the 3 mm card and its 1 / 2 mm variants under fixed names');
    }
    const bleed = Number(opts.bleed);
    if (!/^\d+(\.\d+)?$/.test(opts.bleed) || bleed > 5) throw new UsageError(`--bleed must be 0 to 5 (mm), got ${opts.bleed}`);
    opts.bleed = bleed;
  }
  return opts;
}

function findChrome() {
  const candidates = [process.env.QR_CHROME, ...CHROME_CANDIDATES].filter(Boolean).map(expandHome);
  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    throw new PrerequisiteError(
      `Chromium not found (set QR_CHROME, or install Playwright's Chromium: npx playwright install chromium). Tried: ${candidates.join(' | ')}`,
    );
  }
  return found;
}

function checkPrerequisites(targets) {
  const chrome = findChrome();
  const py = spawnSync('python3', ['-c', 'import fitz, pypdf'], { encoding: 'utf8' });
  if (py.error || py.status !== 0) {
    throw new PrerequisiteError('python3 with PyMuPDF and pypdf is required (python3 -m pip install --user pymupdf pypdf)');
  }
  const { problems, fonts } = checkFonts();
  if (problems.length > 0) {
    throw new PrerequisiteError(`${problems.join('; ')}. FONTS STALE: run node scripts/qr/fetch-fonts.mjs`);
  }
  for (const locale of QR_LOCALES) {
    const svg = join(ROOT, 'public', qrAssetPath(locale, 'svg'));
    if (!existsSync(svg)) throw new PrerequisiteError(`missing ${shown(svg)} (run node scripts/qr/generate.mjs)`);
  }
  if (!existsSync(LOGO_FILE)) throw new PrerequisiteError(`missing ${shown(LOGO_FILE)} (run python3 scripts/qr/extract-logo.py)`);
  for (const target of targets) {
    const problems = validateLayout(target.layout);
    if (problems.length > 0) throw new PrerequisiteError(`layout ${target.layout.id}: ${problems.join('; ')}`);
  }
  return { chrome, fonts };
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

/** SVG markup to inline: no XML prolog, and no width/height on the root (CSS sizes it). */
function inlineSvg(path) {
  return readFileSync(path, 'utf8')
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<!DOCTYPE[^>]*>\s*/gi, '')
    .replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(width|height)="[^"]*"/g, ''))
    .trim();
}

function fontCss(font) {
  return (
    `font-family: '${font.family}'; font-weight: ${font.weight}; font-size: ${font.pt}pt; ` +
    `letter-spacing: ${font.letterSpacingEm}em; color: ${font.color};`
  );
}

/** Text with every CJK run (code point >= U+2E80) set in Noto Sans SC 600, lang zh-Hans. */
function richText(text) {
  let html = '';
  let run = '';
  let cjk = null;
  const flush = () => {
    if (!run) return;
    html += cjk
      ? `<span lang="zh-Hans" style="font-family: 'Noto Sans SC'; font-weight: 600">${esc(run)}</span>`
      : esc(run);
    run = '';
  };
  for (const ch of text) {
    const isCjk = ch.codePointAt(0) >= 0x2e80;
    if (cjk !== null && isCjk !== cjk) flush();
    cjk = isCjk;
    run += ch;
  }
  flush();
  return html;
}

function box(x, y, w, h) {
  return `left: ${mm(x)}; top: ${mm(y)}; width: ${mm(w)};${h === undefined ? '' : ` height: ${mm(h)};`}`;
}

function faceHtml(layout, face, qrSvgs, logoSvg) {
  const out = [];
  const { page } = layout;
  out.push(`<div class="abs art" style="${box(face.logo.x, face.logo.y, face.logo.w, face.logo.h)}">${logoSvg}</div>`);
  if (face.rule) {
    const r = face.rule;
    out.push(`<div class="abs" style="${box(r.x, r.y, r.w, r.h)} background: ${r.color}"></div>`);
  }
  if (face.title) {
    out.push(
      `<div class="abs line" style="${box(0, face.title.y, page.w)} ${fontCss(face.title.font)}">${richText(face.title.text)}</div>`,
    );
  }
  for (const tile of face.tiles) {
    out.push(`<div class="abs art" data-qr="${tile.locale}" style="${box(tile.x, tile.y, tile.size, tile.size)}">${qrSvgs[tile.locale]}</div>`);
  }
  for (const label of face.labels) {
    const url = label.url
      ? `<div class="url" lang="en" style="${fontCss(label.url.font)}">${esc(label.url.text)}</div>`
      : '';
    out.push(
      `<div class="abs label" style="${box(label.x, label.y, label.w)}">` +
        `<div class="name" lang="${label.lang}" style="${fontCss(label.font)}">${esc(label.text)}</div>${url}</div>`,
    );
  }
  if (face.hints) {
    const sep = '<span class="sep"> · </span>';
    const lines = face.hints.lines
      .map((parts) => `<div>${parts.map((p) => `<span lang="${p.lang}">${richText(p.text)}</span>`).join(sep)}</div>`)
      .join('');
    out.push(
      `<div class="abs line" style="${box(0, face.hints.y, page.w)} ${fontCss(face.hints.font)} line-height: ${face.hints.lineHeight}">${lines}</div>`,
    );
  }
  if (face.footer) {
    out.push(
      `<div class="abs line" style="${box(0, face.footer.y, page.w)} ${fontCss(face.footer.font)}">${richText(face.footer.text)}</div>`,
    );
  }
  return out.join('\n');
}

function buildHtml(layout, fonts) {
  const { page, background } = layout;
  const qrSvgs = Object.fromEntries(
    QR_LOCALES.map((locale) => [locale, inlineSvg(join(ROOT, 'public', qrAssetPath(locale, 'svg')))]),
  );
  const logoSvg = inlineSvg(LOGO_FILE);
  const faces = layout.faces
    .map((face) => `<section class="face">\n${faceHtml(layout, face, qrSvgs, logoSvg)}\n</section>`)
    .join('\n');
  const fontFaces = fonts
    .map(
      (f) =>
        `@font-face { font-family: '${f.family}'; font-style: normal; font-weight: ${f.weight}; ` +
        `src: url('${pathToFileURL(f.path).href}') format('truetype'); }`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(layout.id === 'a4' ? TITLES.a4 : TITLES.a6)}</title>
<style>
${fontFaces}
@page { size: ${mm(page.w)} ${mm(page.h)}; margin: 0; }
html { background: ${background}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-synthesis: none; -webkit-font-smoothing: antialiased; }
.face { position: relative; width: ${mm(page.w)}; height: ${mm(page.h)}; overflow: hidden; break-after: page; background: ${background}; }
.face:last-child { break-after: auto; }
.abs { position: absolute; }
.art svg { display: block; width: 100%; height: 100%; }
.line { text-align: center; white-space: nowrap; line-height: 1.2; color: ${COLORS.text}; }
.label { text-align: center; white-space: nowrap; }
.label .name, .label .url { line-height: 1.25; }
</style>
</head>
<body>
${faces}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

function run(cmd, args, timeout = CHROME_TIMEOUT_MS) {
  return spawnSync(cmd, args, { encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 });
}

function printOne(target, env) {
  const { layout, out } = target;
  const name = basename(out).replace(/\.pdf$/i, '');
  const htmlDir = env.keepHtml ?? env.work;
  const htmlPath = join(htmlDir, `${name}.html`);
  writeFileSync(htmlPath, buildHtml(layout, env.fonts));

  const raw = join(env.work, `${name}.chromium.pdf`);
  const chrome = run(env.chrome, [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${join(env.work, 'profile')}`,
    '--no-pdf-header-footer',
    '--virtual-time-budget=5000',
    `--print-to-pdf=${raw}`,
    pathToFileURL(htmlPath).href,
  ]);
  // Chromium may print harmless « CVDisplayLinkCreateWithCGDisplay failed » lines: judge by the file.
  if (!existsSync(raw) || statSync(raw).size <= 1000) {
    const why = chrome.error ? chrome.error.message : (chrome.stderr || '').trim().split('\n').slice(-3).join(' | ');
    throw new PrintError(`${layout.id} -> ${shown(out)}: Chromium wrote no PDF (${why || `status ${chrome.status}`})`);
  }

  const title = layout.id === 'a4' || layout.bleed === QR_TENT_BLEED_MM ? TITLES[layout.id] : `${TITLES.a6} (fond perdu ${num(layout.bleed)} mm)`;
  mkdirSync(resolve(out, '..'), { recursive: true });
  const boxes = run('python3', [
    PDFTOOL,
    'boxes',
    raw,
    out,
    '--width-mm',
    String(layout.page.w),
    '--height-mm',
    String(layout.page.h),
    '--bleed-mm',
    String(layout.bleed),
    '--title',
    title,
  ]);
  if (boxes.status !== 0) {
    throw new PrintError(`${layout.id} -> ${shown(out)}: pdftool.py boxes failed (${(boxes.stdout + boxes.stderr).trim()})`);
  }

  const info = run('python3', [PDFTOOL, 'info', out]);
  if (info.status !== 0) throw new PrintError(`${layout.id} -> ${shown(out)}: pdftool.py info failed (${info.stdout.trim()})`);
  const pages = JSON.parse(info.stdout).pages;
  if (pages.length !== layout.faces.length) {
    throw new PrintError(`${layout.id} -> ${shown(out)}: ${pages.length} pages, expected ${layout.faces.length} (content overflow?)`);
  }
  for (const p of pages) {
    if (Math.abs(p.media_mm[0] - layout.page.w) > 0.01 || Math.abs(p.media_mm[1] - layout.page.h) > 0.01) {
      throw new PrintError(`${layout.id} -> ${shown(out)}: page ${p.media_mm.join('x')} mm, expected ${layout.page.w}x${layout.page.h}`);
    }
  }

  const n = pages.length;
  const size = `${num(layout.page.w)}x${num(layout.page.h)} mm`;
  const detail =
    layout.id === 'a4'
      ? `${size}, ${n} page${n > 1 ? 's' : ''}`
      : `${size}, trim ${num(layout.trim.w)}x${num(layout.trim.h)}, bleed ${num(layout.bleed)} mm, ${n} pages`;
  console.log(`PRINT OK ${layout.id} -> ${shown(out)} (${detail})`);
}

function targetsFor(opts) {
  if (opts.out !== null) {
    const layout = opts.only === 'a4' ? a4Layout() : a6Layout({ bleed: opts.bleed ?? QR_TENT_BLEED_MM });
    return [{ layout, out: resolve(expandHome(opts.out)) }];
  }
  const list = [];
  if (opts.only !== 'a6') list.push({ layout: a4Layout(), out: join(ROOT, 'public', QR_PDFS.a4) });
  if (opts.only !== 'a4') {
    list.push({ layout: a6Layout({ bleed: QR_TENT_BLEED_MM }), out: join(ROOT, 'public', QR_PDFS.tent) });
    for (const variant of QR_TENT_VARIANTS) {
      list.push({ layout: a6Layout({ bleed: variant.bleedMm }), out: join(ROOT, 'public', variant.path) });
    }
  }
  return list;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const targets = targetsFor(opts);
  const { chrome, fonts } = checkPrerequisites(targets);
  let keepHtml = null;
  if (opts.keepHtml !== null) {
    keepHtml = resolve(expandHome(opts.keepHtml));
    mkdirSync(keepHtml, { recursive: true });
  }
  const work = mkdtempSync(join(tmpdir(), 'umai-qr-print-'));
  try {
    for (const target of targets) printOne(target, { chrome, fonts, work, keepHtml });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  if (keepHtml) console.log(`HTML kept in ${keepHtml}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    if (error instanceof PrintError) {
      console.log(`PRINT FAILED ${error.message}`);
      process.exit(1);
    }
    if (error instanceof UsageError) {
      console.error(
        `ERROR ${error.message} (usage: node scripts/qr/print.mjs [--only a4|a6] [--bleed <mm>] [--out <file>] [--keep-html <dir>])`,
      );
    } else if (error instanceof PrerequisiteError || error instanceof RangeError) {
      console.error(`ERROR ${error.message}`);
    } else {
      console.error(`ERROR ${error.stack ?? error}`);
    }
    process.exit(2);
  },
);
