/**
 * Umaï IG Studio — SVG dish-name chip generator (BRAND-03)
 *
 * buildChipSvg({ name, price }) → SVG string: ivoire rounded-rect plate with
 *   vert accent bar, dish name in serif, optional FR price in sans.
 * renderChipPng(opts) → rasterizes the SVG to a transparent PNG Buffer via sharp.
 */

import sharp from 'sharp';
import { COLORS, FONTS } from '../brand/tokens.js';

// ─── Layout constants ─────────────────────────────────────────────────────────

const CHIP_H          = 96;   // chip height in px (was 64, now 1.5×)
const PADDING_X       = 24;   // horizontal padding inside the chip (was 16)
const ACCENT_W        = 6;    // vert left-bar accent width (was 4)
const ACCENT_GAP      = 14;   // gap between accent bar and text (was 10)
const NAME_FONT_SIZE  = 27;   // px — dish name (serif) (was 18, now 1.5×)
const PRICE_FONT_SIZE = 20;   // px — price (sans) (was 13, now ~1.5×)
const PRICE_GAP       = 12;   // gap between name block and price block (was 8)
const NAME_CHAR_W     = 18;   // approx px per char of name (serif 27px) — over-estimate to avoid clipping accented serif glyphs
const PRICE_CHAR_W    = 11;   // approx px per char of price (sans 20px) (was 7.5)
const CORNER_R        = 14;   // corner radius (was 10)
const PRICE_LABEL_EXTRA = 28; // extra width for price currency suffix ' €' (was 20)

// ─── Format price (FR locale: dot → comma + ' €') ─────────────────────────────

function formatPrice(price) {
  const p = typeof price === 'number' ? price : Number(price);
  if (!Number.isFinite(p)) return '';
  return p.toFixed(2).replace('.', ',') + ' €';
}

// ─── Chip width calculation ────────────────────────────────────────────────────

function chipWidth(name, price) {
  const textStart = PADDING_X + ACCENT_W + ACCENT_GAP;
  const nameW = name.length * NAME_CHAR_W;
  const priceW = price != null
    ? PRICE_GAP + (formatPrice(price).length * PRICE_CHAR_W) + PRICE_LABEL_EXTRA
    : 0;
  // Over-estimate width (extra right padding is transparent — harmless; under-estimate clips).
  return Math.max(200, textStart + nameW + priceW + PADDING_X + Math.round(NAME_FONT_SIZE * 0.6));
}

// ─── SVG chip builder ─────────────────────────────────────────────────────────

/**
 * Build a tasteful Umaï branded chip as an SVG string.
 * Ivoire rounded-rect plate, vert accent bar on the left,
 * dish name in DM Serif Display, optional FR price in Outfit.
 *
 * @param {{ name: string, price?: number|null }} opts
 * @returns {string} SVG markup
 */
