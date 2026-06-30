/**
 * Umaï IG Studio — Overlay compositor (BRAND-03, BRAND-04, BRAND-05)
 *
 * applyOverlay(canvasBuffer, dims, entry, kb):
 *
 * Three explicit overlay modes (entry.overlayMode):
 *   'photo-only'  — nothing drawn; canvas returned unchanged (also the forced default for
 *                   ambiance shotType/slug)
 *   'logo-only'   — Umaï wordmark composited at the chosen corner & size only (default for
 *                   dish photos when overlayMode is not explicitly set)
 *   'logo-name'   — wordmark + elegant ivoire serif dish name (no beige box), optional price
 *
 * Backward compat: legacy value 'packshot' is silently treated as 'logo-name'.
 *
 * Tuning knobs (all in entry):
 *   logoPosition?: 'top-left'|'top-right'|'bottom-left'|'bottom-right'  (default 'top-right')
 *   logoSize?:     'small'|'medium'|'large'                              (default 'medium')
 *   showPrice?:    boolean                                                (default false)
 *
 * Label resolution (logo-name only):
 *   entry.dishName (human-supplied) → dishLabel(slug) → menuLabel(slug) → null (no name drawn)
 *
 * BRAND-05: sharp-only pipeline — no Chrome, no network.
 */

import sharp from 'sharp';
import { getLogoOverlayPng } from '../brand/logo.js';
import { renderNamePng } from './chip.js';
import { dishLabel } from './kb.js';
import { menuLabel } from './menu.js';
import { OVERLAY } from '../brand/tokens.js';

// ─── Logo size multipliers ────────────────────────────────────────────────────

const SIZE_FRAC = { small: 0.65, medium: 1.0, large: 1.5 };

// ─── Logo position: normalized x/y model ─────────────────────────────────────

/**
 * Legacy enum → normalized center map (backward compat).
 * These intentionally differ slightly from the 9-preset grid values so old
 * entries can be detected as "not matching a preset exactly".
 */
const LEGACY_ENUM_MAP = {
  'top-left':     { cx: 0.12, cy: 0.10 },
  'top-right':    { cx: 0.88, cy: 0.10 },
  'bottom-left':  { cx: 0.12, cy: 0.90 },
  'bottom-right': { cx: 0.88, cy: 0.90 },
};

/**
 * Resolve logo center from entry.
 * Priority: logoPosX/logoPosY → legacy logoPosition enum → default top-right.
 *
 * @param {object} entry
 * @returns {{ cx: number, cy: number }} — normalized center in [0,1]
 */
function resolveLogoPosNorm(entry) {
  if (typeof entry.logoPosX === 'number' && typeof entry.logoPosY === 'number') {
    return { cx: entry.logoPosX, cy: entry.logoPosY };
  }
  if (entry.logoPosition && LEGACY_ENUM_MAP[entry.logoPosition]) {
    return LEGACY_ENUM_MAP[entry.logoPosition];
  }
  // Default: upper-right (matches top-right preset {0.88, 0.12})
  return { cx: 0.85, cy: 0.12 };
}

/**
 * Compute top/left pixel coordinates from a normalized center {cx, cy},
 * clamping so the entire logo stays within the canvas minus margin.
 *
 * @param {{ cx: number, cy: number, logoW: number, logoH: number,
 *           canvasW: number, canvasH: number, margin: number }} opts
 * @returns {{ top: number, left: number }}
 */
function logoCoordsXY({ cx, cy, logoW, logoH, canvasW, canvasH, margin }) {
  const rawLeft = Math.round(cx * canvasW - logoW / 2);
  const rawTop  = Math.round(cy * canvasH - logoH / 2);

  const minLeft = margin;
  const maxLeft = canvasW - logoW - margin;
  const minTop  = margin;
  const maxTop  = canvasH - logoH - margin;

  return {
    left: Math.max(minLeft, Math.min(maxLeft, rawLeft)),
    top:  Math.max(minTop,  Math.min(maxTop,  rawTop)),
  };
}

// ─── applyOverlay ─────────────────────────────────────────────────────────────

