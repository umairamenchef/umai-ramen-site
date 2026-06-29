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
const NAME_CHAR_W     = 16;   // approx px per char of name (serif 27px) (was 11)
const PRICE_CHAR_W    = 11;   // approx px per char of price (sans 20px) (was 7.5)
const CORNER_R        = 14;   // corner radius (was 10)
const PRICE_LABEL_EXTRA = 28; // extra width for price currency suffix ' €' (was 20)

// ─── Format price (FR locale: dot → comma + ' €') ─────────────────────────────

function formatPrice(price) {
  return price.toFixed(2).replace('.', ',') + ' €';
}

// ─── Chip width calculation ────────────────────────────────────────────────────

function chipWidth(name, price) {
  const textStart = PADDING_X + ACCENT_W + ACCENT_GAP;
  const nameW = name.length * NAME_CHAR_W;
  const priceW = price != null
    ? PRICE_GAP + (formatPrice(price).length * PRICE_CHAR_W) + PRICE_LABEL_EXTRA
    : 0;
  return Math.max(160, textStart + nameW + priceW + PADDING_X);
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