export function buildChipSvg({ name, price = null }) {
  const w = chipWidth(name, price);
  const h = CHIP_H;

  const textX = PADDING_X + ACCENT_W + ACCENT_GAP;
  const nameCY = Math.round(h * 0.44);          // name baseline — slightly above center
  const priceCY = Math.round(h * 0.44);         // price baseline — same row

  const priceLabel = price != null ? formatPrice(price) : '';

  // Approximate text widths for positioning price after name
  const nameBlockW = name.length * NAME_CHAR_W;
  const priceX = textX + nameBlockW + PRICE_GAP;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <!-- Drop shadow (subtle) -->
  <filter id="cs" x="-5%" y="-10%" width="120%" height="130%">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.18"/>
  </filter>
  <!-- Plate -->
  <rect x="0" y="0" width="${w}" height="${h}" rx="${CORNER_R}" ry="${CORNER_R}"
        fill="${COLORS.ivoire}" filter="url(#cs)"/>
  <!-- Vert accent bar (left) -->
  <rect x="${PADDING_X}" y="${Math.round(h * 0.2)}" width="${ACCENT_W}" height="${Math.round(h * 0.6)}"
        rx="2" ry="2" fill="${COLORS.vert}"/>
  <!-- Dish name (serif, ink) -->
  <text x="${textX}" y="${nameCY}" dominant-baseline="middle"
        font-family="${FONTS.serif}" font-size="${NAME_FONT_SIZE}" fill="${COLORS.ink}"
        font-weight="400" letter-spacing="0.01em">${escSvg(name)}</text>${price != null ? `
  <!-- Price (sans, vert) -->
  <text x="${priceX}" y="${priceCY}" dominant-baseline="middle"
        font-family="${FONTS.sans}" font-size="${PRICE_FONT_SIZE}" fill="${COLORS.vert}"
        font-weight="600">${escSvg(priceLabel)}</text>` : ''}
</svg>`;
}

// ─── SVG text escape ──────────────────────────────────────────────────────────

function escSvg(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── PNG rasterizer ───────────────────────────────────────────────────────────

/**
 * Rasterize a dish-name chip to a transparent PNG Buffer via sharp.
 *
 * @param {{ name: string, price?: number|null }} opts
 * @returns {Promise<Buffer>}
 */
export async function renderChipPng(opts) {
  const svg = buildChipSvg(opts);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ─── Elegant name renderer (logo-name mode) ───────────────────────────────────

/**
 * Greedy-balanced word wrap into at most 2 lines.
 * Short names (≤ 11 chars) stay on one line; longer multi-word names split into
 * two balanced lines so the type can be set large without overflowing the canvas.
 */
function wrapName(name) {
  const clean = String(name ?? '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [clean];
  if (clean.length <= 11) return [clean];
  let best = { lines: [clean], score: Infinity };
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' ');
    const l2 = words.slice(i).join(' ');
    const score = Math.abs(l1.length - l2.length) + Math.max(l1.length, l2.length);
    if (score < best.score) best = { lines: [l1, l2], score };
  }
  return best.lines;
}

/**
 * Build a large, editorial dish-name SVG — ivoire DM Serif Display, no box,
 * with a short vert accent rule and an optional price below. Sized to read at
 * roughly logo scale (Instagram-grade), wrapping long names to two lines and
 * auto-fitting the type so the widest line never exceeds ~66% of the canvas.
 *
 * @param {{ name: string, price?: number|null, canvasWidth?: number,
 *           variant?: 'light'|'dark' }} opts
 *   variant 'light' (default) → ivoire text for dark backgrounds;
 *           'dark' → charcoal text for light backgrounds (auto-contrast).
 * @returns {string} SVG markup
 */
export function buildNameSvg({ name, price = null, canvasWidth = 1080, variant = 'light' }) {
  const lines = wrapName(name);
  const TEXT_FILL = variant === 'dark' ? COLORS.ink : COLORS.ivoire;
  // Shadow: a soft dark halo lifts light text off busy photos; for dark text on a
  // light background a faint light halo keeps edges crisp.
  const SHADOW_COLOR   = variant === 'dark' ? '#FFFFFF' : '#000000';
  const SHADOW_OPACITY = variant === 'dark' ? 0.35 : 0.55;

  // Base type ~8.5% of canvas width (≈ logo presence), auto-fit down if too wide.
  const CHAR_W_FACTOR = 0.6; // approx serif advance per font px
  let FONT_SIZE = Math.max(44, Math.round(canvasWidth * 0.085)); // ~92px @ 1080
  const maxChars = Math.max(...lines.map((l) => l.length), 1);
  const maxLineW = canvasWidth * 0.66;
  const estW = maxChars * FONT_SIZE * CHAR_W_FACTOR;
  if (estW > maxLineW) {
    FONT_SIZE = Math.max(40, Math.floor((FONT_SIZE * maxLineW) / estW));
  }

  const PRICE_SIZE = Math.max(20, Math.round(FONT_SIZE * 0.36));
  const LINE_H     = Math.round(FONT_SIZE * 1.02);
  const PAD        = Math.round(FONT_SIZE * 0.10);
  const SHADOW_BLUR    = Math.max(3, Math.round(FONT_SIZE * 0.06));
  const ACCENT_TOP_GAP = Math.round(FONT_SIZE * 0.26);
  const ACCENT_H       = Math.max(3, Math.round(FONT_SIZE * 0.07));
  const ACCENT_LEN     = Math.round(FONT_SIZE * 1.7);
  const PRICE_GAP      = Math.round(FONT_SIZE * 0.34);

  const hasPrice = price != null;
  const priceLabel = hasPrice ? formatPrice(price) : '';

  const CHAR_W   = FONT_SIZE * CHAR_W_FACTOR;
  const longestW = maxChars * CHAR_W;
  const w = Math.round(
    Math.max(longestW, ACCENT_LEN, hasPrice ? priceLabel.length * PRICE_SIZE * 0.6 : 0)
    + FONT_SIZE * 0.5,
  );

  const firstBaseline = PAD + FONT_SIZE;
  const lastBaseline  = firstBaseline + (lines.length - 1) * LINE_H;
  const accentY       = lastBaseline + ACCENT_TOP_GAP;
  const priceBaseline = accentY + (hasPrice ? PRICE_GAP + PRICE_SIZE : 0);
  const h = Math.round((hasPrice ? priceBaseline : accentY + ACCENT_H) + PAD);

  const textLines = lines.map((ln, i) =>
    `<text x="0" y="${firstBaseline + i * LINE_H}" dominant-baseline="auto" ` +
    `font-family="${FONTS.serif}" font-size="${FONT_SIZE}" fill="${TEXT_FILL}" ` +
    `font-weight="400" letter-spacing="0.01em" filter="url(#ts)">${escSvg(ln)}</text>`,
  ).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <filter id="ts" x="-8%" y="-10%" width="130%" height="155%">
    <feDropShadow dx="0" dy="2" stdDeviation="${SHADOW_BLUR}" flood-color="${SHADOW_COLOR}" flood-opacity="${SHADOW_OPACITY}"/>
  </filter>
  ${textLines}
  <line x1="2" y1="${accentY}" x2="${ACCENT_LEN}" y2="${accentY}" stroke="${COLORS.vert}" stroke-width="${ACCENT_H}" stroke-linecap="round" filter="url(#ts)"/>${hasPrice ? `
  <text x="0" y="${priceBaseline}" dominant-baseline="auto"
        font-family="${FONTS.sans}" font-size="${PRICE_SIZE}" fill="${TEXT_FILL}"
        font-weight="600" letter-spacing="0.01em" filter="url(#ts)">${escSvg(priceLabel)}</text>` : ''}
</svg>`;
}

/**
 * Rasterize the elegant dish name to a transparent PNG Buffer.
 *
 * @param {{ name: string, price?: number|null, canvasWidth?: number }} opts
 * @returns {Promise<Buffer>}
 */
export async function renderNamePng(opts) {
  const svg = buildNameSvg(opts);
  return sharp(Buffer.from(svg)).png().toBuffer();
}
