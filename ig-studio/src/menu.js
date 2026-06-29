/**
 * Umaï IG Studio — Canonical menu-options.json loader
 *
 * loadMenu() → { groups, nap, items, bySlug } (memoised)
 * menuLabel(slug) → { name, price, baseline } | null
 *
 * This is the CANONICAL source for the /ig-studio dropdown, captions, and
 * overlay label resolution. Does NOT touch the old summer-menu-2026.json / kb.js.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MENU_PATH = resolve(PKG_ROOT, 'data', 'menu-options.json');

let _cached = null;

/**
 * Load and parse menu-options.json.
 *
 * @returns {{ groups: Array, nap: object, items: Array, bySlug: Map<string,object> }}
 */
export function loadMenu() {
  if (_cached) return _cached;

  const raw = JSON.parse(readFileSync(MENU_PATH, 'utf-8'));

  /** @type {Array<object>} */
  const items = [];
  /** @type {Map<string,object>} */
  const bySlug = new Map();

  for (const group of raw.groups) {
    for (const item of group.items) {
      const enriched = { ...item, group: group.group };
      items.push(enriched);
      bySlug.set(item.slug, enriched);
    }
  }

  _cached = {
    groups: raw.groups,
    nap: raw.nap,
    items,
    bySlug,
  };

  return _cached;
}

/**
 * Resolve a slug to its display label from menu-options.json.
 *
 * Returns `{ name, price, baseline }` for real dishes.
 * Returns `null` for 'ambiance' or unknown slugs.
 *
 * @param {string} slug
 * @returns {{ name: string, price: number|null, baseline: string } | null}
 */
export function menuLabel(slug) {
  if (!slug || slug === 'ambiance') return null;

  const { bySlug } = loadMenu();
  const item = bySlug.get(slug);
  if (!item) return null;

  return {
    name: item.name,
    price: item.price ?? null,
    baseline: item.baseline ?? '',
  };
}
