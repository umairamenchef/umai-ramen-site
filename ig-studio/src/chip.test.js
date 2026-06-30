/**
 * TDD tests for dishLabel (kb.js) + chip.js (buildChipSvg, renderChipPng)
 * Run: node --test src/chip.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

import { dishLabel } from './kb.js';
import { buildChipSvg, renderChipPng, buildNameSvg, renderNamePng } from './chip.js';

describe('dishLabel', () => {
  it('resolves tokyo → name "Tokyo", price 13.9', () => {
    const result = dishLabel('tokyo');
    assert.ok(result !== null, 'expected non-null for valid slug');
    assert.equal(result.name, 'Tokyo');
    assert.equal(result.price, 13.9);
  });

  it('returns null for "ambiance"', () => {
    assert.equal(dishLabel('ambiance'), null);
  });

  it('returns null for unknown slug', () => {
    assert.equal(dishLabel('not-a-real-dish'), null);
  });

  it('resolves tantan-ramen correctly', () => {
    const result = dishLabel('tantan-ramen');
    assert.ok(result !== null);
    assert.equal(result.name, 'Tantan Ramen');
    assert.ok(typeof result.price === 'number');
  });

  it('resolves karaage (array price) → first price element', () => {
    const result = dishLabel('karaage');
    assert.ok(result !== null);
    assert.equal(result.price, 4.90);
  });

  it('resolves tsukemen-gyokai with Tsukemen prefix', () => {
    const result = dishLabel('tsukemen-gyokai');
    assert.ok(result !== null);
    assert.equal(result.name, 'Tsukemen Gyokai');
  });

  it('resolves hiyashi-poulet with Hiyashi prefix', () => {
    const result = dishLabel('hiyashi-poulet');
    assert.ok(result !== null);
    assert.equal(result.name, 'Hiyashi Poulet grillé');
  });

  it('resolves mazesoba-karaage with Mazesoba prefix', () => {
    const result = dishLabel('mazesoba-karaage');
    assert.ok(result !== null);
    assert.equal(result.name, 'Mazesoba Karaage');
  });
});

describe('buildChipSvg', () => {
  it('returns a string starting with "<svg"', () => {
    const svg = buildChipSvg({ name: 'Tokyo', price: 13.9 });
    assert.ok(typeof svg === 'string');
    assert.ok(svg.startsWith('<svg'), `Expected SVG string, got: ${svg.slice(0, 40)}`);
  });

  it('contains the dish name', () => {
    const svg = buildChipSvg({ name: 'Tokyo', price: 13.9 });
    assert.ok(svg.includes('Tokyo'), 'SVG should contain dish name');
  });

  it('contains ivoire color #F5F0E8', () => {
    const svg = buildChipSvg({ name: 'Tokyo', price: 13.9 });
    assert.ok(svg.includes('#F5F0E8'), 'SVG should use ivoire color');
  });

  it('contains price formatted with FR comma when price provided', () => {
    const svg = buildChipSvg({ name: 'Tokyo', price: 13.9 });
    assert.ok(svg.includes('13,90'), 'SVG should contain FR-formatted price');
  });

  it('omits price block when price is null', () => {
    const svg = buildChipSvg({ name: 'Tokyo', price: null });
    assert.ok(!svg.includes('€'), 'SVG should not contain price when null');
  });
});

describe('renderChipPng', () => {
  it('returns a Buffer with PNG metadata: format=png, width>0, hasAlpha=true', async () => {
    const buf = await renderChipPng({ name: 'Tokyo' });
    assert.ok(Buffer.isBuffer(buf), 'Expected a Buffer');
    const meta = await sharp(buf).metadata();
    assert.equal(meta.format, 'png');
    assert.ok(meta.width > 0, `Expected width > 0, got ${meta.width}`);
    assert.equal(meta.hasAlpha, true);
  });
});

// ─── buildNameSvg (elegant text renderer, no box) ────────────────────────────

describe('buildNameSvg', () => {
  it('returns a string starting with "<svg"', () => {
    const svg = buildNameSvg({ name: 'Tantan Umaï', canvasWidth: 1080 });
    assert.ok(typeof svg === 'string');
    assert.ok(svg.startsWith('<svg'), `Expected SVG string, got: ${svg.slice(0, 40)}`);
  });

  it('contains the dish name', () => {
    const svg = buildNameSvg({ name: 'Tantan Umaï', canvasWidth: 1080 });
    assert.ok(svg.includes('Tantan Uma'), 'SVG should contain the dish name');
  });

  it('contains ivoire color #F5F0E8 (text fill)', () => {
    const svg = buildNameSvg({ name: 'Tokyo', canvasWidth: 1080 });
    assert.ok(svg.includes('#F5F0E8'), 'SVG should use ivoire color for text fill');
  });

  it('does NOT contain a background <rect> (no beige box)', () => {
    const svg = buildNameSvg({ name: 'Tokyo', canvasWidth: 1080 });
    // chip.js has a Plate rect; buildNameSvg must NOT
    // We check there's no fill rect by looking for <rect (there should be none)
    assert.ok(!svg.includes('<rect'), 'SVG name renderer must NOT include a background rect');
  });

  it('contains drop-shadow filter', () => {
    const svg = buildNameSvg({ name: 'Tokyo', canvasWidth: 1080 });
    assert.ok(svg.includes('feDropShadow'), 'SVG should include a drop shadow filter');
  });

  it('includes FR-formatted price when price provided', () => {
    const svg = buildNameSvg({ name: 'Tokyo', price: 13.9, canvasWidth: 1080 });
    assert.ok(svg.includes('13,90'), 'SVG should contain FR-formatted price');
  });

  it('omits price when price is null', () => {
    const svg = buildNameSvg({ name: 'Tokyo', price: null, canvasWidth: 1080 });
    assert.ok(!svg.includes('€'), 'SVG should not contain price when null');
  });

  it('font size scales with canvasWidth (wider canvas → larger font)', () => {
    const svg1080 = buildNameSvg({ name: 'Tokyo', canvasWidth: 1080 });
    const svg540  = buildNameSvg({ name: 'Tokyo', canvasWidth: 540 });
    // Extract first font-size value via regex
    const re = /font-size="(\d+)"/;
    const size1080 = parseInt(re.exec(svg1080)?.[1] ?? '0');
    const size540  = parseInt(re.exec(svg540)?.[1] ?? '0');
    assert.ok(size1080 > size540, `1080 font (${size1080}) should be larger than 540 font (${size540})`);
  });
});

describe('renderNamePng', () => {
  it('returns a Buffer with PNG metadata: format=png, width>0, hasAlpha=true', async () => {
    const buf = await renderNamePng({ name: 'Tantan Umaï', canvasWidth: 1080 });
    assert.ok(Buffer.isBuffer(buf), 'Expected a Buffer');
    const meta = await sharp(buf).metadata();
    assert.equal(meta.format, 'png');
    assert.ok(meta.width > 0, `Expected width > 0, got ${meta.width}`);
    assert.equal(meta.hasAlpha, true);
  });

  it('renders without price when showPrice is false', async () => {
    const withoutPrice = await renderNamePng({ name: 'Tokyo', price: null, canvasWidth: 1080 });
    const withPrice    = await renderNamePng({ name: 'Tokyo', price: 13.9, canvasWidth: 1080 });
    const metaWo = await sharp(withoutPrice).metadata();
    const metaW  = await sharp(withPrice).metadata();
    // With price, the SVG is taller (extra price line), so height should be >=
    assert.ok(metaW.height >= metaWo.height, 'SVG with price should be at least as tall as without');
  });
});
