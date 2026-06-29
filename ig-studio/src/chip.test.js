/**
 * TDD tests for dishLabel (kb.js) + chip.js (buildChipSvg, renderChipPng)
 * Run: node --test src/chip.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

import { dishLabel } from './kb.js';
import { buildChipSvg, renderChipPng } from './chip.js';

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
