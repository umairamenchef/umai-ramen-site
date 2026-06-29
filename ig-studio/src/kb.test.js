/**
 * kb.test.js — unit tests for kb.js (Node built-in test runner)
 * Run: node --test src/kb.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Will fail (module not yet created) until kb.js is implemented
const { loadKB, buildPromptContext } = await import('./kb.js');

describe('loadKB()', () => {
  const kb = loadKB();

  it('returns a raw object with menu property', () => {
    assert.ok(kb.raw, 'raw should exist');
    assert.ok(kb.raw.menu, 'raw.menu should exist');
  });

  it('returns at least 10 slugs', () => {
    assert.ok(Array.isArray(kb.slugs), 'slugs should be an array');
    assert.ok(kb.slugs.length >= 10, `Expected >=10 slugs, got ${kb.slugs.length}: ${kb.slugs.join(', ')}`);
  });

  it('includes "tokyo" slug', () => {
    assert.ok(kb.slugs.includes('tokyo'), `slugs should include "tokyo": ${kb.slugs.join(', ')}`);
  });

  it('includes "yuzu" slug', () => {
    assert.ok(kb.slugs.includes('yuzu'), `slugs should include "yuzu": ${kb.slugs.join(', ')}`);
  });

  it('includes "tantan-ramen" slug', () => {
    assert.ok(kb.slugs.includes('tantan-ramen'), `slugs should include "tantan-ramen": ${kb.slugs.join(', ')}`);
  });

  it('includes "ambiance" as a valid slug', () => {
    assert.ok(kb.slugs.includes('ambiance'), 'slugs should always include "ambiance"');
  });

  it('returns items array flattened from all menu categories', () => {
    assert.ok(Array.isArray(kb.items), 'items should be an array');
    assert.ok(kb.items.length >= 10, `Expected >=10 items, got ${kb.items.length}`);
  });
});

describe('buildPromptContext()', () => {
  const ctx = buildPromptContext();

  it('returns a non-empty string', () => {
    assert.ok(typeof ctx === 'string' && ctx.length > 50, 'Expected a non-trivial string');
  });

  it('mentions "chashu" (topping rule)', () => {
    assert.ok(ctx.toLowerCase().includes('chashu'), 'Should mention chashu topping rule');
  });

  it('mentions "bouillon clair" (tokyo/yuzu disambiguation)', () => {
    assert.ok(ctx.includes('bouillon clair'), 'Should mention bouillon clair for tokyo/yuzu rule');
  });

  it('mentions "ambiance" as a valid class', () => {
    assert.ok(ctx.includes('ambiance'), 'Should mention ambiance class');
  });

  it('lists valid slugs', () => {
    assert.ok(ctx.includes('tokyo'), 'Prompt context should list "tokyo" slug');
    assert.ok(ctx.includes('tantan'), 'Prompt context should list tantan variants');
  });
});
