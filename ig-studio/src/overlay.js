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
 * Auto-contrast logo variant (entry.logoColor):
 *   'auto'  (default) — sample the average luminance of the region where the logo will sit;
 *                        if light background → use dark logo; if dark → use light logo.
 *   'light' — force the ivoire (#F5F0E8) wordmark regardless of background
 *   'dark'  — force the charcoal (#1C1C1C) wordmark regardless of background
 *
 * Tuning knobs (all in entry):
 *   logoPosition?: 'top-left'|'top-right'|'bottom-left'|'bottom-right'  (default 'top-right')
 *   logoSize?:     'small'|'medium'|'large'                              (default 'medium')
 *   showPrice?:    boolean                                                (default false)
 *   logoColor?:    'auto'|'light'|'dark'                                 (default 'auto')
 *
 * Label resolution (logo-name only):
 *   entry.dishName (human-supplied) → menuLabel(slug) [canonical] → dishLabel(slug) [legacy KB] → null
 *
 * BRAND-05: sharp-only pipeline — no Chrome, no network.
 */

import sharp from 'sharp';
import { getLogoOverlayPng, SVG_ORIG_W, SVG_ORIG_H } from '../brand/logo.js';
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
  if (Number.isFinite(entry.logoPosX) && Number.isFinite(entry.logoPosY)) {
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    return { cx: clamp01(entry.logoPosX), cy: clamp01(entry.logoPosY) };
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

// ─── Luminance sampling ───────────────────────────────────────────────────────

/**
 * Sample the perceived luminance of a rectangular region in a PNG canvas buffer.
 * Uses the standard Rec.709 coefficients: 0.2126R + 0.7152G + 0.0722B.
 *
 * @param {Buffer} canvasBuffer — PNG buffer
 * @param {{ left: number, top: number, width: number, height: number }} region
 * @returns {Promise<number>} — perceived luminance in [0, 1]; 0 = black, 1 = white
 */
export async function sampleRegionLuminance(canvasBuffer, region) {
  // Clamp region to valid positive dimensions (guard against edge cases)
  const w = Math.max(1, region.width);
  const h = Math.max(1, region.height);

  const stats = await sharp(canvasBuffer)
    .extract({
      left:   Math.max(0, Math.round(region.left)),
      top:    Math.max(0, Math.round(region.top)),
      width:  w,
      height: h,
    })
    .stats();

  // channels[0]=R, [1]=G, [2]=B (mean is in [0, 255])
  const r = stats.channels[0]?.mean ?? 128;
  const g = stats.channels[1]?.mean ?? 128;
  const b = stats.channels[2]?.mean ?? 128;

  // Rec.709 perceived luminance, normalized to [0,1]
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
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
 *   logoColor?: 'auto'|'light'|'dark' — default 'auto'
 * @param {object} kb — loaded KB (unused directly; passed for future use)
 * @returns {Promise<{ buffer: Buffer, applied: { logo: boolean, name: boolean }, logoVariant: string }>}
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
      logoVariant: null,
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

  // Compute logoW from the fixed SVG aspect ratio (128:44) — no need to fetch PNG first.
  // This lets us sample the logo region's luminance before choosing the variant.
  const logoW = Math.round(logoH * SVG_ORIG_W / SVG_ORIG_H);

  const { cx, cy } = resolveLogoPosNorm(entry);
  let { top: logoTop, left: logoLeft } = logoCoordsXY({
    cx, cy, logoW, logoH, canvasW: width, canvasH: height, margin,
  });

  const logoColorPref = entry.logoColor ?? 'auto';

  // ── Pre-resolve the dish name (logo-name mode) ────────────────────────────────
  // We render/measure the name BEFORE finalising the logo position so we can (a)
  // detect a logo↔name collision (both gravitate to the bottom) and lift the logo,
  // and (b) sample the EXACT name box for auto-contrast (not a fixed guess box).
  let namePng = null;
  let nameBox = null; // { left, top, width, height }
  if (mode === 'logo-name') {
    // Resolve label: human dishName first (only if not an ambiance/empty placeholder)
    let label = null;
    const nm = entry.dishName;
    const isAmbiguousName =
      !nm ||
      typeof nm !== 'string' ||
      nm.trim() === '' ||
      nm.trim().toLowerCase().startsWith('ambiance');

    if (!isAmbiguousName) {
      label = { name: nm.trim(), price: entry.price ?? null };
    } else if (entry.dishSlug && entry.dishSlug !== 'ambiance') {
      // Canonical menu-options.json wins; old summer-menu KB only as last resort.
      const resolved = menuLabel(entry.dishSlug) ?? dishLabel(entry.dishSlug) ?? null;
      if (resolved) label = resolved;
    }

    if (label) {
      const showPrice = entry.showPrice === true;
      const namePrice = showPrice ? (label.price ?? null) : null;

      // Render once (light) only to MEASURE — dimensions are variant-independent.
      const measurePng = await renderNamePng({
        name: label.name, price: namePrice, canvasWidth: width, variant: 'light',
      });
      const meta = await sharp(measurePng).metadata();
      const nameTop = Math.max(0, height - meta.height - margin);
      nameBox = { left: margin, top: nameTop, width: meta.width, height: meta.height };

      // Collision avoidance: if the logo box would overlap the name box, lift the
      // logo to the top band (keeping its horizontal side). The name stays anchored
      // bottom-left. This protects long names from sitting under the wordmark.
      const gap = Math.round(margin * 0.5);
      const overlapX = logoLeft < nameBox.left + nameBox.width + gap &&
                       logoLeft + logoW + gap > nameBox.left;
      const overlapY = logoTop < nameBox.top + nameBox.height + gap &&
                       logoTop + logoH + gap > nameBox.top;
      if (overlapX && overlapY) {
        logoTop = margin;
      }

      // Auto-contrast: sample the EXACT name box. A forced logoColor applies too.
      let nameVariant;
      if (logoColorPref === 'light') {
        nameVariant = 'light';
      } else if (logoColorPref === 'dark') {
        nameVariant = 'dark';
      } else {
        const lumName = await sampleRegionLuminance(canvasBuffer, nameBox);
        nameVariant = lumName > OVERLAY.autoLuminanceThreshold ? 'dark' : 'light';
      }

      namePng = nameVariant === 'light'
        ? measurePng
        : await renderNamePng({ name: label.name, price: namePrice, canvasWidth: width, variant: nameVariant });
    }
  }

  // ── Logo auto-contrast at its FINAL (possibly lifted) position ────────────────
  let logoVariant;
  if (logoColorPref === 'light') {
    logoVariant = 'light';
  } else if (logoColorPref === 'dark') {
    logoVariant = 'dark';
  } else {
    const lum = await sampleRegionLuminance(canvasBuffer, {
      left: logoLeft, top: logoTop, width: logoW, height: logoH,
    });
    logoVariant = lum > OVERLAY.autoLuminanceThreshold ? 'dark' : 'light';
  }

  const logoPng = await getLogoOverlayPng({ height: logoH, variant: logoVariant });
  composites.push({ input: logoPng, top: logoTop, left: logoLeft });
  applied.logo = true;

  // 2. Dish name composite (if resolved) ────────────────────────────────────────
  if (namePng && nameBox) {
    composites.push({ input: namePng, top: nameBox.top, left: nameBox.left });
    applied.name = true;
  }

  // ── Composite all layers ─────────────────────────────────────────────────────
  const buffer = await sharp(canvasBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  return { buffer, applied, logoVariant };
}
