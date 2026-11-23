/**
 * UMAÏ Ramen: checks of the translated menu pages and the native-speaker review sheet (Phase 14, EN / DE / IT / ZH).
 *
 * Pure helpers: no I/O, no network. Their only import is translation-rules.mjs. Used by verify-translations.mjs
 * (the live / file verifier of the pages) and export-review-sheet.mjs (the Sanity -> CSV export).
 *
 * Page checks (ROADMAP success criteria 1 and 2): on /en /de /it /zh the translated text is the primary text and
 * the French name appears ONLY as the intentional secondary « FR » line (Phase 13-02, `data-fr-name`); no other
 * French content string may be on the page.
 *
 *   comparable, pickLocale, frenchSecondaryNames   mirror of the Phase 13-02 rule of src/lib/menu.ts
 *   frenchLeakCandidates                           French texts that must not appear on a translated page
 *   norm, decodeEntities                           text helpers (as in verify-live.mjs)
 *   extractFrenchNameLines, visibleText, htmlLang  what a rendered page shows
 *   REVIEW_HEADER, buildReviewRows, toCsv          the review sheet (14-CONTEXT « Review sheet (TRANS-03) »)
 */
import { TRANSLATION_LOCALES, translatableFields } from './translation-rules.mjs';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonBlank = (v) => typeof v === 'string' && v.trim() !== '';

// ── the Phase 13-02 secondary French name rule ─────────────────────────────────

/** NFC, lowercase, collapsed whitespace: how the site decides whether a name « already contains » the French name. */
export const comparable = (text) => String(text).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

/** The locale's text when it is a non-blank string, else the French text, else ''. */
export function pickLocale(field, locale) {
  if (!field) return '';
  const value = field[locale];
  if (typeof value === 'string' && value.trim() !== '') return value;
  return typeof field.fr === 'string' ? field.fr : '';
}

/**
 * The French names the page must show as secondary « FR » lines, in print order: for every item, null on 'fr', null
 * when the French name is empty, null when the primary (translated, else French) name already contains it,
 * otherwise the trimmed French name.
 * Mirror of src/lib/menu.ts secondaryFrenchName (Phase 13-02); Plan 14-03 cross-checks both on the real data.
 */
export function frenchSecondaryNames(menu, locale) {
  if (locale === 'fr') return [];
  const names = [];
  for (const category of Array.isArray(menu?.categories) ? menu.categories : []) {
    for (const item of Array.isArray(category?.items) ? category.items : []) {
      const name = item?.name;
      const fr = typeof name?.fr === 'string' ? name.fr.trim() : '';
      if (fr === '') continue;
      if (comparable(pickLocale(name, locale)).includes(comparable(fr))) continue;
      names.push(fr);
    }
  }
  return names;
}

/**
 * French content strings that must NOT appear on the page of a translated locale (outside the secondary FR lines).
 * Every translatable field whose French text differs from its translation (a missing translation counts: the page
 * would show the French fallback). Excluded: a French text shorter than 5 characters (« Vins » would match inside
 * other words), one equal to the locale's text (« 25cl »), and one contained in any translated string of that
 * locale (it may legitimately appear inside that translation). First-seen order, duplicates removed.
 */
export function frenchLeakCandidates(menu, locale) {
  if (locale === 'fr') return [];
  const fields = translatableFields(menu);
  const own = fields.map((f) => f.value[locale]).filter(isNonBlank);
  const candidates = [];
  const seen = new Set();
  for (const field of fields) {
    const fr = field.value.fr.trim();
    if (field.value[locale] === fr) continue;
    if ([...fr].length < 5) continue;
    if (own.some((text) => text.includes(fr))) continue;
    if (seen.has(fr)) continue;
    seen.add(fr);
    candidates.push(fr);
  }
  return candidates;
}

// ── page helpers (same conventions as verify-live.mjs) ─────────────────────────

