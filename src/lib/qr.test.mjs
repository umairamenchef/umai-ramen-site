// node:test suite for src/lib/qr.ts (QR codes of the tourist menu, import-free module).
// Run: node --test src/lib/qr.test.mjs
// Node 24 strips the TypeScript types natively, so qr.ts and locales.ts are imported directly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  QR_ORIGIN,
  QR_LOCALES,
  QR_EC_LEVEL,
  QR_VERSION,
  QR_MODULES,
  QR_QUIET_ZONE,
  QR_PNG_SCALE,
  QR_PNG_SIZE,
  QR_LABELS,
  QR_SCAN_HINTS,
  QR_PRINT_TITLE,
  QR_PRINT_FOOTER,
  QR_PDFS,
  QR_TENT_BLEED_MM,
  QR_TENT_VARIANTS,
  qrMenuUrl,
  qrDisplayUrl,
  qrLabelLang,
  qrAssetPath,
  qrAllAssetPaths,
  qrPrintCjkChars,
  qrSvg,
} from './qr.ts';
import { LOCALES, htmlLang } from '../i18n/locales.ts';

const SOURCE = readFileSync(new URL('./qr.ts', import.meta.url), 'utf8');

// ---------------------------------------------------------------------------
// Locales and URLs
// ---------------------------------------------------------------------------

test('QR_LOCALES equals LOCALES of src/i18n/locales.ts (fr, en, de, it, zh)', () => {
  assert.deepEqual([...QR_LOCALES], [...LOCALES]);
  assert.deepEqual([...QR_LOCALES], ['fr', 'en', 'de', 'it', 'zh']);
});

test('qrMenuUrl: exact production menu URL per locale, 29 bytes each', () => {
  assert.equal(qrMenuUrl('fr'), 'https://umai-ramen.fr/fr/menu');
  assert.equal(qrMenuUrl('en'), 'https://umai-ramen.fr/en/menu');
  assert.equal(qrMenuUrl('de'), 'https://umai-ramen.fr/de/menu');
  assert.equal(qrMenuUrl('it'), 'https://umai-ramen.fr/it/menu');
  assert.equal(qrMenuUrl('zh'), 'https://umai-ramen.fr/zh/menu');
  for (const l of QR_LOCALES) assert.equal(Buffer.byteLength(qrMenuUrl(l)), 29, l);
});

test('QR_ORIGIN is the hard-coded production origin; the module reads no env and imports nothing', () => {
  assert.equal(QR_ORIGIN, 'https://umai-ramen.fr');
  assert.equal(SOURCE.includes('process.env'), false, 'process.env in qr.ts');
  assert.equal(SOURCE.includes('NEXT_PUBLIC_BASE_URL'), false, 'NEXT_PUBLIC_BASE_URL in qr.ts');
  const importLines = SOURCE.split('\n').filter((line) => line.startsWith('import'));
  assert.deepEqual(importLines, [], 'qr.ts must have no import line');
});

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

test('QR_LABELS: each language labelled in its own language and script', () => {
  assert.deepEqual(QR_LABELS, {
    fr: 'Menu en français',
    en: 'Menu in English',
    de: 'Speisekarte auf Deutsch',
    it: 'Menù in italiano',
    zh: '中文菜单',
  });
});

test('qrLabelLang equals htmlLang for every locale (zh-Hans for zh); qrDisplayUrl drops the scheme', () => {
  for (const l of QR_LOCALES) assert.equal(qrLabelLang(l), htmlLang(l), l);
  assert.equal(qrLabelLang('zh'), 'zh-Hans');
  assert.equal(qrLabelLang('fr'), 'fr');
  assert.equal(qrDisplayUrl('de'), 'umai-ramen.fr/de/menu');
  for (const l of QR_LOCALES) assert.equal(`https://${qrDisplayUrl(l)}`, qrMenuUrl(l), l);
});

// ---------------------------------------------------------------------------
// File names
// ---------------------------------------------------------------------------

test('qrAssetPath, QR_PDFS and qrAllAssetPaths: 12 unique public paths under /qr/', () => {
  assert.equal(qrAssetPath('fr', 'svg'), '/qr/umai-menu-fr.svg');
  assert.equal(qrAssetPath('zh', 'png'), '/qr/umai-menu-zh.png');
  assert.deepEqual({ ...QR_PDFS }, { a4: '/qr/umai-qr-a4.pdf', tent: '/qr/umai-qr-chevalet-a6.pdf' });
  const all = qrAllAssetPaths();
  assert.equal(all.length, 12);
  assert.equal(new Set(all).size, 12);
  for (const p of all) assert.ok(p.startsWith('/qr/'), p);
  assert.ok(all.includes(QR_PDFS.a4));
  assert.ok(all.includes(QR_PDFS.tent));
  assert.deepEqual(all, [
    '/qr/umai-menu-fr.svg',
    '/qr/umai-menu-fr.png',
    '/qr/umai-menu-en.svg',
    '/qr/umai-menu-en.png',
    '/qr/umai-menu-de.svg',
    '/qr/umai-menu-de.png',
    '/qr/umai-menu-it.svg',
    '/qr/umai-menu-it.png',
    '/qr/umai-menu-zh.svg',
    '/qr/umai-menu-zh.png',
    '/qr/umai-qr-a4.pdf',
    '/qr/umai-qr-chevalet-a6.pdf',
  ]);
});

