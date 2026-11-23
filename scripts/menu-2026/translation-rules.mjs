/**
 * UMAÏ Ramen: translation rules of the 2026 menu (Phase 14, EN / DE / IT / ZH next to the FR print).
 *
 * No imports, no I/O. Used by check-translations.mjs (CLI) and by the Phase 14 publishing tools.
 *
 * EK locks (2026-11-22 / 2026-11-23):
 *   - Claude translates: no machine-translation API, no runtime translation (native review optional, later).
 *   - Chinese is SIMPLIFIED Chinese only (zh-Hans): no traditional or Japanese-only character, no kana.
 *   - Japanese dish names and brand / proper names stay as printed in every language; the ZH name may append
 *     the common Chinese name in full-width parentheses (« Karaage（日式炸鸡） »). French-named items are
 *     translated naturally (the FR name stays visible as the Phase 13 secondary line).
 *   - Descriptions explain the dish in a few words; never an invented ingredient, never an allergen claim.
 *
 * Keep FORBIDDEN_TEXT and LEGACY_ABSENT in sync with scripts/menu-2026/verify-live.mjs (its PRESENT checks:
 * « ?? », « Asashi », the locale's menu.formulesTitle and the legacy names), so that a translation can never
 * make the live verification fail.
 *
 *   translatableFields(menu, { section })    -> [{ path, scope, catKey, key, field, index?, value }]
 *   mergeTranslations(base, overlays)        -> { menu, errors }   (never mutates its inputs)
 *   validateTranslations(menu, { section })  -> string[]           (empty = valid)
 *   formatMenuJson(menu)                     -> string             (the file style of menu-2026.json)
 *   overlaySkeleton(menu, section)           -> overlay object     (fr filled, en/de/it/zh = '')
 *
 * Overlay file (translations-2026-food.json, translations-2026-drinks.json):
 *   { version: 1, section: 'food' | 'drinks',
 *     categories: { <catKey>: { name?, description?, footnote? } },
 *     items: { <itemKey>: { name?, description?, subgroup?, prices?: [ { label } | null ] } } }
 *   where every field is a Loc { fr, en, de, it, zh } whose fr repeats the menu's FR text exactly.
 */

export const TRANSLATION_LOCALES = ['en', 'de', 'it', 'zh'];
const LOC_KEYS = ['fr', ...TRANSLATION_LOCALES];
const SECTIONS = ['food', 'drinks'];

// ── rule constants ─────────────────────────────────────────────────────────────

/** Item names printed in Japanese, English or as a brand: kept as printed, no ZH gloss. */
const INVARIANT_NAMES_NO_GLOSS = [
  'little-tokyo',
  'asahi',
  'asahi-yuzu',
  'asahi-sake',
  'asahi-super-dry',
  'coedo-ipa',
  'nana-spritz',
  'natsu',
  'sakura-blossom',
  'nana',
  'hachiko',
  'lovely',
  'coca-cola',
  'zaku',
  'kinrei',
  'fu',
  'jidai-okure',
  'junmaishu',
  'atelier-du-sake',
  'toki',
  'nikka-from-the-barrel',
  'the-chita',
  'hibiki',
  'yamazaki',
];

/** Item names kept as printed, ZH = « <fr>（<gloss>） » (full-width parentheses, no space). */
export const ZH_ITEM_GLOSS = {
  karaage: '日式炸鸡',
  gyozas: '煎饺',
  takoyaki: '章鱼小丸子',
  edamame: '盐水毛豆',
  'tantan-ramen': '担担拉面',
  'yasai-ramen': '素食担担拉面',
  'tantan-mazesoba': '担担拌面',
  'tantan-tsukemen': '担担蘸面',
  'yuzu-ramen': '柚子拉面',
  'tokyo-ramen': '东京拉面',
  'wantan-ramen': '云吞拉面',
  'miso-ramen': '味噌拉面',
  'karaage-mazesoba': '炸鸡拌面',
  'chashu-mazesoba': '叉烧拌面',
  'tofu-mazesoba': '豆腐拌面',
  'tantan-udon': '担担乌冬面',
  'udon-karaage': '炸鸡乌冬面',
  'mini-ramen': '迷你拉面',
  'yuzu-spritz': '柚子气泡鸡尾酒',
  'umeshu-spritz': '梅酒气泡鸡尾酒',
  'peach-passion-spritz': '蜜桃百香果气泡鸡尾酒',
  highball: '嗨棒',
  'ginger-highball': '姜汁嗨棒',
  ramune: '波子汽水',
  diabolo: '果味汽水',
  'riesling-alsace-sperry': '阿尔萨斯雷司令',
  'chardonnay-naturalys': '霞多丽',
};

