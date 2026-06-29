/**
 * Tests for menu.js (canonical menu-options.json loader)
 * Run: node --test src/menu.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadMenu, menuLabel } from './menu.js';

describe('loadMenu()', () => {
  it('bySlug has canonical dishes', () => {
    const { bySlug } = loadMenu();
    assert.ok(bySlug.has('tantan-umai'), 'bySlug should have tantan-umai');
    assert.ok(bySlug.has('tokyo-ramen'), 'bySlug should have tokyo-ramen');
    assert.ok(bySlug.has('yasai-tantan'), 'bySlug should have yasai-tantan');
    assert.ok(bySlug.has('miso-vegetarien'), 'bySlug should have miso-vegetarien');
    assert.ok(bySlug.has('ambiance'), 'bySlug should have ambiance (Spécial group)');
  });

  it('bySlug has NO old summer seasonal slugs (tsukemen-miso, hiyashi-poulet)', () => {
    const { bySlug } = loadMenu();
    assert.ok(!bySlug.has('tsukemen-miso'), 'tsukemen-miso must NOT be present (seasonal, not on 2026 menu)');
    assert.ok(!bySlug.has('hiyashi-poulet'), 'hiyashi-poulet must NOT be present');
  });

  it('nap.instagram === "@umai_ramen_strasbourg"', () => {
    const { nap } = loadMenu();
    assert.strictEqual(nap.instagram, '@umai_ramen_strasbourg');
  });

  it('items is a flat array with group field on each entry', () => {
    const { items } = loadMenu();
    assert.ok(Array.isArray(items), 'items should be an array');
    assert.ok(items.length > 0, 'items should not be empty');
    assert.ok('group' in items[0], 'each item should carry a group field');
  });

  it('groups is the raw groups array from JSON', () => {
    const { groups } = loadMenu();
    assert.ok(Array.isArray(groups), 'groups should be an array');
    assert.ok(groups.length > 0, 'groups should not be empty');
    assert.ok('group' in groups[0], 'each group should have a group label');
    assert.ok(Array.isArray(groups[0].items), 'each group should have an items array');
  });
});

describe('menuLabel()', () => {
  it('menuLabel("tokyo-ramen").price === 13.90', () => {
    const label = menuLabel('tokyo-ramen');
    assert.ok(label !== null, 'menuLabel should return a label for tokyo-ramen');
    assert.strictEqual(label.price, 13.90);
  });

  it('menuLabel("ambiance") === null', () => {
    assert.strictEqual(menuLabel('ambiance'), null);
  });

  it('menuLabel("unknown-slug") === null', () => {
    assert.strictEqual(menuLabel('unknown-slug'), null);
  });

  it('menuLabel returns name + baseline for real dish', () => {
    const label = menuLabel('tantan-umai');
    assert.ok(label !== null, 'tantan-umai should resolve');
    assert.ok(typeof label.name === 'string', 'name should be a string');
    assert.ok(typeof label.baseline === 'string', 'baseline should be a string');
    assert.ok(label.price != null, 'tantan-umai should have a price');
  });

  it('menuLabel for dessert with null price returns null price (not throws)', () => {
    // Ambiance already handled; check a dessert-style slug if price is omitted
    // tiramisu-matcha has empty baseline and no issue
    const label = menuLabel('tiramisu-matcha');
    if (label !== null) {
      // price should be a number or null, never undefined
      assert.ok(
        label.price === null || typeof label.price === 'number',
        'price should be number|null'
      );
    }
  });
});
