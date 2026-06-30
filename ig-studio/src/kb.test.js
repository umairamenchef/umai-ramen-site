/**
 * kb.test.js — tests for classifier KB (now: canonical menu-options.json via menu.js)
 *
 * The classifier no longer uses summer-menu-2026.json / kb.js.
 * These tests validate that:
 *   - loadMenu() exposes the canonical 2026 slug set
 *   - buildClassifierPrompt() produces a prompt with correct canonical slugs
 *   - Old fabricated summer slugs (tsukemen, hiyashi) are NOT present
 *
 * Run: node --test src/kb.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadMenu } from './menu.js';
import { buildClassifierPrompt } from './classifier.js';

describe('loadMenu() — canonical slug set', () => {
  const { items, bySlug } = loadMenu();

  it('has at least 20 items', () => {
    assert.ok(items.length >= 20, `Expected >=20 items, got ${items.length}`);
  });

  it('includes canonical ramen slugs', () => {
    assert.ok(bySlug.has('tokyo-ramen'), 'missing tokyo-ramen');
    assert.ok(bySlug.has('yuzu-ramen'), 'missing yuzu-ramen');
    assert.ok(bySlug.has('wantan-ramen'), 'missing wantan-ramen');
    assert.ok(bySlug.has('kamo-ramen'), 'missing kamo-ramen');
    assert.ok(bySlug.has('tantan-umai'), 'missing tantan-umai');
    assert.ok(bySlug.has('kara-tantan'), 'missing kara-tantan');
    assert.ok(bySlug.has('miso-ramen'), 'missing miso-ramen');
    assert.ok(bySlug.has('miso-epice'), 'missing miso-epice');
  });

  it('includes végé slugs', () => {
    assert.ok(bySlug.has('yasai-tantan'), 'missing yasai-tantan');
    assert.ok(bySlug.has('miso-vegetarien'), 'missing miso-vegetarien');
  });

  it('includes mazesoba slugs', () => {
    assert.ok(bySlug.has('mazesoba-karaage'), 'missing mazesoba-karaage');
    assert.ok(bySlug.has('mazesoba-chashu'), 'missing mazesoba-chashu');
    assert.ok(bySlug.has('mazesoba-tantan'), 'missing mazesoba-tantan');
  });

  it('includes udon slugs', () => {
    assert.ok(bySlug.has('udon-tempura'), 'missing udon-tempura');
    assert.ok(bySlug.has('udon-karaage'), 'missing udon-karaage');
    assert.ok(bySlug.has('udon-curry'), 'missing udon-curry');
  });

  it('includes entrées', () => {
    assert.ok(bySlug.has('takoyaki'), 'missing takoyaki');
    assert.ok(bySlug.has('karaage'), 'missing karaage');
    assert.ok(bySlug.has('gyoza'), 'missing gyoza');
    assert.ok(bySlug.has('edamame'), 'missing edamame');
  });

  it('includes ambiance', () => {
    assert.ok(bySlug.has('ambiance'), 'missing ambiance');
  });

  it('does NOT contain old summer-menu fabricated slugs', () => {
    assert.ok(!bySlug.has('tsukemen-miso'), 'tsukemen-miso must NOT be present');
    assert.ok(!bySlug.has('tsukemen-gyokai'), 'tsukemen-gyokai must NOT be present');
    assert.ok(!bySlug.has('hiyashi-poulet'), 'hiyashi-poulet must NOT be present');
    assert.ok(!bySlug.has('hiyashi-tempura'), 'hiyashi-tempura must NOT be present');
    assert.ok(!bySlug.has('tantan-ramen'), 'tantan-ramen (old slug) must NOT be present — use tantan-umai');
    assert.ok(!bySlug.has('tokyo'), 'tokyo (bare) must NOT be present — use tokyo-ramen');
    assert.ok(!bySlug.has('yuzu'), 'yuzu (bare) must NOT be present — use yuzu-ramen');
  });
});

describe('buildClassifierPrompt() — prompt content', () => {
  const { promptContext, validSlugs } = buildClassifierPrompt();

  it('returns a non-empty prompt string', () => {
    assert.ok(typeof promptContext === 'string' && promptContext.length > 200, 'Expected a substantial prompt string');
  });

  it('validSlugs is a Set with canonical dishes', () => {
    assert.ok(validSlugs instanceof Set, 'validSlugs should be a Set');
    assert.ok(validSlugs.has('tokyo-ramen'), 'validSlugs missing tokyo-ramen');
    assert.ok(validSlugs.has('tantan-umai'), 'validSlugs missing tantan-umai');
    assert.ok(validSlugs.has('yasai-tantan'), 'validSlugs missing yasai-tantan');
    assert.ok(validSlugs.has('ambiance'), 'validSlugs missing ambiance');
  });

  it('validSlugs does NOT contain old fabricated slugs', () => {
    assert.ok(!validSlugs.has('tsukemen-miso'), 'tsukemen-miso must not be in validSlugs');
    assert.ok(!validSlugs.has('hiyashi-poulet'), 'hiyashi-poulet must not be in validSlugs');
    assert.ok(!validSlugs.has('tantan-ramen'), 'tantan-ramen must not be in validSlugs');
  });

  it('mentions "chashu" topping rule', () => {
    assert.ok(promptContext.toLowerCase().includes('chashu'), 'Prompt should mention chashu topping rule');
  });

  it('mentions "bouillon clair" disambiguation', () => {
    assert.ok(promptContext.includes('bouillon clair') || promptContext.includes('RAMEN CLAIR'), 'Prompt should mention clear broth disambiguation');
  });

  it('mentions "ambiance" as a valid class', () => {
    assert.ok(promptContext.includes('ambiance'), 'Prompt should mention ambiance class');
  });

  it('mentions tofu → végé rule', () => {
    assert.ok(promptContext.toLowerCase().includes('tofu'), 'Prompt should mention TOFU → végé rule');
  });

  it('explicitly forbids tsukemen and hiyashi', () => {
    assert.ok(
      promptContext.toLowerCase().includes('tsukemen') || promptContext.includes('⛔'),
      'Prompt should explicitly forbid tsukemen/hiyashi'
    );
  });

  it('lists tokyo-ramen slug (not bare "tokyo")', () => {
    assert.ok(promptContext.includes('tokyo-ramen'), 'Prompt should list canonical slug "tokyo-ramen"');
    // bare "tokyo" can appear in descriptions, what matters is the slug form
  });
});