/** The 51 item names that stay as printed (en = de = it = fr; zh = fr or fr（gloss）). */
export const INVARIANT_ITEM_NAMES = new Set([...INVARIANT_NAMES_NO_GLOSS, ...Object.keys(ZH_ITEM_GLOSS)]);

/** Category names kept as printed, with their ZH gloss. */
export const ZH_CATEGORY_GLOSS = {
  'tantan-umai': '担担面',
  ramen: '拉面',
  mazesoba: '日式拌面',
  udon: '乌冬面',
  spritz: '气泡鸡尾酒',
  highball: '嗨棒',
};
export const INVARIANT_CATEGORY_NAMES = new Set(Object.keys(ZH_CATEGORY_GLOSS));

/** Whole-field texts identical in every language (sizes, producer and estate lines). */
export const INVARIANT_TEXTS = ['25cl', '30cl', '20cl', '4cl', '3 × 6cl', 'Gérard Bertrand', 'Domaine Le Clos des Lumières'];

/** Brands and proper names (14-CONTEXT): when the FR text has one, every translation keeps it verbatim. */
export const BRANDS = [
  'Asahi',
  'Coedo IPA',
  'Lisbeth',
  'Coca-Cola',
  'Toki',
  'Nikka from the Barrel',
  'The Chita',
  'Hibiki',
  'Yamazaki',
  'Ryoma',
  'Kiyomi',
  'Zaku',
  'Kinrei',
  'Fu',
  'Jidai okure',
  'Junmaishu',
  'Atelier du saké',
  'Sperry',
  'Naturalys',
  'Gérard Bertrand',
  'Année Lumière',
  'Domaine Le Clos des Lumières',
  'Grand jasmin Chun Feng',
  'Fleur de Geisha',
  'Moulin de Sarralbe',
  'Umaï',
];

/** Japanese terms: kept in EN / DE / IT when the FR text has them (compared without diacritics). */
export const JP_TERMS = [
  'karaage',
  'gyoza',
  'takoyaki',
  'edamame',
  'tantan',
  'ramen',
  'mazesoba',
  'tsukemen',
  'udon',
  'wantan',
  'miso',
  'yuzu',
  'chashu',
  'teriyaki',
  'tofu',
  'daikon',
  'nori',
  'tsuyu',
  'onsen',
  'mochi',
  'matcha',
  'sakura',
  'sake',
  'umeshu',
  'ramune',
  'highball',
  'sencha',
  'genmaicha',
];

/**
 * Glossary (14-CONTEXT + meat identity). When `fr` matches the FR text, the translation (lowercased) must
 * contain one of the strings listed for its locale. `source`: CONTEXT = locked by 14-CONTEXT, planner = added.
 */