test('A6 card: 3 mm default bleed, Exaprint variants at 1 and 2 mm next to it, outside the 12 main files', () => {
  assert.equal(QR_TENT_BLEED_MM, 3);
  assert.deepEqual(
    QR_TENT_VARIANTS.map((v) => ({ ...v })),
    [
      { bleedMm: 1, path: '/qr/umai-qr-chevalet-a6-fp1mm.pdf' },
      { bleedMm: 2, path: '/qr/umai-qr-chevalet-a6-fp2mm.pdf' },
    ],
  );
  const all = qrAllAssetPaths();
  for (const v of QR_TENT_VARIANTS) {
    assert.equal(v.path, `/qr/umai-qr-chevalet-a6-fp${v.bleedMm}mm.pdf`);
    assert.notEqual(v.bleedMm, QR_TENT_BLEED_MM);
    assert.equal(all.includes(v.path), false, v.path);
  }
});

// ---------------------------------------------------------------------------
// SVG renderer
// ---------------------------------------------------------------------------

test('qrSvg: filled squares per horizontal dark run, 4-module quiet zone, 1 module = 1 mm', () => {
  assert.equal(
    qrSvg({ size: 2, data: [1, 1, 0, 1] }, 'x'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10mm" height="10mm" shape-rendering="crispEdges"><title>x</title><rect width="10" height="10" fill="#FFFFFF"/><path fill="#000000" d="M4 4h2v1h-2zM5 5h1v1h-1z"/></svg>\n',
  );
});

test('qrSvg escapes the title and renders an all-light matrix as an empty path', () => {
  const escaped = qrSvg({ size: 2, data: [0, 0, 0, 0] }, 'a&b<c>"');
  assert.ok(escaped.includes('<title>a&amp;b&lt;c&gt;&quot;</title>'), escaped);
  const light = qrSvg({ size: 3, data: new Uint8Array(9) }, 'empty');
  assert.ok(light.includes('viewBox="0 0 11 11"'), light);
  assert.ok(light.includes('width="11mm" height="11mm"'), light);
  assert.ok(light.includes('d=""'), light);
});

// ---------------------------------------------------------------------------
// Symbol constants
// ---------------------------------------------------------------------------

test('symbol constants: level Q, version 3 (29 modules), quiet zone 4, PNG 1036 px at 28 px per module', () => {
  assert.equal(QR_EC_LEVEL, 'Q');
  assert.equal(QR_VERSION, 3);
  assert.equal(QR_MODULES, 29);
  assert.equal(QR_QUIET_ZONE, 4);
  assert.equal(QR_PNG_SCALE, 28);
  assert.equal(QR_PNG_SIZE, 1036);
  assert.equal(QR_PNG_SIZE, (QR_MODULES + 2 * QR_QUIET_ZONE) * QR_PNG_SCALE);
});

// ---------------------------------------------------------------------------
// Print strings
// ---------------------------------------------------------------------------

test('QR_SCAN_HINTS, QR_PRINT_TITLE and QR_PRINT_FOOTER golden strings', () => {
  assert.deepEqual(QR_SCAN_HINTS, {
    fr: "Scannez avec l'appareil photo",
    en: 'Scan with your phone camera',
    de: 'Mit der Handykamera scannen',
    it: 'Inquadra con la fotocamera',
    zh: '用手机相机扫码',
  });
  assert.equal(QR_PRINT_TITLE, 'Menu · Speisekarte · Menù · 菜单');
  assert.equal(QR_PRINT_FOOTER, 'Umaï Ramen · 5 Rue des Orphelins, 67000 Strasbourg · umai-ramen.fr');
});

test('qrPrintCjkChars: the 10 unique CJK characters of the print strings, by code point', () => {
  const chars = qrPrintCjkChars();
  const list = [...chars];
  for (const c of [...'中文菜单', ...'用手机相机扫码', ...'菜单']) assert.ok(list.includes(c), c);
  assert.equal(new Set(list).size, list.length, 'duplicates');
  const points = list.map((c) => c.codePointAt(0));
  assert.deepEqual(points, [...points].sort((a, b) => a - b), 'not ascending');
  for (const p of points) assert.ok(p >= 0x2e80, p.toString(16));
  assert.equal(chars.includes('·'), false);
  assert.equal(list.length, 10);
  assert.equal(chars, '中单手扫文机用相码菜');
});

test('no exported string contains an em-dash', () => {
  const strings = [
    ...Object.values(QR_LABELS),
    ...Object.values(QR_SCAN_HINTS),
    QR_PRINT_TITLE,
    QR_PRINT_FOOTER,
    QR_ORIGIN,
    ...Object.values(QR_PDFS),
    ...QR_LOCALES.map((l) => qrMenuUrl(l)),
    ...QR_LOCALES.map((l) => qrDisplayUrl(l)),
  ];
  for (const s of strings) assert.equal(s.includes('—'), false, s);
});
