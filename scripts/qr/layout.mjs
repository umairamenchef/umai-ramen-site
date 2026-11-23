// Phase 15 / Plan 02: page layouts of the QR print files.
//
// Every number is in millimetres, measured from the top-left corner of the FINAL PDF page
// (after scripts/qr/pdftool.py boxes). Used by scripts/qr/print.mjs (HTML positions) and by
// scripts/qr/verify.mjs (where to crop each printed code and which label sits under it).
//
//   a4Layout()               A4 sheet 210 x 297 mm, white, no bleed (office printing):
//                            logo, title, accent rule, 5 tiles of 55.5 mm (module 1.5 mm,
//                            symbol 43.5 mm), label + URL under each, 5-language scan line,
//                            address footer.
//   a6Layout({ bleed = 3 })  A6 table card 105 x 148 mm + bleed on each side (0..5 mm),
//                            ivory to the bleed edge, two identical faces (recto / verso):
//                            logo, accent rule, 5 tiles of 32.56 mm (module 0.88 mm, symbol
//                            25.52 mm), label under each. Safe area = trim inset by 5 mm.
//   validateLayout(layout)   list of problems (empty = printable).
//
// A tile is the full QR SVG of public/qr/ (symbol + 4-module white quiet zone, 37 modules).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  QR_LOCALES,
  QR_MODULES,
  QR_QUIET_ZONE,
  QR_LABELS,
  QR_SCAN_HINTS,
  QR_PRINT_TITLE,
  QR_PRINT_FOOTER,
  QR_TENT_BLEED_MM,
  QR_PDFS,
  qrDisplayUrl,
  qrLabelLang,
} from '../../src/lib/qr.ts';

/** Modules per tile side: symbol + quiet zone on both sides (37). */
export const TILE_MODULES = QR_MODULES + 2 * QR_QUIET_ZONE;

export const LOGO_FILE = join(import.meta.dirname, 'assets', 'umai-logo.svg');

export const COLORS = {
  text: '#1A1A1A',
  muted: '#6B6B6B',
  accent: '#77967A',
  ivory: '#F5F0E8',
  white: '#FFFFFF',
};

const A6_TRIM = { w: 105, h: 148 };
const A6_SAFETY = 5;

const r3 = (v) => Math.round(v * 1000) / 1000;

/** Width / height of the logo, from the viewBox of scripts/qr/assets/umai-logo.svg. */
export function logoRatio() {
  const svg = readFileSync(LOGO_FILE, 'utf8');
  const match = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(svg);
  if (!match) throw new Error(`no viewBox in ${LOGO_FILE}`);
  return Number(match[1]) / Number(match[2]);
}

function fileName(publicPath) {
  return publicPath.split('/').pop();
}

function font(family, weight, pt, extra = {}) {
  return { family, weight, pt, letterSpacingEm: 0, color: COLORS.text, ...extra };
}

function labelFont(locale, pt, zhPt, letterSpacingEm) {
  return locale === 'zh'
    ? font('Noto Sans SC', 600, zhPt, { letterSpacingEm: 0.08 })
    : font('Outfit', 600, pt, { letterSpacingEm });
}

/** Tiles (x, y = top-left) and their labels centred under them. */
function tilesAndLabels(positions, size, label) {
  const tiles = [];
  const labels = [];
  for (const locale of QR_LOCALES) {
    const [x, y] = positions[locale];
    tiles.push({ locale, x: r3(x), y: r3(y), size: r3(size) });
    const entry = {
      locale,
      x: r3(x + size / 2 - label.w / 2),
      y: r3(y + size + label.gap),
      w: label.w,
      text: QR_LABELS[locale],
      lang: qrLabelLang(locale),
      font: labelFont(locale, label.pt, label.zhPt, label.letterSpacingEm),
    };
    if (label.url) entry.url = { text: qrDisplayUrl(locale), font: label.url };
    labels.push(entry);
  }
  return { tiles, labels };
}

export function a4Layout() {
  const page = { w: 210, h: 297 };
  const moduleMm = 1.5;
  const size = TILE_MODULES * moduleMm; // 55.5
  const logoW = 60;
  const { tiles, labels } = tilesAndLabels(
    {
      fr: [13.75, 84],
      en: [77.25, 84],
      de: [140.75, 84],
      it: [45.5, 157.5],
      zh: [109, 157.5],
    },
    size,
    {
      gap: 1.5,
      w: 64,
      pt: 13,
      zhPt: 13.5,
      letterSpacingEm: 0,
      url: font('Outfit', 400, 8.5, { color: COLORS.muted }),
    },
  );
  const hint = (locale) => ({ text: QR_SCAN_HINTS[locale], lang: qrLabelLang(locale) });
  const face = {
    logo: { x: 75, y: 18, w: logoW, h: r3(logoW / logoRatio()) },
    title: { y: 56, text: QR_PRINT_TITLE, font: font('DM Serif Display', 400, 21) },
    rule: { x: 93, y: 70, w: 24, h: 0.7, color: COLORS.accent },
    tiles,
    labels,
    hints: {
      y: 247,
      lineHeight: 1.5,
      font: font('Outfit', 400, 9.5),
      lines: [
        [hint('fr'), hint('en'), hint('de')],
        [hint('it'), hint('zh')],
      ],
    },
    footer: { y: 276, text: QR_PRINT_FOOTER, font: font('Outfit', 400, 9, { color: COLORS.muted }) },
  };
  return {
    id: 'a4',
    file: fileName(QR_PDFS.a4),
    page,
    bleed: 0,
    trim: { x: 0, y: 0, w: page.w, h: page.h },
    safe: { x: 12, y: 12, w: 186, h: 273 },
    background: COLORS.white,
    moduleMm,
    minSymbolMm: 40,
    faces: [face],
  };
}