export const GLOSSARY = [
  { fr: /pak-cho[iï]/i, en: ['bok choy'], de: ['pak choi'], it: ['pak choi'], zh: ['小白菜'], source: 'CONTEXT' },
  { fr: /\bdaikon\b/i, en: ['daikon'], de: ['daikon'], it: ['daikon'], zh: ['白萝卜'], source: 'CONTEXT' },
  { fr: /c[ée]bette/i, en: ['spring onion'], de: ['frühlingszwiebel'], it: ['cipollott'], zh: ['葱花'], source: 'CONTEXT' },
  { fr: /(œ|oe)uf mariné/i, en: ['marinated egg'], de: ['mariniertes ei'], it: ['uovo marinato'], zh: ['溏心蛋'], source: 'CONTEXT' },
  { fr: /(œ|oe)uf onsen/i, en: ['onsen egg'], de: ['onsen-ei'], it: ['uovo onsen'], zh: ['温泉蛋'], source: 'CONTEXT' },
  { fr: /\bchashu\b/i, en: ['chashu'], de: ['chashu'], it: ['chashu'], zh: ['叉烧'], source: 'CONTEXT' },
  { fr: /tofu teriyaki/i, en: ['teriyaki tofu'], de: ['teriyaki-tofu'], it: ['tofu teriyaki'], zh: ['照烧豆腐'], source: 'CONTEXT' },
  {
    fr: /b(œ|oe)uf haché aux cinq épices/i,
    en: ['five-spice minced beef'],
    de: ['hackfleisch mit fünf-gewürze'],
    it: ['manzo macinato alle cinque spezie'],
    zh: ['五香牛肉末'],
    source: 'CONTEXT',
  },
  { fr: /huile de piment/i, en: ['chili oil'], de: ['chiliöl'], it: ['olio al peperoncino'], zh: ['辣油'], source: 'CONTEXT' },
  { fr: /pâte de sésame/i, en: ['sesame paste'], de: ['sesampaste'], it: ['pasta di sesamo'], zh: ['芝麻酱'], source: 'CONTEXT' },
  { fr: /bouillon tsuyu/i, en: ['tsuyu broth'], de: ['tsuyu-brühe'], it: ['brodo tsuyu'], zh: ['日式酱油汤底'], source: 'CONTEXT' },
  { fr: /b(œ|oe)uf haché(?! aux cinq)/i, en: ['minced beef'], de: ['rinderhack'], it: ['manzo macinato'], zh: ['牛肉末'], source: 'planner' },
  { fr: /pousses de soja/i, en: ['bean sprouts'], de: ['sojasprossen'], it: ['germogli di soia'], zh: ['豆芽'], source: 'planner' },
  { fr: /\bporc\b/i, en: ['pork'], de: ['schwein'], it: ['maiale'], zh: ['猪'], source: 'planner' },
  { fr: /\bpoulet\b/i, en: ['chicken'], de: ['huhn', 'hähnchen', 'hühner'], it: ['pollo'], zh: ['鸡'], source: 'planner' },
  { fr: /\bb(œ|oe)uf\b/i, en: ['beef'], de: ['rind'], it: ['manzo'], zh: ['牛'], source: 'planner' },
  { fr: /\bpoulpe\b/i, en: ['octopus'], de: ['oktopus', 'krake'], it: ['polpo'], zh: ['章鱼'], source: 'planner' },
  { fr: /\blégumes\b/i, en: ['vegetable'], de: ['gemüse'], it: ['verdur', 'vegetal'], zh: ['蔬菜', '素'], source: 'planner' },
  { fr: /\bexpresso\b/i, en: ['espresso'], de: ['espresso'], it: ['espresso'], zh: ['浓缩咖啡'], source: 'planner' },
];

/** Characters that are NOT simplified Chinese: traditional-only forms and Japanese-only forms (麺 揚 焼 鶏 醤 々). */
export const NOT_SIMPLIFIED =
  '麵雞豬湯醬蔥蘿蔔餃魚燒雙濃檸薑綠熱選擇種類無麩質鹽價點飲單釀純時兒們這個從與來東軟漿葉麥黃紅藍鬆層圓塊絲調飯豐頭樣為對會實發現處體驗國歐義鮮蝦蘇筍餡餅團蓮鍋燉滷醃漬鹹蘋鳳腸蠔盤壺氣煙燻樂歡請詢問員務費嚐嘗糰灣溫條寬細濕乾雜鐘隻兩幾萬號紙網線舊傳統經風獨嚴順輕優麗華製創師專業隊麺揚焼鶏醤々';

/**
 * Texts that must never appear in a translation (case-sensitive): verify-live.mjs fails a menu page on « ?? »,
 * « Asashi » and on the locale's menu.formulesTitle (fr « Nos Formules », en « Our Set Menus »,
 * de « Unsere Menüs », it « I nostri menù fissi », zh « 套餐 »): e.g. « 儿童餐 », never « 儿童套餐 ».
 */
export const FORBIDDEN_TEXT = {
  all: ['??', 'Asashi'],
  en: ['Our Set Menus'],
  de: ['Unsere Menüs'],
  it: ['menù fissi'],
  zh: ['套餐'],
};

/** Legacy (eazee-link 2026-07) names that verify-live.mjs expects to be absent from every menu page. */
export const LEGACY_ABSENT = [
  'Ramen Paitan',
  'Ramen Chintan',
  'Paitan Ramen',
  'Chintan Ramen',
  'Gyoza canard',
  'Gyoza crevette',
  'Menu Gyoza',
  'Hakodate Ramen',
  'Kamo Soba',
  'Katsu Curry Mazesoba',
  'Udon carbonara',
  'Udon Tempura',
  'Kimchi',
  'Panaché',
  'Picon bière',
  'Kokoro',
  'Apérol Spritz',
  'Vieilles prune',
  'Wantan Men Ramen',
  'Yasaï Ramen',
  'Chashu supplémentaire',
  'Portion de nouilles',
];

