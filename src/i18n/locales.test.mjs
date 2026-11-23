// node:test suite for src/i18n/locales.ts (locale rules, import-free module).
// Run: node --test src/i18n/locales.test.mjs
// Node 24 strips the TypeScript types natively, so locales.ts is imported directly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCALES,
  FULL_SITE_LOCALES,
  MENU_ONLY_LOCALES,
  DEFAULT_LOCALE,
  MENU_FALLBACK_LOCALE,
  LOCALE_LABELS,
  LOCALE_NAMES,
  isAppLocale,
  isMenuOnlyLocale,
  isMenuPath,
  localesForPath,
  siteLocaleFor,
  htmlLang,
  ogLocale,
  menuOnlyRedirectPath,
  mergeMessages,
} from './locales.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

test('locale constants: five locales, three full-site, two menu-only, fr default, en fallback', () => {
  assert.deepEqual([...LOCALES], ['fr', 'en', 'de', 'it', 'zh']);
  assert.deepEqual([...FULL_SITE_LOCALES], ['fr', 'en', 'de']);
  assert.deepEqual([...MENU_ONLY_LOCALES], ['it', 'zh']);
  assert.equal(DEFAULT_LOCALE, 'fr');
  assert.equal(MENU_FALLBACK_LOCALE, 'en');
});

test('full-site and menu-only locales partition LOCALES', () => {
  assert.deepEqual([...FULL_SITE_LOCALES, ...MENU_ONLY_LOCALES], [...LOCALES]);
});

test('LOCALE_LABELS are the native switcher labels and LOCALE_NAMES the full names', () => {
  assert.deepEqual(LOCALE_LABELS, { fr: 'FR', en: 'EN', de: 'DE', it: 'IT', zh: '中文' });
  assert.deepEqual(LOCALE_NAMES, {
    fr: 'Français',
    en: 'English',
    de: 'Deutsch',
    it: 'Italiano',
    zh: '中文（简体）',
  });
});

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

test('isAppLocale accepts exactly the five routing locales', () => {
  for (const l of ['fr', 'en', 'de', 'it', 'zh']) assert.equal(isAppLocale(l), true, l);
  for (const l of ['', 'IT', 'zh-Hans', 'zh-TW', 'es', 'constructor']) {
    assert.equal(isAppLocale(l), false, l);
  }
});

test('isMenuOnlyLocale: it and zh only', () => {
  assert.equal(isMenuOnlyLocale('it'), true);
  assert.equal(isMenuOnlyLocale('zh'), true);
  for (const l of ['fr', 'en', 'de', '', 'IT', 'zh-TW']) assert.equal(isMenuOnlyLocale(l), false, l);
});

test('isMenuPath: /menu and everything below it', () => {
  for (const p of ['/menu', '/menu/', '/menu/qr']) assert.equal(isMenuPath(p), true, p);
  for (const p of ['', '/', '/menus', '/infos', '/carte-ete', '/MENU', '/menuqr']) {
    assert.equal(isMenuPath(p), false, p);
  }
});

// ---------------------------------------------------------------------------
// Per-path locale lists
// ---------------------------------------------------------------------------

test('localesForPath: all five locales on the menu, fr/en/de everywhere else', () => {
  assert.deepEqual([...localesForPath('/menu')], [...LOCALES]);
  assert.deepEqual([...localesForPath('/menu/qr')], [...LOCALES]);
  assert.deepEqual([...localesForPath('')], [...FULL_SITE_LOCALES]);
  assert.deepEqual([...localesForPath('/infos')], [...FULL_SITE_LOCALES]);
  assert.deepEqual([...localesForPath('/carte-ete')], [...FULL_SITE_LOCALES]);
});

// ---------------------------------------------------------------------------
// menuOnlyRedirectPath (the proxy rule)
// ---------------------------------------------------------------------------

test('menuOnlyRedirectPath redirects every non-menu IT/ZH path to the same path under /en', () => {
  assert.equal(menuOnlyRedirectPath('/it'), '/en');
  assert.equal(menuOnlyRedirectPath('/it/'), '/en');
  assert.equal(menuOnlyRedirectPath('/zh'), '/en');
  assert.equal(menuOnlyRedirectPath('/zh/infos'), '/en/infos');
  assert.equal(menuOnlyRedirectPath('/it/notre-histoire'), '/en/notre-histoire');
  assert.equal(menuOnlyRedirectPath('/zh/mentions-legales'), '/en/mentions-legales');
  assert.equal(menuOnlyRedirectPath('/zh/menus'), '/en/menus');
  assert.equal(menuOnlyRedirectPath('/it/carte-ete'), '/en/carte-ete');
});

test('menuOnlyRedirectPath leaves the IT/ZH menu and everything else alone', () => {
  for (const p of [
    '/it/menu',
    '/zh/menu/',
    '/zh/menu/qr',
    '/fr/infos',
    '/en',
    '/',
    '',
    '/menu',
    '/italia',
    '/zh-TW/menu',
    '/IT/infos',
  ]) {
    assert.equal(menuOnlyRedirectPath(p), null, p);
  }
});

