/**
 * Umaï IG Studio — Logo overlay rasterizer (BRAND-02)
 *
 * Reads umai_logo_menu.svg, injects ivoire fill + opacity,
 * and rasterizes to a transparent PNG via sharp (no Chrome).
 *
 * --emit mode: writes brand/assets/umai-logo-overlay.png at height 120 (committed asset).
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOGO_SRC, OVERLAY, COLORS } from './tokens.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SVG viewBox original dimensions
const SVG_ORIG_W = 128;
const SVG_ORIG_H = 44;

// Per-height memoization cache
const _cache = new Map();

/**
 * Rasterize the Umaï wordmark SVG to a transparent PNG Buffer at the given height.
 * The wordmark is recolored to ivoire (#F5F0E8) at OVERLAY.logoOpacity opacity.
 * Width is computed preserving the original aspect ratio.
 *
 * @param {{ height?: number }} [opts]
 * @returns {Promise<Buffer>}
 */
export async function getLogoOverlayPng({ height = 120 } = {}) {
  if (_cache.has(height)) return _cache.get(height);

  const width = Math.round(height * SVG_ORIG_W / SVG_ORIG_H);

  // Read the committed SVG
  const svgSrc = readFileSync(LOGO_SRC, 'utf-8');

  // Inject ivoire fill + opacity into the root <svg> tag.
  // The original paths have no explicit fill (default black) — we override at the root.
  const svg = svgSrc.replace(
    '<svg',
    `<svg fill="${COLORS.ivoire}" fill-opacity="${OVERLAY.logoOpacity}"`
  );

  const buffer = await sharp(Buffer.from(svg))
    .resize({ width, height })
    .png()
    .toBuffer();

  _cache.set(height, buffer);
  return buffer;
}

// ─── --emit mode ──────────────────────────────────────────────────────────────

if (import.meta.url === (new URL(process.argv[1], 'file://')).href) {
  const args = process.argv.slice(2);
  if (args.includes('--emit')) {
    const EMIT_HEIGHT = 120;
    const assetsDir = resolve(__dirname, 'assets');
    mkdirSync(assetsDir, { recursive: true });

    const outPath = resolve(assetsDir, 'umai-logo-overlay.png');
    const buf = await getLogoOverlayPng({ height: EMIT_HEIGHT });
    writeFileSync(outPath, buf);

    const meta = await sharp(buf).metadata();
    console.log(`[brand:logo] Written: ${outPath}`);
    console.log(`[brand:logo] ${meta.width}×${meta.height} px, alpha=${meta.hasAlpha}, format=${meta.format}`);
  }
}
