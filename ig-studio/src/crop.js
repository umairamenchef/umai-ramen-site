/**
 * Umaï IG Studio — Meta format spec + cover-crop utility (BRAND-06)
 *
 * FORMATS: the three exact Meta output dimensions.
 * coverCrop(inputPath, w, h): sharp fit:'cover' → exact w×h PNG buffer, no letterbox.
 *
 * BRAND-06 deviation (documented): sharp does the resize/crop; sips is the verify oracle.
 */

import sharp from 'sharp';

// ─── Meta format spec ─────────────────────────────────────────────────────────

/**
 * @type {{ feed: {w:number,h:number}, square: {w:number,h:number}, story: {w:number,h:number} }}
 */
export const FORMATS = {
  feed:   { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  story:  { w: 1080, h: 1920 },
};

// ─── Cover-crop ───────────────────────────────────────────────────────────────

/**
 * Cover-crop a photo to exact w×h pixels.
 * Uses sharp fit:'cover', position:'centre' — no letterbox/padding.
 * Returns a PNG Buffer.
 *
 * @param {string|Buffer} inputPath — path to source JPEG (or any sharp-readable format)
 * @param {number} w — target width in pixels
 * @param {number} h — target height in pixels
 * @returns {Promise<Buffer>} PNG buffer, exactly w×h
 */
export async function coverCrop(inputPath, w, h) {
  return sharp(inputPath)
    .resize(w, h, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}