/** TRANS-02: FR descriptions that do not say what the dish is; the translation must explain it. */
export const REQUIRED_GLOSSES = {
  'tantan-udon': { en: 'wheat noodles', de: 'Weizennudeln', it: 'noodles di grano', zh: '乌冬' },
  ramune: { en: 'Japanese soda', de: 'japanische Limonade', it: 'bibita giapponese', zh: '汽水' },
  diabolo: { en: 'lemonade', de: 'Limonade', it: 'limonata', zh: '汽水' },
};

// ── helpers ────────────────────────────────────────────────────────────────────

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonBlank = (v) => typeof v === 'string' && v.trim().length > 0;
const isLoc = (v) => isObj(v) && isNonBlank(v.fr);
const codePoints = (s) => [...s].length;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const q = (s) => JSON.stringify(s);

const CATEGORY_FIELDS = ['name', 'description', 'footnote'];
const ITEM_TEXT_FIELDS = ['name', 'description', 'subgroup'];

// ── translatableFields ─────────────────────────────────────────────────────────

/**
 * Every translatable Loc object (fr non-empty) of the menu, in print order:
 * categories.<c>.name, categories.<c>.description, then per item items.<k>.name, .description, .subgroup,
 * .prices[<i>].label, then categories.<c>.footnote. `value` is the Loc object itself (same reference).
 */
export function translatableFields(menu, { section } = {}) {
  const out = [];
  const categories = Array.isArray(menu?.categories) ? menu.categories : [];
  for (const cat of categories) {
    if (!isObj(cat)) continue;
    if (section !== undefined && section !== null && cat.section !== section) continue;
    const catKey = cat.key;
    const addCategoryField = (field) => {
      if (isLoc(cat[field])) out.push({ path: `categories.${catKey}.${field}`, scope: 'category', catKey, key: catKey, field, value: cat[field] });
    };
    addCategoryField('name');
    addCategoryField('description');
    for (const item of Array.isArray(cat.items) ? cat.items : []) {
      if (!isObj(item)) continue;
      const key = item.key;
      for (const field of ITEM_TEXT_FIELDS) {
        if (isLoc(item[field])) out.push({ path: `items.${key}.${field}`, scope: 'item', catKey, key, field, value: item[field] });
      }
      (Array.isArray(item.prices) ? item.prices : []).forEach((variant, index) => {
        if (isObj(variant) && isLoc(variant.label)) {
          out.push({ path: `items.${key}.prices[${index}].label`, scope: 'item', catKey, key, field: 'label', index, value: variant.label });
        }
      });
    }
    addCategoryField('footnote');
  }
  return out;
}

// ── mergeTranslations ──────────────────────────────────────────────────────────

/**
 * Merge staging overlays into a deep copy of the menu. Errors:
 *   OVERLAY <overlay>: …   bad shape (non-object entry, non-string value, unknown locale key or field,
 *                          version ≠ 1, prices length ≠ the menu's, entry of another section)
 *   ORPHAN <path>          the overlay defines a field the menu does not have (no FR text)
 *   DUPLICATE <path>       two overlays (or the same overlay twice) define the field
 *   STALE <path>           the overlay's fr differs from the menu's fr (translation not applied)
 *   CONFLICT <path>.<l>    the menu already holds a different non-empty value (the menu value is kept)
 * A missing overlay entry is not an error (validateTranslations reports MISSING values). A blank overlay
 * value never overrides a menu value. Merged Loc objects are rewritten in key order fr, en, de, it, zh.
 * `names` (optional) labels the overlays in error messages (e.g. their file names).
 */
