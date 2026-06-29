/**
 * Umaï IG Studio — Brand Design Tokens (BRAND-01)
 *
 * Single source of truth for colors, fonts, logo path, and overlay sizing knobs.
 * Consumed by chip.js and overlay.js.
 *
 * NOTE on fonts: DM Serif Display / Outfit / Noto Sans JP may not be installed
 * system-wide. pango/fontconfig (shipped with sharp's librsvg) will fall back
 * to the listed generic faces — acceptable for v1, refined in Phase 07.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Colors ───────────────────────────────────────────────────────────────────

export const COLORS = {
  ivoire: '#F5F0E8',
  vert:   '#77967A',
  ink:    '#2B2B2B',
  white:  '#FFFFFF',
};

// ─── Fonts ────────────────────────────────────────────────────────────────────

export const FONTS = {
  serif: "'DM Serif Display', Georgia, 'Times New Roman', serif",
  sans:  "'Outfit', 'Helvetica Neue', Arial, sans-serif",
  jp:    "'Noto Sans JP', sans-serif",
};

// ─── Logo source path ─────────────────────────────────────────────────────────

// brand/ is one level under ig-studio/; ig-studio/ is one level under repo root
// → ../../umai_logo_menu.svg
export const LOGO_SRC = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'umai_logo_menu.svg'
);

// ─── Overlay sizing knobs ─────────────────────────────────────────────────────

export const OVERLAY = {
  logoHeightFrac: 0.06,   // logo height as fraction of canvas height
  logoMinPx:      70,     // minimum logo height in pixels
  marginFrac:     0.04,   // margin as fraction of min(width, height)
  logoOpacity:    0.92,   // SVG fill-opacity on the wordmark
  logoFill:       COLORS.ivoire, // light wordmark on dark photo
};