/**
 * Apply brand overlay to an already-cropped canvas buffer.
 *
 * @param {Buffer} canvasBuffer — PNG buffer of the cropped photo
 * @param {{ width: number, height: number }} dims — canvas dimensions
 * @param {object} entry — classification row; optional fields:
 *   overlayMode?: 'photo-only'|'logo-only'|'logo-name'|'packshot' (compat)
 *   dishName?: string       — human-supplied name
 *   price?: number|null
 *   showPrice?: boolean     — default false
 *   shotType?: string       — legacy field
 *   dishSlug?: string
 *   confidence?: number
 *   logoPosition?: string   — corner, default 'top-right'
 *   logoSize?: string       — 'small'|'medium'|'large', default 'medium'
 * @param {object} kb — loaded KB (unused directly; passed for future use)
 * @returns {Promise<{ buffer: Buffer, applied: { logo: boolean, name: boolean } }>}
 */
export async function applyOverlay(canvasBuffer, dims, entry, kb) {
  const { width, height } = dims;

  // ── Resolve mode ─────────────────────────────────────────────────────────────
  // 1. Explicit overlayMode wins (new values: photo-only / logo-only / logo-name)
  // 2. 'packshot' is a backward-compat alias for 'logo-name'
  // 3. No overlayMode → legacy: ambiance → photo-only, else → logo-only (new default)
  let rawMode = entry.overlayMode ?? null;
  if (!rawMode) {
    rawMode = (entry.shotType === 'ambiance' || entry.dishSlug === 'ambiance')
      ? 'photo-only'
      : 'logo-only';
  }
  // Normalize legacy 'packshot'
  const mode = rawMode === 'packshot' ? 'logo-name' : rawMode;

  // ── Photo-only: return canvas unchanged ──────────────────────────────────────
  if (mode === 'photo-only') {
    return {
      buffer: canvasBuffer,
      applied: { logo: false, name: false },
    };
  }

  // ── logo-only / logo-name: build composites ──────────────────────────────────
  const margin = Math.round(Math.min(width, height) * OVERLAY.marginFrac);
  const composites = [];
  const applied = { logo: false, name: false };

  // 1. Logo (always in logo-only / logo-name) ───────────────────────────────────
  const sizeMult = SIZE_FRAC[entry.logoSize ?? 'medium'] ?? 1.0;
  const logoH = Math.max(
    Math.round(OVERLAY.logoMinPx * sizeMult),
    Math.round(height * OVERLAY.logoHeightFrac * sizeMult),
  );
  const logoPng = await getLogoOverlayPng({ height: logoH });
  const logoMeta = await sharp(logoPng).metadata();
  const logoW = logoMeta.width;

  const { cx, cy } = resolveLogoPosNorm(entry);
  const { top: logoTop, left: logoLeft } = logoCoordsXY({
    cx, cy, logoW, logoH, canvasW: width, canvasH: height, margin,
  });

  composites.push({ input: logoPng, top: logoTop, left: logoLeft });
  applied.logo = true;

  // 2. Dish name text (logo-name only) ─────────────────────────────────────────
  if (mode === 'logo-name') {
    // Resolve label: human dishName first (only if not an ambiance placeholder)
    let label = null;
    const isAmbiguousName =
      !entry.dishName ||
      entry.dishName === 'ambiance' ||
      entry.dishName.toLowerCase().startsWith('ambiance');

    if (!isAmbiguousName) {
      label = { name: entry.dishName, price: entry.price ?? null };
    } else if (entry.dishSlug && entry.dishSlug !== 'ambiance') {
      const resolved = dishLabel(entry.dishSlug) ?? menuLabel(entry.dishSlug) ?? null;
      if (resolved) label = resolved;
    }

    if (label) {
      const showPrice = entry.showPrice === true;
      const namePng = await renderNamePng({
        name: label.name,
        price: showPrice ? (label.price ?? null) : null,
        canvasWidth: width,
      });
      const nameMeta = await sharp(namePng).metadata();
      const nameH = nameMeta.height;

      // Place name at bottom-left regardless of logo position (avoids collision)
      const nameTop = Math.max(0, height - nameH - margin);
      const nameLeft = margin;

      composites.push({ input: namePng, top: nameTop, left: nameLeft });
      applied.name = true;
    }
  }

  // ── Composite all layers ─────────────────────────────────────────────────────
  const buffer = await sharp(canvasBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  return { buffer, applied };
}