export function mergeTranslations(base, overlays, { names = [] } = {}) {
  const menu = structuredClone(base);
  const errors = [];
  const index = new Map(translatableFields(menu).map((f) => [f.path, f]));
  const owners = new Map(); // 'categories.<c>' | 'items.<k>' -> { section, prices? }
  for (const cat of Array.isArray(menu?.categories) ? menu.categories : []) {
    if (!isObj(cat)) continue;
    owners.set(`categories.${cat.key}`, { section: cat.section });
    for (const item of Array.isArray(cat.items) ? cat.items : []) {
      if (isObj(item)) owners.set(`items.${item.key}`, { section: cat.section, prices: item.prices });
    }
  }
  const merged = new Set();
  const list = Array.isArray(overlays) ? overlays : overlays === undefined || overlays === null ? [] : [overlays];

  list.forEach((overlay, oi) => {
    const label = names[oi] ?? `overlays[${oi}]${isObj(overlay) && typeof overlay.section === 'string' ? ` (${overlay.section})` : ''}`;
    const bad = (message) => errors.push(`OVERLAY ${label}: ${message}`);
    if (!isObj(overlay)) {
      bad('must be an object { version, section, categories, items }');
      return;
    }
    if (overlay.version !== 1) bad(`version must be 1 (got ${q(overlay.version)})`);
    for (const k of Object.keys(overlay)) if (!['version', 'section', 'categories', 'items'].includes(k)) bad(`unknown key ${q(k)}`);
    const section = overlay.section;
    if (section !== undefined && !SECTIONS.includes(section)) bad(`section must be ${SECTIONS.join(' or ')} (got ${q(section)})`);

    const apply = (path, loc) => {
      if (!isObj(loc)) {
        bad(`${path} must be a locale object { fr, en, de, it, zh }`);
        return;
      }
      let shapeOk = true;
      for (const [l, v] of Object.entries(loc)) {
        if (!LOC_KEYS.includes(l)) {
          bad(`${path}: unknown locale key ${q(l)} (allowed: ${LOC_KEYS.join(', ')})`);
          shapeOk = false;
        } else if (typeof v !== 'string') {
          bad(`${path}.${l} must be a string`);
          shapeOk = false;
        }
      }
      if (!shapeOk) return;
      const target = index.get(path);
      if (!target) {
        errors.push(`ORPHAN ${path} (${label}: no FR text in the menu)`);
        return;
      }
      if (merged.has(path)) {
        errors.push(`DUPLICATE ${path} (${label})`);
        return;
      }
      merged.add(path);
      const current = target.value;
      if (loc.fr !== current.fr) {
        errors.push(`STALE ${path} overlay fr ${q(loc.fr)}, menu fr ${q(current.fr)} (${label})`);
        return;
      }
      const next = {};
      for (const l of TRANSLATION_LOCALES) {
        const value = loc[l];
        if (isNonBlank(value)) {
          if (isNonBlank(current[l]) && current[l] !== value) {
            errors.push(`CONFLICT ${path}.${l} menu has ${q(current[l])}, overlay has ${q(value)} (${label})`);
          } else {
            next[l] = value;
          }
        } else if (typeof value === 'string' && current[l] === undefined) {
          next[l] = value;
        }
      }
      // rewrite in place (the index keeps its reference): fr, en, de, it, zh, then anything else the menu had
      const rebuilt = { fr: current.fr };
      for (const l of TRANSLATION_LOCALES) {
        if (l in next) rebuilt[l] = next[l];
        else if (current[l] !== undefined) rebuilt[l] = current[l];
      }
      for (const [k, v] of Object.entries(current)) if (!(k in rebuilt)) rebuilt[k] = v;
      for (const k of Object.keys(current)) delete current[k];
      Object.assign(current, rebuilt);
    };

    const walk = (group, allowed) => {
      const entries = overlay[group];
      if (entries === undefined) return;
      if (!isObj(entries)) {
        bad(`${group} must be an object keyed by ${group === 'items' ? 'item' : 'category'} key`);
        return;
      }
      for (const [key, entry] of Object.entries(entries)) {
        const where = `${group}.${key}`;
        if (!isObj(entry)) {
          bad(`${where} must be an object`);
          continue;
        }
        const owner = owners.get(where);
        if (owner && SECTIONS.includes(section) && owner.section !== section) bad(`${where} belongs to section ${owner.section}`);
        for (const [field, value] of Object.entries(entry)) {
          if (!allowed.includes(field)) {
            bad(`${where}: unknown field ${q(field)} (allowed: ${allowed.join(', ')})`);
            continue;
          }
          if (field !== 'prices') {
            apply(`${where}.${field}`, value);
            continue;
          }
          if (!Array.isArray(value)) {
            bad(`${where}.prices must be an array ([ { label } | null ], one entry per price variant)`);
            continue;
          }
          if (owner && Array.isArray(owner.prices) && owner.prices.length !== value.length) {
            bad(`${where}.prices has ${value.length} entries, the menu item has ${owner.prices.length} price variants`);
          }
          value.forEach((variant, i) => {
            if (variant === null) return;
            if (!isObj(variant) || Object.keys(variant).length !== 1 || !('label' in variant)) {
              bad(`${where}.prices[${i}] must be null or { "label": { fr, en, de, it, zh } }`);
              return;
            }
            apply(`${where}.prices[${i}].label`, variant.label);
          });
        }
      }
    };
    walk('categories', CATEGORY_FIELDS);
    walk('items', [...ITEM_TEXT_FIELDS, 'prices']);
  });

  return { menu, errors };
}

