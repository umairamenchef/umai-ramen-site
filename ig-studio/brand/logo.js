/**
 * Umaï IG Studio — Logo overlay rasterizer (BRAND-02)
 *
 * Reads umai_logo_menu.svg, injects fill color + opacity + a subtle drop shadow,
 * and rasterizes to a transparent PNG via sharp (no Chrome).
 *
 * Variants:
 *   'light' — ivoire #F5F0E8 wordmark (original; legible on dark backgrounds)
 *   'dark'  — charcoal #1C1C1C wordmark (legible on light/cream backgrounds)
 *
 * Both variants include a soft drop shadow for legibility on busy/medium backgrounds.
 *
 * --emit mode: writes brand/assets/umai-logo-overlay-{variant}.png at height 120.
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOGO_SRC, OVERLAY, COLORS } from './tokens.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SVG viewBox original dimensions (fixed — matches umai_logo_menu.svg viewBox)
export const SVG_ORIG_W = 128;
export const SVG_ORIG_H = 44;

/** Fill colors keyed by variant */
const VARIANT_FILL = {
  light: COLORS.ivoire,
  dark:  COLORS.charcoal,
};

/**
 * Build an SVG filter string that adds a subtle drop shadow.
 * Uses SourceAlpha-based feGaussianBlur (well-supported in librsvg).
 * The shadow is a semi-transparent black regardless of logo variant —
 * it's subtle enough to be tasteful on all backgrounds.
 */
function buildShadowFilter() {
  return (
    `<filter id="umai-shadow" x="-15%" y="-25%" width="130%" height="150%" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="blur"/>` +
    `<feFlood flood-color="#000000" flood-opacity="0.28" result="shadowFlood"/>` +
    `<feComposite in="shadowFlood" in2="blur" operator="in" result="shadowColored"/>` +
    `<feMerge><feMergeNode in="shadowColored"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>`
  );
}

// Per-(height, variant) memoization cache
const _cache = new Map();

/**
 * Rasterize the Umaï wordmark SVG to a transparent PNG Buffer at the given height.
 * The wordmark is recolored to the chosen variant fill at OVERLAY.logoOpacity opacity.
 * A subtle drop shadow is baked into the SVG before rasterization.
 * Width is computed preserving the original aspect ratio.
 *
 * @param {{ height?: number, variant?: 'light' | 'dark' }} [opts]
 * @returns {Promise<Buffer>}
 */
export async function getLogoOverlayPng({ height = 120, variant = 'light' } = {}) {
  const cacheKey = `${height}:${variant}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  const width = Math.round(height * SVG_ORIG_W / SVG_ORIG_H);
  const fillColor = VARIANT_FILL[variant] ?? COLORS.ivoire;

  // Read the committed SVG
  const svgSrc = readFileSync(LOGO_SRC, 'utf-8');

  // Replace once, warning if the anchor isn't found (makes a lost-shadow regression visible).
  const applyReplace = (str, pattern, replacement, label) => {
    const next = str.replace(pattern, replacement);
    if (next === str) {
      console.warn(`[brand:logo] drop-shadow injection no-op: "${label}" anchor not matched in SVG`);
    }
    return next;
  };

  // 1. Inject fill + opacity into the root <svg> tag
  let svg = applyReplace(
    svgSrc,
    /<svg/,
    `<svg fill="${fillColor}" fill-opacity="${OVERLAY.logoOpacity}"`,
    '<svg',
  );

  // 2. Inject the drop shadow filter into existing <defs> (whitespace-tolerant anchor)
  svg = applyReplace(svg, /<defs>/, `<defs>${buildShadowFilter()}`, '<defs>');

  // 3. Apply the filter to the outermost content <g> (right after </defs>), whitespace-tolerant.
  //    The SVG structure is: <svg><defs>...</defs><g>...</g></svg>
  svg = applyReplace(svg, /<\/defs>\s*<g>/, '</defs><g filter="url(#umai-shadow)">', '</defs><g>');

  const buffer = await sharp(Buffer.from(svg))
    .resize({ width, height })
    .png()
    .toBuffer();

  _cache.set(cacheKey, buffer);
  return buffer;
}

/** Clear the logo cache (useful in tests). */
export function clearLogoCache() {
  _cache.clear();
}

// ─── --emit mode ──────────────────────────────────────────────────────────────

if (import.meta.url === (new URL(process.argv[1], 'file://')).href) {
  const args = process.argv.slice(2);
  if (args.includes('--emit')) {
    const EMIT_HEIGHT = 120;
    const assetsDir = resolve(__dirname, 'assets');
    mkdirSync(assetsDir, { recursive: true });

    for (const variant of ['light', 'dark']) {
      const outPath = resolve(assetsDir, `umai-logo-overlay-${variant}.png`);
      const buf = await getLogoOverlayPng({ height: EMIT_HEIGHT, variant });
      writeFileSync(outPath, buf);

      const meta = await sharp(buf).metadata();
      console.log(`[brand:logo] Written: ${outPath}`);
      console.log(`[brand:logo] ${meta.width}×${meta.height} px, alpha=${meta.hasAlpha}, format=${meta.format}`);
    }

    // Also emit the legacy filename for backward compat (= light variant)
    const legacyPath = resolve(assetsDir, 'umai-logo-overlay.png');
    const legacyBuf = await getLogoOverlayPng({ height: EMIT_HEIGHT, variant: 'light' });
    writeFileSync(legacyPath, legacyBuf);
    console.log(`[brand:logo] Written (legacy): ${legacyPath}`);
  }
}
