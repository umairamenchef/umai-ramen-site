/**
 * Tests for brand/logo.js — dual variant system
 * Run: node --test brand/logo.test.js
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { getLogoOverlayPng, clearLogoCache, SVG_ORIG_W, SVG_ORIG_H } from './logo.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Average pixel brightness of a buffer (mean of all channel means, 0-255). */
async function avgBrightness(buf) {
  const stats = await sharp(buf).stats();
  return stats.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('brand/logo — getLogoOverlayPng', () => {
  beforeEach(() => clearLogoCache());

  it('light variant returns a valid PNG buffer with alpha', async () => {
    const buf = await getLogoOverlayPng({ height: 44, variant: 'light' });
    assert.ok(Buffer.isBuffer(buf), 'should be a Buffer');
    const meta = await sharp(buf).metadata();
    assert.equal(meta.format, 'png', 'format should be png');
    assert.ok(meta.hasAlpha, 'should have alpha channel');
  });

  it('dark variant returns a valid PNG buffer with alpha', async () => {
    const buf = await getLogoOverlayPng({ height: 44, variant: 'dark' });
    assert.ok(Buffer.isBuffer(buf), 'should be a Buffer');
    const meta = await sharp(buf).metadata();
    assert.equal(meta.format, 'png', 'format should be png');
    assert.ok(meta.hasAlpha, 'should have alpha channel');
  });

  it('dark variant differs from light variant (different pixel values)', async () => {
    const light = await getLogoOverlayPng({ height: 80, variant: 'light' });
    const dark  = await getLogoOverlayPng({ height: 80, variant: 'dark' });
    assert.ok(!light.equals(dark), 'light and dark buffers must differ');
  });

  it('light variant is brighter than dark variant (ivoire vs charcoal)', async () => {
    const light = await getLogoOverlayPng({ height: 80, variant: 'light' });
    const dark  = await getLogoOverlayPng({ height: 80, variant: 'dark' });
    const lightBrightness = await avgBrightness(light);
    const darkBrightness  = await avgBrightness(dark);
    assert.ok(
      lightBrightness > darkBrightness,
      `light (${lightBrightness.toFixed(1)}) should be brighter than dark (${darkBrightness.toFixed(1)})`,
    );
  });

  it('width is proportional to height (SVG aspect ratio preserved)', async () => {
    const height = 88;
    const buf = await getLogoOverlayPng({ height, variant: 'light' });
    const meta = await sharp(buf).metadata();
    const expectedW = Math.round(height * SVG_ORIG_W / SVG_ORIG_H);
    assert.equal(meta.width,  expectedW, 'width should match aspect ratio');
    assert.equal(meta.height, height,    'height should match requested height');
  });

  it('defaults to light variant when variant is omitted', async () => {
    const withDefault = await getLogoOverlayPng({ height: 60 });
    const withLight   = await getLogoOverlayPng({ height: 60, variant: 'light' });
    assert.ok(withDefault.equals(withLight), 'default should equal explicit light');
  });

  it('caching: same params return identical buffer reference', async () => {
    const buf1 = await getLogoOverlayPng({ height: 60, variant: 'light' });
    const buf2 = await getLogoOverlayPng({ height: 60, variant: 'light' });
    assert.ok(buf1 === buf2, 'cached result should be the same Buffer reference');
  });

  it('clearLogoCache forces re-render (different reference, same content)', async () => {
    const buf1 = await getLogoOverlayPng({ height: 60, variant: 'light' });
    clearLogoCache();
    const buf2 = await getLogoOverlayPng({ height: 60, variant: 'light' });
    assert.ok(buf1 !== buf2, 'after clear, reference must differ (re-rendered)');
    assert.ok(buf1.equals(buf2), 'content should be identical after re-render');
  });

  it('different heights produce different sized buffers', async () => {
    const small  = await getLogoOverlayPng({ height: 44,  variant: 'light' });
    const medium = await getLogoOverlayPng({ height: 120, variant: 'light' });
    const metaS  = await sharp(small).metadata();
    const metaM  = await sharp(medium).metadata();
    assert.ok(metaM.width > metaS.width,   'larger height → larger width');
    assert.ok(metaM.height > metaS.height, 'larger height → larger height');
  });
});