// ── validateTranslations ───────────────────────────────────────────────────────

const HANZI = /[一-鿿]/;
const KANA = /[぀-ヿ]/;
const CJK_SCRIPT = /[぀-ヿ一-鿿]/;
const FULLWIDTH_DIGIT = /[０-９]/;
const ASCII_PUNCT_AFTER_HANZI = /[一-鿿][,.:;!?]/;
const ASCII_PARENS_AROUND_HANZI = /\([^()]*[一-鿿][^()]*\)/;
// STYLE: in ZH a space is allowed only between Hanzi and a Latin brand (« 或 Grand jasmin Chun Feng »).
const ZH_SPACE = /[一-鿿]\s+[一-鿿]|[、-〿＀-￯]\s|\s[、-〿＀-￯]/;
const NOT_SIMPLIFIED_SET = new Set([...NOT_SIMPLIFIED]);
const BRAND_RES = BRANDS.map((b) => [b, new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(b)}(?![\\p{L}\\p{N}])`, 'u')]);
const JP_TERM_RES = JP_TERMS.map((t) => [t, new RegExp(`(?<![a-z])${escapeRe(t)}`)]);
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const numbersOf = (s) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).sort().join('|');

/** The invariant form of a field: { other, zh, noGloss } or null when the field is translated. */
function invariantOf(f) {
  const fr = f.value.fr;
  if (f.field === 'name' && f.scope === 'item' && INVARIANT_ITEM_NAMES.has(f.key)) {
    const gloss = Object.hasOwn(ZH_ITEM_GLOSS, f.key) ? ZH_ITEM_GLOSS[f.key] : undefined;
    return { other: fr, zh: gloss ? `${fr}（${gloss}）` : fr, noGloss: !gloss };
  }
  if (f.field === 'name' && f.scope === 'category' && INVARIANT_CATEGORY_NAMES.has(f.key)) {
    const gloss = Object.hasOwn(ZH_CATEGORY_GLOSS, f.key) ? ZH_CATEGORY_GLOSS[f.key] : undefined;
    return { other: fr, zh: gloss ? `${fr}（${gloss}）` : fr, noGloss: !gloss };
  }
  if (INVARIANT_TEXTS.includes(fr)) return { other: fr, zh: fr, noGloss: true };
  return null;
}

/**
 * Check the en / de / it / zh values of every translatable field (optionally one section). Rules, each error
 * starting with its id then `<path>.<locale>`:
 *   MISSING    absent, non-string or blank value (the other rules skip it)
 *   INVARIANT  Japanese / brand names and sizes identical to FR; ZH = « fr（gloss） » when a gloss is declared
 *   BRAND      every brand of the FR text kept verbatim, not glued to a letter or a Hanzi
 *   JPTERM     EN/DE/IT keep every Japanese term of the FR text (diacritics-insensitive)
 *   GLOSSARY   CONTEXT glossary renderings and meat identity
 *   NUMBERS    the same numbers as FR
 *   SCRIPT     ZH: simplified Hanzi only, no kana, ASCII digits, full-width punctuation, no stray space;
 *              EN/DE/IT: no Hanzi or kana
 *   TYPO       no em-dash, no typographic apostrophe, no leading/trailing/double space; no French spacing (EN/DE/IT)
 *   FORBIDDEN  FORBIDDEN_TEXT + LEGACY_ABSENT (verify-live PRESENT checks)
 *   SUBGROUP   the same FR sub-group has the same translation everywhere
 *   LENGTH     descriptions / footnotes (FR ≥ 15 characters): EN/DE/IT in [0.5×, 2×+30], ZH in [0.15×, 1.2×+20]
 *   GLOSS      REQUIRED_GLOSSES (TRANS-02)
 */
export function validateTranslations(menu, { section } = {}) {
  const errors = [];
  const subgroups = new Map();
  for (const f of translatableFields(menu, { section })) {
    const fr = f.value.fr;
    const invariant = invariantOf(f);
    for (const l of TRANSLATION_LOCALES) {
      const v = f.value[l];
      const at = `${f.path}.${l}`;
      if (!isNonBlank(v)) {
        errors.push(`MISSING ${at}`);
        continue;
      }

      // INVARIANT
      if (invariant) {
        const expected = l === 'zh' ? invariant.zh : invariant.other;
        if (v !== expected) errors.push(`INVARIANT ${at} must be ${q(expected)} (got ${q(v)})`);
      }

      // BRAND
      for (const [brand, re] of BRAND_RES) {
        if (re.test(fr) && !re.test(v)) errors.push(`BRAND ${at} must keep ${q(brand)} verbatim, not glued to a letter (got ${q(v)})`);
      }

      // JPTERM
      if (l !== 'zh') {
        const ffr = fold(fr);
        const fv = fold(v);
        for (const [term, re] of JP_TERM_RES) {
          if (re.test(ffr) && !re.test(fv)) errors.push(`JPTERM ${at} must keep the Japanese term ${q(term)} (got ${q(v)})`);
        }
      }

      // GLOSSARY
      const lower = v.toLowerCase();
      for (const row of GLOSSARY) {
        if (row.fr.test(fr) && !row[l].some((s) => lower.includes(s))) {
          errors.push(`GLOSSARY ${at} needs ${row[l].map(q).join(' or ')} for FR ${row.fr} (got ${q(v)})`);
        }
      }

      // NUMBERS
      if (numbersOf(fr) !== numbersOf(v)) errors.push(`NUMBERS ${at} has [${numbersOf(v)}], FR has [${numbersOf(fr)}]`);

      // SCRIPT
      if (l === 'zh') {
        if (KANA.test(v)) errors.push(`SCRIPT ${at} contains kana (Japanese script)`);
        const notSimplified = [...new Set([...v].filter((ch) => NOT_SIMPLIFIED_SET.has(ch)))];
        if (notSimplified.length) errors.push(`SCRIPT ${at} not simplified Chinese: ${notSimplified.join(' ')}`);
        if (FULLWIDTH_DIGIT.test(v)) errors.push(`SCRIPT ${at} full-width digits (write ASCII digits, e.g. 10cl)`);
        if (ASCII_PUNCT_AFTER_HANZI.test(v)) errors.push(`SCRIPT ${at} ASCII punctuation after a Chinese character (use ，。：；！？)`);
        if (ASCII_PARENS_AROUND_HANZI.test(v)) errors.push(`SCRIPT ${at} ASCII parentheses around Chinese (use full-width （）)`);
        if (ZH_SPACE.test(v)) errors.push(`SCRIPT ${at} space between Chinese characters or next to full-width punctuation`);
        if (!HANZI.test(v) && !invariant?.noGloss) errors.push(`SCRIPT ${at} has no Chinese character (got ${q(v)})`);
      } else if (CJK_SCRIPT.test(v)) {
        errors.push(`SCRIPT ${at} contains Chinese or Japanese characters (got ${q(v)})`);
      }

      // TYPO
      if (v.includes('—')) errors.push(`TYPO ${at} em-dash « — »`);
      if (v.includes('’')) errors.push(`TYPO ${at} typographic apostrophe « ’ » (use ')`);
      if (/^\s|\s$/.test(v)) errors.push(`TYPO ${at} leading or trailing whitespace`);
      if (/\s{2,}/.test(v)) errors.push(`TYPO ${at} double space`);
      if (l !== 'zh' && /\s[:;!?]/.test(v)) errors.push(`TYPO ${at} French spacing before : ; ! ? (got ${q(v)})`);

      // FORBIDDEN
      for (const s of [...FORBIDDEN_TEXT.all, ...(FORBIDDEN_TEXT[l] ?? []), ...LEGACY_ABSENT]) {
        if (v.includes(s)) errors.push(`FORBIDDEN ${at} contains ${q(s)}`);
      }

      // SUBGROUP
      if (f.field === 'subgroup') {
        const k = `${fr}\u0000${l}`;
        const seen = subgroups.get(k);
        if (!seen) subgroups.set(k, { value: v, path: f.path });
        else if (seen.value !== v) errors.push(`SUBGROUP ${q(fr)}.${l} ${q(seen.value)} vs ${q(v)} (${seen.path}, ${f.path})`);
      }

      // LENGTH
      if ((f.field === 'description' || f.field === 'footnote') && codePoints(fr) >= 15) {
        const n = codePoints(v);
        const m = codePoints(fr);
        const [lo, hi] = l === 'zh' ? [0.15 * m, 1.2 * m + 20] : [0.5 * m, 2 * m + 30];
        if (n < lo || n > hi) errors.push(`LENGTH ${at} ${n} characters, expected ${Math.ceil(lo)}..${Math.floor(hi)} (FR ${m})`);
      }

      // GLOSS
      if (f.scope === 'item' && f.field === 'description' && Object.hasOwn(REQUIRED_GLOSSES, f.key)) {
        const want = REQUIRED_GLOSSES[f.key][l];
        if (want && !lower.includes(want.toLowerCase())) errors.push(`GLOSS ${at} ${q(want)}`);
      }
    }
  }
  return errors;
}