export function a6Layout({ bleed = QR_TENT_BLEED_MM } = {}) {
  if (typeof bleed !== 'number' || !Number.isFinite(bleed) || bleed < 0 || bleed > 5) {
    throw new RangeError(`A6 bleed must be a number of mm between 0 and 5, got ${bleed}`);
  }
  const b = bleed;
  const page = { w: A6_TRIM.w + 2 * b, h: A6_TRIM.h + 2 * b };
  const moduleMm = 0.88;
  const size = TILE_MODULES * moduleMm; // 32.56 (symbol 25.52)
  const cx = page.w / 2;
  const left = cx - 22.28 - size / 2;
  const right = cx + 22.28 - size / 2;
  const rows = [b + 23, b + 62.5, b + 102];
  const logoW = 30;
  const { tiles, labels } = tilesAndLabels(
    {
      fr: [left, rows[0]],
      en: [right, rows[0]],
      de: [left, rows[1]],
      it: [right, rows[1]],
      zh: [cx - size / 2, rows[2]],
    },
    size,
    { gap: 1.0, w: 44, pt: 8, zhPt: 8.5, letterSpacingEm: 0.02 },
  );
  const face = {
    logo: { x: r3(cx - logoW / 2), y: r3(b + 5.5), w: logoW, h: r3(logoW / logoRatio()) },
    rule: { x: r3(cx - 8), y: r3(b + 20.4), w: 16, h: 0.5, color: COLORS.accent },
    tiles,
    labels,
  };
  return {
    id: 'a6',
    file: fileName(QR_PDFS.tent),
    page,
    bleed: b,
    trim: { x: b, y: b, w: A6_TRIM.w, h: A6_TRIM.h },
    safe: { x: b + A6_SAFETY, y: b + A6_SAFETY, w: A6_TRIM.w - 2 * A6_SAFETY, h: A6_TRIM.h - 2 * A6_SAFETY },
    background: COLORS.ivory,
    moduleMm,
    minSymbolMm: 25,
    faces: [face, structuredClone(face)],
  };
}

const EPS = 1e-6;

function inside(box, safe) {
  return (
    box.x >= safe.x - EPS &&
    box.y >= safe.y - EPS &&
    box.x + box.w <= safe.x + safe.w + EPS &&
    box.y + box.h <= safe.y + safe.h + EPS
  );
}

function fmt(box) {
  return `[${r3(box.x)}, ${r3(box.y)}, ${r3(box.x + box.w)}, ${r3(box.y + box.h)}]`;
}

/** Problems that would make the layout unprintable or a code unreadable; [] when fine. */
export function validateLayout(layout) {
  const problems = [];
  const { safe, moduleMm, minSymbolMm } = layout;
  const symbol = QR_MODULES * moduleMm;
  if (symbol < minSymbolMm - EPS) {
    problems.push(`${layout.id}: symbol ${r3(symbol)} mm < minimum ${minSymbolMm} mm`);
  }
  layout.faces.forEach((face, index) => {
    const where = `${layout.id} face ${index + 1}`;
    if (face.tiles.length !== QR_LOCALES.length) {
      problems.push(`${where}: ${face.tiles.length} tiles, expected ${QR_LOCALES.length}`);
    }
    for (const tile of face.tiles) {
      if (Math.abs(tile.size - TILE_MODULES * moduleMm) > 0.001) {
        problems.push(`${where} ${tile.locale}: tile ${tile.size} mm != ${TILE_MODULES} x ${moduleMm} mm`);
      }
      const box = { x: tile.x, y: tile.y, w: tile.size, h: tile.size };
      if (!inside(box, safe)) problems.push(`${where} ${tile.locale}: tile ${fmt(box)} outside the safe area ${fmt(safe)}`);
    }
    if (!inside(face.logo, safe)) problems.push(`${where}: logo ${fmt(face.logo)} outside the safe area ${fmt(safe)}`);
    if (face.rule && !inside(face.rule, safe)) problems.push(`${where}: rule ${fmt(face.rule)} outside the safe area`);
    for (const label of face.labels) {
      const box = { x: safe.x, y: label.y, w: safe.w, h: 4.5 };
      if (!inside(box, safe)) problems.push(`${where} ${label.locale}: label top ${label.y} (+4.5 mm) outside the safe area`);
    }
    for (const part of ['title', 'hints', 'footer']) {
      if (!face[part]) continue;
      const box = { x: safe.x, y: face[part].y, w: safe.w, h: 4 };
      if (!inside(box, safe)) problems.push(`${where}: ${part} top ${face[part].y} (+4 mm) outside the safe area`);
    }
    for (let i = 0; i < face.tiles.length; i++) {
      for (let j = i + 1; j < face.tiles.length; j++) {
        const a = face.tiles[i];
        const c = face.tiles[j];
        const gap = Math.max(c.x - (a.x + a.size), a.x - (c.x + c.size), c.y - (a.y + a.size), a.y - (c.y + c.size));
        if (gap < 4 - EPS) problems.push(`${where}: tiles ${a.locale} and ${c.locale} are ${r3(gap)} mm apart (< 4 mm)`);
      }
    }
  });
  return problems;
}
