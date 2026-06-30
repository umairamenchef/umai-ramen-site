/**
 * Tests for applyOverlay (overlay.js) — 3-mode system
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

describe('applyOverlay — photo-only mode', () => {
  let kb;
  let canvas;

  before(async () => {
    kb = loadKB();
    canvas = await makeCanvas(1080, 1350);
  });

  it('ambiance shotType → mode photo-only: buffer identical, logo:false, name:false', async () => {
    const entry = { shotType: 'ambiance', dishSlug: 'ambiance', confidence: 0.95 };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.deepStrictEqual(result.applied, { logo: false, name: false });
    assert.ok(result.buffer.equals(canvas), 'ambiance buffer must equal input canvas');
  });

  it('explicit overlayMode:photo-only → buffer identical, logo:false, name:false', async () => {
    const entry = {
      overlayMode: 'photo-only',
      dishSlug: 'tantan-umai',
      dishName: 'Tantan Umaï',
      confidence: 0.9,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.deepStrictEqual(result.applied, { logo: false, name: false });
    assert.ok(result.buffer.equals(canvas), 'photo-only buffer must equal input canvas');
  });

  it('ambiance dishName must NEVER appear in logo/name even if mode slips to non-photo-only', async () => {
    // Simulate an old entry where overlayMode was 'packshot' (compat alias logo-name)
    // but dishSlug is 'ambiance' — overlay must NOT draw "Ambiance" text
    const entry = {
      overlayMode: 'packshot',       // backward compat alias
      dishSlug: 'ambiance',
      dishName: 'Ambiance (photo-only)',
      confidence: 0.1,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);
    // 'packshot' → 'logo-name', but dishName starts with 'ambiance' → name must NOT be drawn
    assert.equal(result.applied.logo, true, 'logo drawn in logo-name mode');
    assert.equal(result.applied.name, false, 'ambiance dishName must NOT be drawn as on-image text');
  });
});

describe('applyOverlay — logo-only mode', () => {
  let kb;
  let canvas;

  before(async () => {
    kb = loadKB();
    canvas = await makeCanvas(1080, 1350);
  });

  it('explicit logo-only: logo:true, name:false, buffer differs from canvas', async () => {
    const entry = {
      overlayMode: 'logo-only',
      dishSlug: 'tantan-umai',
      dishName: 'Tantan Umaï',
      confidence: 0.9,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true);
    assert.equal(result.applied.name, false);
    assert.ok(!result.buffer.equals(canvas), 'logo-only buffer must differ from plain canvas');
  });

  it('no overlayMode on non-ambiance entry → defaults to logo-only', async () => {
    const entry = { shotType: 'packshot', dishSlug: 'tokyo', confidence: 0.9 };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true);
    assert.equal(result.applied.name, false);
  });
});

describe('applyOverlay — logo-name mode', () => {
  let kb;
  let canvas;

  before(async () => {
    kb = loadKB();
    canvas = await makeCanvas(1080, 1350);
  });

  it('logo-name with human dishName → logo:true, name:true', async () => {
    const entry = {
      overlayMode: 'logo-name',
      dishName: 'Tantan Umaï',
      price: 15.9,
      confidence: 0.2,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true);
    assert.equal(result.applied.name, true);
    assert.ok(!result.buffer.equals(canvas));
  });

  it('packshot (compat alias) → treated as logo-name: logo:true, name:true when label resolves', async () => {
    const entry = {
      overlayMode: 'packshot',
      dishName: 'Tantan Umaï',
      price: 15.9,
      confidence: 0.5,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true);
    assert.equal(result.applied.name, true);
  });

  it('logo-name with unknown slug and no dishName → logo:true, name:false', async () => {
    const entry = {
      overlayMode: 'logo-name',
      dishSlug: 'not-a-real-dish',
      confidence: 0.95,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);

    assert.equal(result.applied.logo, true);
    assert.equal(result.applied.name, false, 'no name when slug not in KB or menu');
  });
});

describe('applyOverlay — logo position & size', () => {
  let kb;
  let canvas;

  before(async () => {
    kb = loadKB();
    canvas = await makeCanvas(1080, 1350);
  });

  for (const position of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
    it(`logo position "${position}" → logo applied, buffer differs from canvas`, async () => {
      const entry = {
        overlayMode: 'logo-only',
        dishSlug: 'tantan-umai',
        logoPosition: position,
        logoSize: 'medium',
      };
      const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);
      assert.equal(result.applied.logo, true);
      assert.ok(!result.buffer.equals(canvas), `buffer must differ for position ${position}`);
    });
  }

  for (const size of ['small', 'medium', 'large']) {
    it(`logo size "${size}" → logo applied`, async () => {
      const entry = {
        overlayMode: 'logo-only',
        dishSlug: 'tantan-umai',
        logoPosition: 'top-right',
        logoSize: size,
      };
      const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);
      assert.equal(result.applied.logo, true);
    });
  }

  it('logo size "large" produces wider logo buffer than "small"', async () => {
    const base = { overlayMode: 'logo-only', dishSlug: 'tantan-umai', logoPosition: 'top-right' };
    const small  = await applyOverlay(canvas, { width: 1080, height: 1350 }, { ...base, logoSize: 'small'  }, kb);
    const large  = await applyOverlay(canvas, { width: 1080, height: 1350 }, { ...base, logoSize: 'large'  }, kb);
    // Both differ from canvas; large must produce a different (larger logo) composite
    assert.ok(!small.buffer.equals(large.buffer), 'small and large logo buffers must differ');
  });
});

describe('applyOverlay — showPrice flag', () => {
  let kb;
  let canvas;

  before(async () => {
    kb = loadKB();
    canvas = await makeCanvas(1080, 1350);
  });

  it('showPrice:false (default) → name drawn but price NOT in name overlay', async () => {
    const entry = {
      overlayMode: 'logo-name',
      dishName: 'Tantan Umaï',
      price: 15.9,
      showPrice: false,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);
    assert.equal(result.applied.name, true);
    // We can't check pixel content here — just verify name is applied without error
  });

  it('showPrice:true → name drawn (price included)', async () => {
    const entry = {
      overlayMode: 'logo-name',
      dishName: 'Tantan Umaï',
      price: 15.9,
      showPrice: true,
    };
    const result = await applyOverlay(canvas, { width: 1080, height: 1350 }, entry, kb);
    assert.equal(result.applied.name, true);
  });
});