/** NBSP / narrow NBSP -> space, collapse whitespace, trim. */
export function norm(value) {
  return String(value ?? '')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeEntities(value) {
  const fromCodePoint = (match, code) => {
    try {
      return String.fromCodePoint(code);
    } catch {
      return match; // not a valid code point: leave the text alone
    }
  };
  return String(value)
    .replace(/&(?:#x27|#39|apos);/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (m, dec) => fromCodePoint(m, Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (m, hex) => fromCodePoint(m, parseInt(hex, 16)))
    .replace(/&amp;/g, '&');
}

/** The body of the page without <script>, <style> and comments (React splits text nodes with `<!-- -->`). */
function cleanBody(html) {
  const text = String(html);
  const start = text.search(/<body\b/i);
  return (start === -1 ? text : text.slice(start))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '');
}

const stripTags = (fragment) => norm(decodeEntities(fragment.replace(/<[^>]+>/g, ' ')));

/** The Phase 13-02 French line: `<p data-fr-name=""><span aria-hidden="true">FR</span><span lang="fr">Name</span></p>`. */
const FR_LINE = /<(p|div|span)\b[^>]*\bdata-fr-name\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
const FR_SPAN = /<span\b[^>]*\blang\s*=\s*["']fr["'][^>]*>([\s\S]*?)<\/span\s*>/i;

/** The French names of the `data-fr-name` lines of a rendered page, in page order (the « FR » tag excluded). */
export function extractFrenchNameLines(html) {
  const names = [];
  for (const match of cleanBody(html).matchAll(FR_LINE)) {
    const span = FR_SPAN.exec(match[2]);
    names.push(span ? stripTags(span[1]) : stripTags(match[2]).replace(/^FR(?:\s+|$)/, ''));
  }
  return names;
}

/** Visible text of the page body (no script / style / comment), optionally without the secondary French lines. */
export function visibleText(html, { dropFrenchNameLines = false } = {}) {
  let body = cleanBody(html);
  if (dropFrenchNameLines) body = body.replace(FR_LINE, ' ');
  return stripTags(body);
}

/** The `lang` attribute of the <html> tag, or null. */
export function htmlLang(html) {
  const tag = /<html\b[^>]*>/i.exec(String(html));
  if (!tag) return null;
  const lang = /\slang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag[0]);
  return lang ? (lang[1] ?? lang[2] ?? lang[3]) : null;
}

// ── review sheet ───────────────────────────────────────────────────────────────

export const REVIEW_HEADER = ['Catégorie', 'Champ', 'FR', 'EN', 'DE', 'IT', 'ZH (à relire)'];

/**
 * The review rows (header first) from the categories as the export query returns them
 * (`{ name, description, footnote, items: [{ name, description, subgroup, prices: [{ _key, label }] }] }`; GROQ
 * returns null for an absent field, so every field may be null). One row per translatable field, in print order:
 * the category name and description, then per item its name, description, sub-group and price labels (the 2nd
 * label of an item is « libellé de prix 2 », ...), then the category note. Row = [category (FR name), « <FR name or
 * Catégorie> : <field> », FR, EN, DE, IT, ZH]; a missing or blank translation is an empty cell, a Loc without a
 * French text gives no row.
 */
export function buildReviewRows(categories) {
  const rows = [[...REVIEW_HEADER]];
  const cell = (value) => (isNonBlank(value) ? value : '');
  for (const category of Array.isArray(categories) ? categories : []) {
    if (!isObj(category)) continue;
    const categoryName = isNonBlank(category.name?.fr) ? category.name.fr.trim() : '';
    const add = (label, loc) => {
      if (!isObj(loc) || !isNonBlank(loc.fr)) return;
      rows.push([categoryName, label, loc.fr, ...TRANSLATION_LOCALES.map((locale) => cell(loc[locale]))]);
    };
    add('Catégorie : nom', category.name);
    add('Catégorie : description', category.description);
    for (const item of Array.isArray(category.items) ? category.items : []) {
      if (!isObj(item)) continue;
      const itemName = isNonBlank(item.name?.fr) ? item.name.fr.trim() : '(sans nom)';
      add(`${itemName} : nom`, item.name);
      add(`${itemName} : description`, item.description);
      add(`${itemName} : sous-groupe`, item.subgroup);
      let labels = 0;
      for (const variant of Array.isArray(item.prices) ? item.prices : []) {
        if (!isObj(variant) || !isObj(variant.label) || !isNonBlank(variant.label.fr)) continue;
        labels += 1;
        add(`${itemName} : libellé de prix${labels > 1 ? ` ${labels}` : ''}`, variant.label);
      }
    }
    add('Catégorie : note de bas', category.footnote);
  }
  return rows;
}

/**
 * CSV for French Excel: UTF-8 with a BOM (so Excel shows Chinese), `;` separator, CRLF after every line (the last
 * one too). A cell is quoted when it contains `;`, `"` (doubled), CR, LF or leading / trailing white space.
 */
export function toCsv(rows) {
  const quote = (value) => {
    const text = String(value ?? '');
    return /[;"\r\n]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `\uFEFF${rows.map((row) => `${row.map(quote).join(';')}\r\n`).join('')}`;
}
