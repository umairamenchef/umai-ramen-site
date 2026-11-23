// Locale rules: the single source of truth for which locale exists where.
//
// EK lock (2026-11-22, I18N-02): IT and ZH are MENU-ONLY locales. They exist for
// /{it,zh}/menu and /{it,zh}/menu/* (the QR page of Phase 15 lives below it).
// Every other /it/* and /zh/* URL answers a redirect to the same path under /en
// (src/proxy.ts), and EN is also the message base underneath the IT/ZH files
// (src/i18n/request.ts).
//
// IMPORTANT: this module has NO runtime imports and uses only erasable
// TypeScript (type annotations and `as const`, nothing that emits code), so that
// src/i18n/locales.test.mjs can import it directly through Node's native type
// stripping (same rule as src/lib/menu.ts). Consumers: routing, request config,
// proxy, layout, seo, sitemap, and the menu-page language switcher (Plan 13-02).

export const LOCALES = ['fr', 'en', 'de', 'it', 'zh'] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE = 'fr';

/** Locales that have the whole site. */
export const FULL_SITE_LOCALES = ['fr', 'en', 'de'] as const;

/** Locales that only have /menu (and /menu/*). */
export const MENU_ONLY_LOCALES = ['it', 'zh'] as const;

/** Non-menu IT/ZH URLs go here; EN is also the message base under it/zh. */
export const MENU_FALLBACK_LOCALE = 'en';

/** Native labels of the language switchers. */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: 'FR',
  en: 'EN',
  de: 'DE',
  it: 'IT',
  zh: '中文',
};

/** Full native names (accessible names, tooltips, wide layouts). */
export const LOCALE_NAMES: Record<AppLocale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  zh: '中文（简体）',
};

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isMenuOnlyLocale(value: string): boolean {
  return (MENU_ONLY_LOCALES as readonly string[]).includes(value);
}

/** `path` is the pathname WITHOUT its locale prefix: '/menu', '/menu/qr', '/infos'. */
export function isMenuPath(path: string): boolean {
  return path === '/menu' || path.startsWith('/menu/');
}

/** Locales a page (path without locale prefix) exists in: all five on the menu, fr/en/de elsewhere. */
export function localesForPath(path: string): readonly AppLocale[] {
  return isMenuPath(path) ? LOCALES : FULL_SITE_LOCALES;
}

/** Locale to use for a link from an IT/ZH menu page to a non-menu page. */
export function siteLocaleFor(locale: string): string {
  return isMenuOnlyLocale(locale) ? MENU_FALLBACK_LOCALE : locale;
}

/** Value for <html lang>, hreflang and lang/hrefLang attributes. */
export function htmlLang(locale: string): string {
  return locale === 'zh' ? 'zh-Hans' : locale;
}

/** Open Graph locale; unknown values fall back to French. */
export function ogLocale(locale: string): string {
  switch (locale) {
    case 'en':
      return 'en_US';
    case 'de':
      return 'de_DE';
    case 'it':
      return 'it_IT';
    case 'zh':
      return 'zh_CN';
    default:
      return 'fr_FR';
  }
}

/**
 * The proxy rule. `pathname` is the full request pathname (no query).
 * Returns the path to redirect to when it is a non-menu IT/ZH path
 * ('/it' -> '/en', '/zh/infos' -> '/en/infos'), otherwise null.
 * The caller keeps the query string itself.
 */
export function menuOnlyRedirectPath(pathname: string): string | null {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match || !isMenuOnlyLocale(match[1])) return null;
  const rest = match[2] ?? '';
  if (isMenuPath(rest)) return null;
  return '/' + MENU_FALLBACK_LOCALE + (rest === '/' ? '' : rest);
}

export type MessageTree = { [key: string]: string | MessageTree };

function isMessageTree(value: unknown): value is MessageTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep merge of two message trees: `override` wins key by key at any depth,
 * keys it does not define come from `base`. Never writes into `base` or
 * `override` (they are cached JSON modules shared with the EN pages): every
 * subtree that is merged is a fresh object.
 */
export function mergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key === '__proto__') continue; // never let a message key reach the prototype
    const current = out[key];
    out[key] =
      isMessageTree(current) && isMessageTree(value) ? mergeMessages(current, value) : value;
  }
  return out;
}