test('menuOnlyRedirectPath sees through percent-encoded locale prefixes (next-intl matches the decoded path)', () => {
  assert.equal(menuOnlyRedirectPath('/z%68/infos'), '/en/infos');
  assert.equal(menuOnlyRedirectPath('/%69t'), '/en');
  assert.equal(menuOnlyRedirectPath('/%7A%68/menu'), null); // decodes to /zh/menu
  assert.equal(menuOnlyRedirectPath('/zh/%6Denu'), null); // decodes to /zh/menu
  assert.equal(menuOnlyRedirectPath('/zh/%6Denu/qr'), null);
});

test('menuOnlyRedirectPath keeps the rest of the path exactly as received and never throws on bad escapes', () => {
  assert.equal(menuOnlyRedirectPath('/zh/%69nfos'), '/en/%69nfos');
  assert.equal(menuOnlyRedirectPath('/zh/100%25'), '/en/100%25');
  assert.equal(menuOnlyRedirectPath('/zh/%E0%A4%A'), '/en/%E0%A4%A');
  assert.equal(menuOnlyRedirectPath('/%E0%A4%A/infos'), null);
});

// ---------------------------------------------------------------------------
// Locale -> attribute mappings
// ---------------------------------------------------------------------------

test('siteLocaleFor maps menu-only locales to en and leaves full-site locales alone', () => {
  assert.equal(siteLocaleFor('it'), 'en');
  assert.equal(siteLocaleFor('zh'), 'en');
  assert.equal(siteLocaleFor('fr'), 'fr');
  assert.equal(siteLocaleFor('en'), 'en');
  assert.equal(siteLocaleFor('de'), 'de');
});

test('htmlLang: zh becomes zh-Hans, the other locales keep their code', () => {
  assert.equal(htmlLang('zh'), 'zh-Hans');
  for (const l of ['fr', 'en', 'de', 'it']) assert.equal(htmlLang(l), l);
});

test('ogLocale: Open Graph locale per language, unknown values fall back to fr_FR', () => {
  assert.equal(ogLocale('fr'), 'fr_FR');
  assert.equal(ogLocale('en'), 'en_US');
  assert.equal(ogLocale('de'), 'de_DE');
  assert.equal(ogLocale('it'), 'it_IT');
  assert.equal(ogLocale('zh'), 'zh_CN');
  assert.equal(ogLocale('es'), 'fr_FR');
  assert.equal(ogLocale(''), 'fr_FR');
  assert.equal(ogLocale('constructor'), 'fr_FR');
});

// ---------------------------------------------------------------------------
// mergeMessages
// ---------------------------------------------------------------------------

test('mergeMessages: the override wins key by key at any depth, the base fills the gaps', () => {
  const base = { menu: { title: 'Our Menu', badge: { bestseller: 'Best', vegetarianOption: 'Veg' } }, gallery: 'Gallery' };
  const override = { menu: { title: 'Il nostro menù', badge: { bestseller: 'Top' } } };
  assert.deepEqual(mergeMessages(base, override), {
    menu: { title: 'Il nostro menù', badge: { bestseller: 'Top', vegetarianOption: 'Veg' } },
    gallery: 'Gallery',
  });
});

test('mergeMessages: new keys of the override are added', () => {
  assert.deepEqual(mergeMessages({ a: 'x' }, { b: 'y', c: { d: 'z' } }), { a: 'x', b: 'y', c: { d: 'z' } });
});

test('mergeMessages: a string replaces an object and an object replaces a string', () => {
  assert.deepEqual(mergeMessages({ a: { b: 'x' } }, { a: 'str' }), { a: 'str' });
  assert.deepEqual(mergeMessages({ a: 'str' }, { a: { b: 'x' } }), { a: { b: 'x' } });
});

test('mergeMessages never mutates its inputs (they are cached JSON modules shared with the EN pages)', () => {
  const base = { menu: { title: 'Our Menu', badge: { bestseller: 'Best' } }, nav: { menu: 'Menu' } };
  const override = { menu: { title: 'Menù', badge: { bestseller: 'Top', extra: 'E' } } };
  const baseSnapshot = structuredClone(base);
  const overrideSnapshot = structuredClone(override);
  const merged = mergeMessages(base, override);
  assert.deepEqual(base, baseSnapshot);
  assert.deepEqual(override, overrideSnapshot);
  // Every subtree that is actually merged is a fresh object, never the shared one.
  assert.notEqual(merged, base);
  assert.notEqual(merged.menu, base.menu);
  assert.notEqual(merged.menu.badge, base.menu.badge);
});

test('mergeMessages with an empty override returns an equal tree, and an empty base returns the override', () => {
  assert.deepEqual(mergeMessages({ a: { b: 'x' } }, {}), { a: { b: 'x' } });
  assert.deepEqual(mergeMessages({}, { a: { b: 'x' } }), { a: { b: 'x' } });
});