// ── formatMenuJson ─────────────────────────────────────────────────────────────

const STRUCTURAL_KEYS = ['categories', 'items', 'corrections', 'ekToConfirm'];
const MAX_LINE = 110;

function oneLine(v) {
  if (Array.isArray(v)) return `[${v.map(oneLine).join(', ')}]`;
  if (isObj(v)) {
    const entries = Object.entries(v);
    return entries.length ? `{ ${entries.map(([k, x]) => `${q(k)}: ${oneLine(x)}`).join(', ')} }` : '{}';
  }
  return JSON.stringify(v);
}

function fmt(v, indent, prefixLen, key, isRoot = false) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  const structural = isRoot || (isObj(v) && Object.hasOwn(v, 'key')) || STRUCTURAL_KEYS.includes(key);
  if (!structural) {
    const values = isObj(v) ? Object.values(v) : [];
    const singlePrimitive = isObj(v) && values.length === 1 && (values[0] === null || typeof values[0] !== 'object');
    const line = oneLine(v);
    if (singlePrimitive || indent + prefixLen + line.length <= MAX_LINE) return line;
  }
  const pad = ' '.repeat(indent + 2);
  const close = ' '.repeat(indent);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return `[\n${v.map((x) => pad + fmt(x, indent + 2, 0)).join(',\n')}\n${close}]`;
  }
  const entries = Object.entries(v);
  if (entries.length === 0) return '{}';
  const lines = entries.map(([k, x]) => {
    const prefix = `${q(k)}: `;
    return pad + prefix + fmt(x, indent + 2, prefix.length, k);
  });
  return `{\n${lines.join(',\n')}\n${close}}`;
}

