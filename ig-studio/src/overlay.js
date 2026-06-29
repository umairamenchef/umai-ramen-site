/**
 * Umaï IG Studio — shotType-driven overlay compositor (BRAND-03, BRAND-04, BRAND-05)
 *
 * applyOverlay(canvasBuffer, dims, entry, kb):
 *   - ambiance → returns the canvas UNCHANGED (logo:false, chip:false)
 *   - packshot → composites a subtle corner Umaï logo (logo:true)
 *               + dish chip at bottom-left ONLY when confidence >= 0.7 (chip:true|false)
 *
 * BRAND-05: sharp-only pipeline — no Chrome, no network.
 */

import sharp from 'sharp';
import { getLogoOverlayPng } from '../brand/logo.js';
import { renderChipPng } from './chip.js';
import { dishLabel } from './kb.js';
import { OVERLAY } from '../brand/tokens.js';

const CHIP_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Apply brand overlay to an already-cropped canvas buffer.
 *
 * @param {Buffer} canvasBuffer — PNG buffer of the cropped photo
 * @param {{ width: number, height: number }} dims — canvas dimensions
 * @param {{ shotType: string, dishSlug: string, confidence: number }} entry — classification row
 * @param {object} kb — loaded KB (passed through, unused directly here — dishLabel re-calls loadKB internally)
 * @returns {Promise<{ buffer: Buffer, applied: { logo: boolean, chip: boolean } }>}
 */
export async function applyOverlay(canvasBuffer, dims, entry, kb) {
  const { width, height } = dims;

  // ── Ambiance: photo-only, no overlay ──────────────────────────────────────
  if (entry.shotType === 'ambiance' || entry.dishSlug === 'ambiance') {
    return {
      buffer: canvasBuffer,
      applied: { logo: false, chip: false },
    };
  }

  // ── Packshot: build composite layers ─────────────────────────────────────
  const margin = Math.round(Math.min(width, height) * OVERLAY.marginFrac);
  const composites = [];
  const applied = { logo: false, chip: false };

  // 1. Corner logo (top-right) ─────────────────────────────────────────────
  const logoH = Math.max(OVERLAY.logoMinPx, Math.round(height * OVERLAY.logoHeightFrac));
  const logoPng = await getLogoOverlayPng({ height: logoH });
  const logoMeta = await sharp(logoPng).metadata();
  const logoW = logoMeta.width;

  composites.push({
    input: logoPng,
    top: margin,
    left: width - logoW - margin,
  });
  applied.logo = true;

  // 2. Dish chip (bottom-left) — only when conf >= threshold ───────────────
  const conf = typeof entry.confidence === 'number' ? entry.confidence : 0;
  if (conf >= CHIP_CONFIDENCE_THRESHOLD && entry.dishSlug !== 'ambiance') {
    const label = dishLabel(entry.dishSlug);
    if (label) {
      const chipPng = await renderChipPng({ name: label.name, price: label.price });
      const chipMeta = await sharp(chipPng).metadata();
      const chipH = chipMeta.height;

      composites.push({
        input: chipPng,
        top: height - chipH - margin,
        left: margin,
      });
      applied.chip = true;
    }
  }

  // ── Composite all layers ─────────────────────────────────────────────────
  const buffer = await sharp(canvasBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  return { buffer, applied };
}
