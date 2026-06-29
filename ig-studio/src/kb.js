/**
 * Knowledge-base loader for the Umaï summer 2026 menu.
 * Reads ig-studio/data/summer-menu-2026.json and derives:
 *   - items: flat array of all menu items across categories
 *   - slugs: stable short slugs for each dish (+ "ambiance")
 *   - prompt context string with broth/noodle disambiguation rules
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KB_PATH = resolve(PKG_ROOT, 'data', 'summer-menu-2026.json');

// ─── Slug derivation ──────────────────────────────────────────────────────────

/**
 * Convert a menu item name + its category to a stable, short slug.
 * Rules:
 *   - Tantan variants: tantan-ramen | tantan-mazesoba | tantan-tsukemen
 *   - Ramen: tokyo | yuzu
 *   - Tsukemen: tsukemen-miso | tsukemen-gyokai | tsukemen-curry-tomato
 *   - Mazesoba: mazesoba-karaage | mazesoba-chashu
 *   - Hiyashi Chuka: hiyashi-poulet | hiyashi-tempura
 *   - À partager: karaage | gyoza | karaage-poulpe | edamame
 *   - Desserts: mochis | glace | the-cafe-gourmand
 *
 * Generic fallback: lowercase + strip accents + replace non-alnum with - + collapse
 */
function deriveSlug(name, category) {
  // Hardcoded map for precision and stability
  const nameMap = {
    'Tantan Ramen': 'tantan-ramen',
    'Tantan Mazesoba': 'tantan-mazesoba',
    'Tantan Tsukemen': 'tantan-tsukemen',
    'Tokyo': 'tokyo',
    'Yuzu': 'yuzu',
    'Miso': 'tsukemen-miso',
    'Gyokai': 'tsukemen-gyokai',
    'Curry Tomato': 'tsukemen-curry-tomato',
    'Karaage': 'mazesoba-karaage',
    'Chashu': 'mazesoba-chashu',
    'Poulet grillé': 'hiyashi-poulet',
    'Tempura crevette': 'hiyashi-tempura',
    'Karaage (poulet frit)': 'karaage',
    'Gyoza (raviolis grillés)': 'gyoza',
    'Karaage poulpe assaisonné': 'karaage-poulpe',
    'Edamame (fèves de soja)': 'edamame',
    'Mochis glacés': 'mochis',
    'Glace artisanale': 'glace',
    'Thé ou café gourmand': 'the-cafe-gourmand',
  };

  if (nameMap[name]) return nameMap[name];

  // Generic fallback: normalize
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Public API ────────────────────────────────────────────────────────────────

let _cached = null;

/**
 * Load and parse the summer-menu-2026.json KB.
 * Returns { raw, items, slugs } — memoised for repeated calls.
 */
export function loadKB() {
  if (_cached) return _cached;

  const raw = JSON.parse(readFileSync(KB_PATH, 'utf-8'));

  const items = [];
  const slugs = new Set(['ambiance']); // always valid

  for (const [category, entries] of Object.entries(raw.menu)) {
    for (const item of entries) {
      const slug = deriveSlug(item.name, category);
      items.push({ ...item, category, slug });
      slugs.add(slug);
    }
  }

  _cached = { raw, items, slugs: [...slugs].sort() };
  return _cached;
}

// ─── dishLabel ────────────────────────────────────────────────────────────────

/**
 * Resolve a dish slug to its FR display name, price, and category.
 *
 * Display name rules:
 *   - For tsukemen-*, mazesoba-*, hiyashi-* variants that are short (family-relative),
 *     prefix the family name: e.g. "tsukemen-gyokai" → "Tsukemen Gyokai"
 *   - Ramen / Tantan names are self-describing → returned as-is ("tokyo" → "Tokyo")
 *   - Shared (karaage, gyoza, edamame…) → item.name as-is (already descriptive)
 *
 * Price: number if scalar, first element if array, null if missing.
 *
 * Returns null for "ambiance" or any unknown slug.
 *
 * @param {string} slug
 * @returns {{ name: string, price: number|null, category: string }|null}
 */
export function dishLabel(slug) {
  if (!slug || slug === 'ambiance') return null;

  const { items } = loadKB();
  const item = items.find(i => i.slug === slug);
  if (!item) return null;

  // Build display name: prefix family for variant slugs
  let name = item.name;
  if (/^tsukemen-/.test(slug)) {
    name = 'Tsukemen ' + item.name;
  } else if (/^mazesoba-/.test(slug)) {
    name = 'Mazesoba ' + item.name;
  } else if (/^hiyashi-/.test(slug)) {
    name = 'Hiyashi ' + item.name;
  }

  // Price: scalar → number, array → first element, absent → null
  let price = null;
  if (typeof item.price === 'number') {
    price = item.price;
  } else if (Array.isArray(item.price) && item.price.length > 0) {
    price = item.price[0];
  }

  return { name, price, category: item.category };
}

// ─── Prompt context ────────────────────────────────────────────────────────────

/**
 * Build a human-readable block of classification rules for the vision prompt.
 * Encodes broth+noodle disambiguation, the chashu-is-a-topping rule,
 * and the ambiance fallback.
 */
export function buildPromptContext() {
  const { slugs, raw } = loadKB();

  const slugList = slugs.join(', ');

  return `
## Umaï Summer 2026 — Classification Knowledge Base

### Slugs valides (utilise UNIQUEMENT l'un de ces slugs)
${slugList}

### Règles de classification par bouillon + nouilles

1. **tokyo** : ramen au bouillon clair + chashu PORC + bambou
2. **yuzu** : ramen au bouillon clair + chashu POULET + agrumes (citrus/yuzu)
   → bouillon clair = tokyo par défaut ; si poulet + citrus → yuzu
3. **tantan-ramen** : ramen bouillon rougeâtre-sésame + BŒUF HACHÉ épicé + piment
4. **tantan-mazesoba** : SANS bouillon, sésame + bœuf, à mélanger
5. **tantan-tsukemen** : nouilles froides SÉPARÉES + bol de trempage, version tantan
6. **tsukemen-miso / tsukemen-gyokai / tsukemen-curry-tomato** : nouilles FROIDES séparées + bol de trempage (sans le composant tantan)
7. **mazesoba-karaage / mazesoba-chashu** : SANS bouillon, à mélanger (poulet frit ou chashu)
8. **hiyashi-poulet / hiyashi-tempura** : nouilles FROIDES dressées + sauce sésame/soja — plat d'ÉTÉ

### Règle chashu (IMPORTANT)
Le chashu (porc braisé) est un TOPPING présent dans plusieurs plats.
→ Classe par **bouillon + type de nouilles**, PAS par la présence de chashu seul.

### Règle ambiance
Utilise **ambiance** (shotType: "ambiance") si :
- Scène intérieure ou déco du restaurant
- Personnes / équipe
- Plusieurs plats en même temps sans plat unique identifiable
- Scène boissons uniquement (sans plat principal)

### shotType
- **packshot** : un seul plat clairement identifiable, cadré pour les ads
- **ambiance** : tout le reste

### Classification keys (extrait menu)
${JSON.stringify(raw.classification_keys, null, 2)}
`.trim();
}
