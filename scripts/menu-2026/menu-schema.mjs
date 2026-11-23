/**
 * UMAÏ Ramen: schema of scripts/menu-2026/menu-2026.json (transcription of the 2026 print).
 *
 * No dependencies. Used by validate-menu.mjs (CLI) and sync-menu.mjs (Sanity sync).
 *
 *   validateMenu(json) -> string[]   (empty array = valid)
 *   allPrices(json)    -> number[]   (every item.price and every variant price)
 *
 * The JSON is the single input of the sync. Phase 14 adds en/de/it/zh to the locale objects.
 */

export const LOCALES = ['fr', 'en', 'de', 'it', 'zh'];
export const UNITS = ['pcs', 'cl', 'l', 'scoop'];
export const BADGES = ['bestseller', 'vegetarianOption'];
export const SECTIONS = ['food', 'drinks'];

export const EXPECTED_CATEGORY_KEYS = [
  'entrees',
  'tantan-umai',
  'ramen',
  'mazesoba',
  'udon',
  'menu-enfant',
  'extras',
  'desserts',
  'bieres',
  'spritz',
  'highball',
  'cocktails-signature',
  'cocktails-sans-alcool',
  'thes-glaces',
  'softs',
  'eaux-minerales',
  'sakes-japonais',
  'whiskies-rhums',
  'vins',
  'cafes-thes',
];
export const EXPECTED_ITEM_COUNT = 77;

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CATEGORY_FIELDS = new Set(['key', 'section', 'name', 'nameJp', 'description', 'footnote', 'items']);
const ITEM_FIELDS = new Set([
  'key',
  'name',
  'nameJp',
  'description',
  'subgroup',
  'price',
  'prices',
  'priceOnRequest',
  'badges',
  'isVegetarian',
  'isGlutenFree',
  'legacyIds',
  'imageFrom',
]);
const VARIANT_FIELDS = new Set(['quantity', 'unit', 'label', 'price']);
const CORRECTION_FIELDS = ['where', 'print', 'web', 'reason'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-9;

/** Every item.price and every variant price, in file order. */
export function allPrices(json) {
  const out = [];
  for (const cat of json?.categories ?? []) {
    for (const item of cat?.items ?? []) {
      if (typeof item?.price === 'number') out.push(item.price);
      for (const v of Array.isArray(item?.prices) ? item.prices : []) {
        if (typeof v?.price === 'number') out.push(v.price);
      }
    }
  }
  return out;
}

/** Locale object check: { fr (required, non-empty), en?, de?, it?, zh? } with string values only. */
function checkLocale(errors, where, value, { required }) {
  if (value === undefined) {
    if (required) errors.push(`${where}: missing (locale object with a non-empty "fr")`);
    return;
  }
  if (!isObj(value)) {
    errors.push(`${where}: must be a locale object { fr, en?, de?, it?, zh? }`);
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    if (!LOCALES.includes(k)) errors.push(`${where}: unknown locale key "${k}" (allowed: ${LOCALES.join(', ')})`);
    else if (typeof v !== 'string') errors.push(`${where}.${k}: must be a string`);
  }
  if (!isNonEmptyStr(value.fr)) errors.push(`${where}.fr: must be a non-empty string`);
}

/** Walk every string under a value, calling fn(path, string). */
function walkStrings(value, path, fn) {
  if (typeof value === 'string') fn(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (isObj(value)) for (const [k, v] of Object.entries(value)) walkStrings(v, `${path}.${k}`, fn);
}

const variantSig = (v) =>
  v?.label !== undefined ? `label:${v.label?.fr}=${v.price}` : `${v?.quantity} ${v?.unit}=${v?.price}`;
const qty = (quantity, unit, price) => ({ quantity, unit, price });

/**
 * GOLDEN values read on the print (food 2026-11-10, drinks 2026-11-03).
 * If the PDF ever disagrees with one of these, fix the JSON AND this constant, and record why in ekToConfirm.
 */
const GOLDEN_PRICES = {
  karaage: [qty(3, 'pcs', 5.5), qty(6, 'pcs', 9.9), qty(9, 'pcs', 13.9)],
  gyozas: [qty(3, 'pcs', 4.9), qty(6, 'pcs', 8.9), qty(9, 'pcs', 12.5)],
  takoyaki: [qty(3, 'pcs', 4.9), qty(6, 'pcs', 8.9), qty(9, 'pcs', 12.5)],
  'chashu-porc': [qty(2, 'pcs', 3.9)],
  'chashu-poulet': [qty(3, 'pcs', 3.5)],
  asahi: [qty(25, 'cl', 4.9), qty(50, 'cl', 7.5)],
  'asahi-super-dry': [qty(33, 'cl', 5.9)],
  'riesling-alsace-sperry': [qty(12, 'cl', 5.5), qty(75, 'cl', 24)],
  'chardonnay-naturalys': [qty(12, 'cl', 5.5), qty(75, 'cl', 24)],
  'trio-degustation': [{ label: { fr: '3 × 6cl' }, price: 18 }],
};
const GOLDEN_PRICE = {
  edamame: 4.9,
  'tantan-ramen': 15.9,
  'tantan-tsukemen': 16.9,
  'little-tokyo': 9.9,
  'mini-ramen': 9.9,
  natsu: 9,
  'sakura-blossom': 8.5,
};
const GOLDEN_ITEM_TEXT = {
  'asahi-super-dry': { name: 'Asahi Super Dry ~ 5°' },
  'coedo-ipa': { name: 'Coedo IPA ~ 4,5°' },
  zaku: { name: 'Zaku ~ 15,5°' },
  'trio-degustation': { description: 'Trois sakés sélectionnés par notre équipe.' },
  gyozas: { description: 'Raviolis grillés. Garniture au choix : poulet, porc ou légumes.' },
};
const GOLDEN_CATEGORY_TEXT = {
  udon: { description: 'Le midi seulement' },
  'menu-enfant': {
    description: 'Pour les enfants de moins de 10 ans.',
    footnote: "Inclus : un sirop à l'eau et une boule de glace au choix.",
  },
  extras: { description: 'Complétez votre bol avec nos extras.' },
  'sakes-japonais': { description: 'Service de 10cl, sauf trio.' },
};
const GOLDEN_IMAGE_FROM = {
  gyozas: 'item-e3480244',
  'tantan-ramen': 'item-e3480254',
  'tokyo-ramen': 'item-e3480256',
};

function checkGolden(errors, json) {
  const cats = new Map((json.categories ?? []).filter(isObj).map((c) => [c.key, c]));
  const items = new Map();
  for (const c of json.categories ?? []) for (const it of (isObj(c) && Array.isArray(c.items) ? c.items : [])) if (isObj(it)) items.set(it.key, it);
  const item = (k) => {
    const it = items.get(k);
    if (!it) errors.push(`GOLDEN ${k}: item missing`);
    return it;
  };

  for (const [k, expected] of Object.entries(GOLDEN_PRICES)) {
    const it = item(k);
    if (!it) continue;
    const got = (Array.isArray(it.prices) ? it.prices : []).map(variantSig).join(' | ');
    const want = expected.map(variantSig).join(' | ');
    if (got !== want) errors.push(`GOLDEN ${k}: prices are [${got}], expected [${want}]`);
    if (it.price !== undefined) errors.push(`GOLDEN ${k}: must use prices[] only (no single price)`);
  }
  for (const [k, expected] of Object.entries(GOLDEN_PRICE)) {
    const it = item(k);
    if (it && it.price !== expected) errors.push(`GOLDEN ${k}: price is ${it.price}, expected ${expected}`);
  }
  for (const [k, fields] of Object.entries(GOLDEN_ITEM_TEXT)) {
    const it = item(k);
    if (!it) continue;
    for (const [field, expected] of Object.entries(fields)) {
      const got = it[field]?.fr;
      if (got !== expected) errors.push(`GOLDEN ${k}: ${field}.fr is ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`);
    }
  }
  for (const [k, fields] of Object.entries(GOLDEN_CATEGORY_TEXT)) {
    const c = cats.get(k);
    if (!c) {
      errors.push(`GOLDEN category ${k}: missing`);
      continue;
    }
    for (const [field, expected] of Object.entries(fields)) {
      const got = c[field]?.fr;
      if (got !== expected) errors.push(`GOLDEN category ${k}: ${field}.fr is ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`);
    }
  }

  const edamame = item('edamame');
  if (edamame) {
    if (edamame.isVegetarian !== true) errors.push('GOLDEN edamame: isVegetarian must be true (leaf icon)');
    if (edamame.isGlutenFree !== true) errors.push('GOLDEN edamame: isGlutenFree must be true (crossed wheat-ear icon)');
    if (edamame.nameJp !== '枝豆') errors.push(`GOLDEN edamame: nameJp is ${JSON.stringify(edamame.nameJp)}, expected "枝豆"`);
  }
  const tantan = item('tantan-ramen');
  if (tantan && JSON.stringify(tantan.badges) !== JSON.stringify(['bestseller'])) {
    errors.push(`GOLDEN tantan-ramen: badges are ${JSON.stringify(tantan.badges)}, expected ["bestseller"]`);
  }
  const annee = item('annee-lumiere-2023');
  if (annee) {
    if (annee.priceOnRequest !== true) errors.push('GOLDEN annee-lumiere-2023: priceOnRequest must be true');
    if (annee.price !== undefined || annee.prices !== undefined) errors.push('GOLDEN annee-lumiere-2023: must have no price / prices');
  }

  const withImage = [...items.values()].filter((it) => it.imageFrom !== undefined);
  for (const it of withImage) {
    if (!(it.key in GOLDEN_IMAGE_FROM)) errors.push(`GOLDEN ${it.key}: imageFrom is only allowed on ${Object.keys(GOLDEN_IMAGE_FROM).join(', ')}`);
  }
  for (const [k, legacyId] of Object.entries(GOLDEN_IMAGE_FROM)) {
    const it = item(k);
    if (it && it.imageFrom !== legacyId) errors.push(`GOLDEN ${k}: imageFrom is ${JSON.stringify(it.imageFrom)}, expected "${legacyId}"`);
  }
}

/** Validate the menu JSON. Returns a list of errors (empty = valid). */
export function validateMenu(json) {
  const errors = [];
  if (!isObj(json)) return ['root: must be a JSON object'];

  // ── top level ──────────────────────────────────────────────────────────
  if (json.version !== 1) errors.push('root.version: must be 1');
  if (!isObj(json.sources) || !isNonEmptyStr(json.sources.food) || !isNonEmptyStr(json.sources.drinks)) {
    errors.push('root.sources: must be { food, drinks } (paths of the print PDFs)');
  }
  if (!isNonEmptyStr(json.transcribedAt) || Number.isNaN(Date.parse(json.transcribedAt))) {
    errors.push('root.transcribedAt: must be an ISO date');
  }

  // (g) corrections + ekToConfirm
  if (!Array.isArray(json.corrections) || json.corrections.length === 0) {
    errors.push('root.corrections: must be a non-empty array of { where, print, web, reason }');
  } else {
    json.corrections.forEach((c, i) => {
      if (!isObj(c)) return errors.push(`corrections[${i}]: must be an object`);
      for (const f of CORRECTION_FIELDS) if (!isNonEmptyStr(c[f])) errors.push(`corrections[${i}].${f}: must be a non-empty string`);
      for (const k of Object.keys(c)) if (!CORRECTION_FIELDS.includes(k)) errors.push(`corrections[${i}]: unknown field "${k}"`);
    });
    if (!json.corrections.some((c) => typeof c?.print === 'string' && c.print.includes('Asashi'))) {
      errors.push('root.corrections: must record the « Asashi » → « Asahi » correction');
    }
    const worded = json.corrections.filter((c) => typeof c?.print === 'string' && /points d'interrogation/.test(c.print));
    if (worded.length < 2) {
      errors.push("root.corrections: the two print placeholders (Trio description, Année Lumière prices) must be worded « … en points d'interrogation »");
    }
  }
  if (!Array.isArray(json.ekToConfirm) || json.ekToConfirm.length < 10 || !json.ekToConfirm.every(isNonEmptyStr)) {
    errors.push('root.ekToConfirm: must be an array of at least 10 non-empty strings');
  }

  // (f) no "??" anywhere in the file (print placeholders are worded in corrections)
  walkStrings(json, 'root', (path, s) => {
    if (s.includes('??')) errors.push(`${path}: contains "??" (describe print placeholders in words)`);
  });

  if (!Array.isArray(json.categories)) {
    errors.push('root.categories: must be an array');
    return errors;
  }

  // (f) web strings: nothing under categories may carry a print placeholder, the Asashi typo or a dotted degree
  walkStrings(json.categories, 'categories', (path, s) => {
    if (/Asashi/.test(s)) errors.push(`${path}: contains the print typo « Asashi » (use « Asahi »)`);
    if (/\d\.\d+\s*°/.test(s)) errors.push(`${path}: dotted degree ${JSON.stringify(s)} (use a French decimal comma, e.g. 15,5°)`);
  });

  // ── (a) categories: keys, order, sections ───────────────────────────────
  const catKeys = json.categories.map((c) => c?.key);
  if (JSON.stringify(catKeys) !== JSON.stringify(EXPECTED_CATEGORY_KEYS)) {
    errors.push(`categories: keys must be exactly, in print order: ${EXPECTED_CATEGORY_KEYS.join(', ')} (got: ${catKeys.join(', ')})`);
  }
  let seenDrinks = false;
  const itemKeys = new Map();
  const legacyOwners = new Map();
  let itemCount = 0;

  json.categories.forEach((cat, ci) => {
    const cw = `categories[${ci}]${cat?.key ? ` (${cat.key})` : ''}`;
    if (!isObj(cat)) return errors.push(`${cw}: must be an object`);
    for (const k of Object.keys(cat)) if (!CATEGORY_FIELDS.has(k)) errors.push(`${cw}: unknown field "${k}"`);
    if (!isNonEmptyStr(cat.key) || !KEY_RE.test(cat.key)) errors.push(`${cw}.key: must match ${KEY_RE}`);
    if (!SECTIONS.includes(cat.section)) errors.push(`${cw}.section: must be one of ${SECTIONS.join(' | ')}`);
    if (cat.section === 'drinks') seenDrinks = true;
    if (cat.section === 'food' && seenDrinks) errors.push(`${cw}: food category after a drinks category (all food categories come first)`);
    checkLocale(errors, `${cw}.name`, cat.name, { required: true });
    if (isObj(cat.name) && isNonEmptyStr(cat.name.fr) && cat.name.fr === cat.name.fr.toUpperCase() && /\p{Lu}{4,}/u.test(cat.name.fr)) {
      errors.push(`${cw}.name.fr: ALL-CAPS heading ${JSON.stringify(cat.name.fr)} (write it in title case, the UI uppercases)`);
    }
    if (!isNonEmptyStr(cat.nameJp)) errors.push(`${cw}.nameJp: must be a non-empty string (JP label as printed)`);
    checkLocale(errors, `${cw}.description`, cat.description, { required: false });
    checkLocale(errors, `${cw}.footnote`, cat.footnote, { required: false });

    if (!Array.isArray(cat.items) || cat.items.length === 0) {
      errors.push(`${cw}.items: must be a non-empty array`);
      return;
    }
    cat.items.forEach((item, ii) => {
      itemCount += 1;
      const iw = `${cw}.items[${ii}]${item?.key ? ` (${item.key})` : ''}`;
      if (!isObj(item)) return errors.push(`${iw}: must be an object`);
      for (const k of Object.keys(item)) if (!ITEM_FIELDS.has(k)) errors.push(`${iw}: unknown field "${k}"`);

      // (b) keys
      if (!isNonEmptyStr(item.key) || !KEY_RE.test(item.key)) errors.push(`${iw}.key: must match ${KEY_RE}`);
      else if (itemKeys.has(item.key)) errors.push(`${iw}.key: duplicate item key (also in ${itemKeys.get(item.key)})`);
      else itemKeys.set(item.key, cat.key);

      // (c) texts
      checkLocale(errors, `${iw}.name`, item.name, { required: true });
      if (isObj(item.name) && isNonEmptyStr(item.name.fr) && item.name.fr === item.name.fr.toUpperCase() && /\p{Lu}{4,}/u.test(item.name.fr)) {
        errors.push(`${iw}.name.fr: ALL-CAPS name ${JSON.stringify(item.name.fr)} (write it in title case, the UI uppercases)`);
      }
      if (item.nameJp !== undefined && !isNonEmptyStr(item.nameJp)) errors.push(`${iw}.nameJp: must be a non-empty string when present`);
      checkLocale(errors, `${iw}.description`, item.description, { required: false });
      checkLocale(errors, `${iw}.subgroup`, item.subgroup, { required: false });

      // (d) exactly one pricing mode
      const modes = [item.price !== undefined, item.prices !== undefined, item.priceOnRequest !== undefined].filter(Boolean).length;
      if (modes !== 1) errors.push(`${iw}: exactly one of price | prices | priceOnRequest is required (got ${modes})`);
      if (item.price !== undefined && !isPrice(item.price)) errors.push(`${iw}.price: must be a number > 0 with at most 2 decimals`);
      if (item.priceOnRequest !== undefined && item.priceOnRequest !== true) errors.push(`${iw}.priceOnRequest: must be true when present`);
      if (item.prices !== undefined) {
        if (!Array.isArray(item.prices) || item.prices.length === 0) errors.push(`${iw}.prices: must be a non-empty array`);
        else
          item.prices.forEach((v, vi) => {
            const vw = `${iw}.prices[${vi}]`;
            if (!isObj(v)) return errors.push(`${vw}: must be an object`);
            for (const k of Object.keys(v)) if (!VARIANT_FIELDS.has(k)) errors.push(`${vw}: unknown field "${k}"`);
            if (!isPrice(v.price)) errors.push(`${vw}.price: must be a number > 0 with at most 2 decimals`);
            const hasQty = v.quantity !== undefined || v.unit !== undefined;
            if (hasQty) {
              if (!(typeof v.quantity === 'number' && v.quantity > 0)) errors.push(`${vw}.quantity: must be a number > 0`);
              if (!UNITS.includes(v.unit)) errors.push(`${vw}.unit: must be one of ${UNITS.join(' | ')}`);
            }
            if (v.label !== undefined) checkLocale(errors, `${vw}.label`, v.label, { required: true });
            if (!hasQty && v.label === undefined) errors.push(`${vw}: needs quantity + unit, or a label`);
          });
      }

      // (e) markers, legacy mapping, photo source
      if (item.badges !== undefined) {
        if (!Array.isArray(item.badges) || item.badges.length === 0) errors.push(`${iw}.badges: must be a non-empty array when present`);
        else {
          for (const b of item.badges) if (!BADGES.includes(b)) errors.push(`${iw}.badges: unknown badge "${b}" (allowed: ${BADGES.join(', ')})`);
          if (new Set(item.badges).size !== item.badges.length) errors.push(`${iw}.badges: duplicate badge`);
        }
      }
      for (const f of ['isVegetarian', 'isGlutenFree']) {
        if (item[f] !== undefined && typeof item[f] !== 'boolean') errors.push(`${iw}.${f}: must be a boolean when present`);
      }
      if (item.legacyIds !== undefined) {
        if (!Array.isArray(item.legacyIds) || item.legacyIds.length === 0 || !item.legacyIds.every(isNonEmptyStr)) {
          errors.push(`${iw}.legacyIds: must be a non-empty array of document ids`);
        } else {
          for (const id of item.legacyIds) {
            if (id.startsWith('m26-') || id.startsWith('drafts.')) errors.push(`${iw}.legacyIds: "${id}" is not a legacy published id`);
            else if (legacyOwners.has(id)) errors.push(`${iw}.legacyIds: "${id}" is already mapped by ${legacyOwners.get(id)}`);
            else legacyOwners.set(id, item.key);
          }
        }
      }
      if (item.imageFrom !== undefined) {
        if (!isNonEmptyStr(item.imageFrom) || item.imageFrom.startsWith('m26-') || item.imageFrom.startsWith('drafts.')) {
          errors.push(`${iw}.imageFrom: must be a legacy published document id (not m26-*)`);
        }
      }
    });
  });

  if (itemCount !== EXPECTED_ITEM_COUNT) errors.push(`categories: ${itemCount} items, expected ${EXPECTED_ITEM_COUNT}`);

  // (h) golden values from the print
  checkGolden(errors, json);

  return errors;
}
