/**
 * Umaï IG Studio — overlayMode/shotType-driven overlay compositor (BRAND-03, BRAND-04, BRAND-05)
 *
 * applyOverlay(canvasBuffer, dims, entry, kb):
 *   - 'photo-only' mode (or ambiance shotType/slug) → returns the canvas UNCHANGED
 *     (logo:false, chip:false)
 *   - 'packshot' mode → composites a subtle corner Umaï logo (logo:true)
 *               + dish chip at bottom-left:
 *                 · always shown when overlayMode is explicitly 'packshot' (human-chosen) AND label resolves
 *                 · shown when confidence >= 0.7 AND label resolves (legacy AI path)
 *
 * BACKWARD COMPATIBLE: entries without overlayMode/dishName behave exactly as before.
 *
 * Label resolution priority:
 *   entry.dishName (human-supplied) → dishLabel(slug) (legacy KB) → menuLabel(slug) (canonical)
 *
 * BRAND-05: sharp-only pipeline — no Chrome, no network.
 */

import sharp from 'sharp';
import { getLogoOverlayPng } from '../brand/logo.js';
import { renderChipPng } from './chip.js';
import { dishLabel } from './kb.js';
import { menuLabel } from './menu.js';
import { OVERLAY } from '../brand/tokens.js';

const CHIP_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Apply brand overlay to an already-cropped canvas buffer.
 *
 * @param {Buffer} canvasBuffer — PNG buffer of the cropped photo
 * @param {{ width: number, height: number }} dims — canvas dimensions
 * @param {object} entry — classification row; optional fields:
 *   overlayMode?: 'packshot'|'photo-only'
 *   dishName?: string       — human-supplied name (beats slug lookup)
 *   price?: number|null     — human-supplied price
 *   shotType?: string       — legacy field
 *   dishSlug?: string       — slug for label lookup
 *   confidence?: number     — AI confidence (0–1)
 * @param {object} kb — loaded KB (passed through; unused directly — dishLabel re-calls loadKB)
 * @returns {Promise<{ buffer: Buffer, applied: { logo: boolean, chip: boolean } }>}
 */
export async function applyOverlay(canvasBuffer, dims, entry, kb) {
  const { width, height } = dims;

  // ── Resolve mode ────────────────────────────────────────────────────────────
  // Explicit overlayMode wins; fall back to shotType/slug-based detection (legacy).
  const mode = entry.overlayMode ??
    (entry.shotType === 'ambiance' || entry.dishSlug === 'ambiance'
      ? 'photo-only'
      : 'packshot');

  // ── Photo-only: return canvas unchanged ─────────────────────────────────────
  if (mode === 'photo-only') {
    return {
      buffer: canvasBuffer,
      applied: { logo: false, chip: false },
    };
  }

  // ── Packshot: build composite layers ────────────────────────────────────────
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

  // 2. Dish chip (bottom-left) ─────────────────────────────────────────────
  // Resolve label: entry.dishName (human) → dishLabel (legacy KB) → menuLabel (canonical)
  let label = null;
  if (entry.dishName) {
    label = { name: entry.dishName, price: entry.price ?? null };
  } else {
    label = dishLabel(entry.dishSlug) ?? menuLabel(entry.dishSlug) ?? null;
  }

  // Show chip when: label resolves AND (human explicitly chose 'packshot' OR conf >= threshold)
  const conf = typeof entry.confidence === 'number' ? entry.confidence : 0;
  const showChip = label != null &&
    (entry.overlayMode === 'packshot' || conf >= CHIP_CONFIDENCE_THRESHOLD);

  if (showChip) {
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

  // ── Composite all layers ─────────────────────────────────────────────────
  const buffer = await sharp(canvasBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  return { buffer, applied };
}
