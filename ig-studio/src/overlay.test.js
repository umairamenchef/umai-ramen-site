/**
 * Tests for applyOverlay (overlay.js)
 * Uses a synthetic canvas — NO real photos, NO network.
 * Run: node --test src/overlay.test.js
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { applyOverlay } from './overlay.js';
import { loadKB } from './kb.js';

// ─── Synthetic canvas helper ──────────────────────────────────────────────────

async function makeCanvas(width = 1080, height = 1350) {
  return sharp({
    create: { width, height, channels: 4, background: { r: 120, g: 120, b: 120, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('applyOverlay', () => {
  let kb;
  let canvas;

  before(async () => {
    kb = loadKB();
    canvas = await makeCanvas(1080, 1350);
  });

  it('ambiance: returns identical buffer unchanged (logo:false, chip:false)', async () => {
    const entry = { shotType: 'ambiance', dishSlug: 'ambiance', confidence: 0.95 };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.deepStrictEqual(result.applied, { logo: false, chip: false });
    assert.ok(result.buffer.equals(canvas), 'Ambiance buffer should be identical to input canvas');
  });

  it('packshot conf>=0.7: logo:true, chip:true — output differs from canvas', async () => {
    const entry = { shotType: 'packshot', dishSlug: 'tokyo', confidence: 0.9 };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true, 'Expected logo to be applied');
    assert.equal(result.applied.chip, true, 'Expected chip to be applied (conf >= 0.7)');
    assert.ok(!result.buffer.equals(canvas), 'Packshot buffer should differ from plain canvas');
  });

  it('packshot conf<0.7: logo:true, chip:false — logo applied but no chip', async () => {
    const entry = { shotType: 'packshot', dishSlug: 'tokyo', confidence: 0.5 };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true, 'Expected logo to be applied');
    assert.equal(result.applied.chip, false, 'Expected NO chip (conf < 0.7)');
    assert.ok(!result.buffer.equals(canvas), 'Packshot buffer should differ from plain canvas');
  });

  it('packshot with unknown slug: logo:true, chip:false (dishLabel returns null)', async () => {
    const entry = { shotType: 'packshot', dishSlug: 'not-a-real-dish', confidence: 0.95 };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true);
    assert.equal(result.applied.chip, false, 'No chip for unknown slug even at high confidence');
  });
});
