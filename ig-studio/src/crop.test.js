/**
 * TDD tests for crop.js (FORMATS spec + coverCrop)
 * Uses a real source photo: photos/umai_004.jpg
 * Run: node --test src/crop.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { coverCrop, FORMATS } from './crop.js';
import { photoPath } from './photos.js';

describe('FORMATS', () => {
  it('exports feed 1080x1350', () => {
    assert.equal(FORMATS.feed.w, 1080);
    assert.equal(FORMATS.feed.h, 1350);
  });
  it('exports square 1080x1080', () => {
    assert.equal(FORMATS.square.w, 1080);
    assert.equal(FORMATS.square.h, 1080);
  });
  it('exports story 1080x1920', () => {
    assert.equal(FORMATS.story.w, 1080);
    assert.equal(FORMATS.story.h, 1920);
  });
});

describe('coverCrop', () => {
  const srcPath = photoPath('umai_004.jpg');

  it('feed (1080x1350): exact dimensions, format=png', async () => {
    const { w, h } = FORMATS.feed;
    const buf = await coverCrop(srcPath, w, h);
    assert.ok(Buffer.isBuffer(buf), 'Expected a Buffer');
    const meta = await sharp(buf).metadata();
    assert.equal(meta.format, 'png', `Expected png, got ${meta.format}`);
    assert.equal(meta.width, w, `Expected width ${w}, got ${meta.width}`);
    assert.equal(meta.height, h, `Expected height ${h}, got ${meta.height}`);
  });

  it('square (1080x1080): exact dimensions, format=png', async () => {
    const { w, h } = FORMATS.square;
    const buf = await coverCrop(srcPath, w, h);
    const meta = await sharp(buf).metadata();
    assert.equal(meta.width, w);
    assert.equal(meta.height, h);
    assert.equal(meta.format, 'png');
  });

  it('story (1080x1920): exact dimensions, format=png', async () => {
    const { w, h } = FORMATS.story;
    const buf = await coverCrop(srcPath, w, h);
    const meta = await sharp(buf).metadata();
    assert.equal(meta.width, w);
    assert.equal(meta.height, h);
    assert.equal(meta.format, 'png');
  });
});