/**
 * Serialise the menu in the file style of menu-2026.json (byte-exact round-trip of the current file):
 * the root, categories, items, corrections, ekToConfirm and every object with a "key" are multi-line
 * (2-space indent); any other object or array stays on one line when it has a single primitive value or
 * when its line fits in 110 characters.
 */
export function formatMenuJson(menu) {
  return `${fmt(menu, 0, 0, undefined, true)}\n`;
}

// ── overlaySkeleton ────────────────────────────────────────────────────────────

/** An empty overlay for one section (or the whole menu): fr filled, en/de/it/zh = '', print order. */
export function overlaySkeleton(menu, section) {
  const blank = (loc) => ({ fr: loc.fr, en: '', de: '', it: '', zh: '' });
  const out = { version: 1, section, categories: {}, items: {} };
  for (const cat of Array.isArray(menu?.categories) ? menu.categories : []) {
    if (!isObj(cat)) continue;
    if (section !== undefined && section !== null && cat.section !== section) continue;
    const c = {};
    for (const field of CATEGORY_FIELDS) if (isLoc(cat[field])) c[field] = blank(cat[field]);
    if (Object.keys(c).length) out.categories[cat.key] = c;
    for (const item of Array.isArray(cat.items) ? cat.items : []) {
      if (!isObj(item)) continue;
      const it = {};
      for (const field of ITEM_TEXT_FIELDS) if (isLoc(item[field])) it[field] = blank(item[field]);
      const prices = Array.isArray(item.prices) ? item.prices : [];
      if (prices.some((p) => isObj(p) && isLoc(p.label))) {
        it.prices = prices.map((p) => (isObj(p) && isLoc(p.label) ? { label: blank(p.label) } : null));
      }
      if (Object.keys(it).length) out.items[item.key] = it;
    }
  }
  return out;
}
