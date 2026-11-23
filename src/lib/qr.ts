// QR codes of the tourist menu (Phase 15): single source of truth for the /menu/qr
// page and the scripts under scripts/qr/ (generate, print, verify).
//
// IMPORTANT: no runtime imports, erasable TypeScript only (type annotations and
// `as const`, nothing that emits code), so Node 24 type stripping can load this
// file directly, like src/i18n/locales.ts.
//
// The codes encode QR_ORIGIN, never the site's build-time base-URL variable (local
// builds bake https://umai.turfu.in): printed codes must always open umai-ramen.fr.
// QR_LOCALES must stay equal to LOCALES (src/i18n/locales.ts), checked by
// qr.test.mjs.

/** Production origin encoded in every printed code (literal on purpose). */
export const QR_ORIGIN = 'https://umai-ramen.fr';

/** One code per menu locale, in the order of the language switcher. */
export const QR_LOCALES = ['fr', 'en', 'de', 'it', 'zh'] as const;
export type QrLocale = (typeof QR_LOCALES)[number];

// Symbol parameters. Every URL `https://umai-ramen.fr/xx/menu` is 29 bytes (byte
// mode): 29-byte URLs fit version 3 at level Q, same size as M (version 2-M holds
// only 26 bytes, 3-Q holds 32), so the stronger level costs nothing.
export const QR_EC_LEVEL = 'Q';
export const QR_VERSION = 3;
/** Modules per side of a version 3 symbol. */
export const QR_MODULES = 29;
/** ISO/IEC 18004 quiet zone, in modules, on every side. */
export const QR_QUIET_ZONE = 4;
/** PNG pixels per module (no anti-aliasing: one module = 28 × 28 identical pixels). */
export const QR_PNG_SCALE = 28;
/** PNG side in pixels: (29 + 2 × 4) × 28. */
export const QR_PNG_SIZE = 1036;

/** Label of each code, in its own language and script. */
export const QR_LABELS: Record<QrLocale, string> = {
  fr: 'Menu en français',
  en: 'Menu in English',
  de: 'Speisekarte auf Deutsch',
  it: 'Menù in italiano',
  zh: '中文菜单',
};

/** Short « scan » line of the print files, one per language. */
export const QR_SCAN_HINTS: Record<QrLocale, string> = {
  fr: "Scannez avec l'appareil photo",
  en: 'Scan with your phone camera',
  de: 'Mit der Handykamera scannen',
  it: 'Inquadra con la fotocamera',
  zh: '用手机相机扫码',
};

/** Title of the A4 sheet. */
export const QR_PRINT_TITLE = 'Menu · Speisekarte · Menù · 菜单';

/** Footer of the A4 sheet (same NAP as src/lib/seo.ts). */
export const QR_PRINT_FOOTER = 'Umaï Ramen · 5 Rue des Orphelins, 67000 Strasbourg · umai-ramen.fr';

/** Public paths of the two print files (written by scripts/qr/print.mjs). */
export const QR_PDFS = {
  a4: '/qr/umai-qr-a4.pdf',
  tent: '/qr/umai-qr-chevalet-a6.pdf',
} as const;

/** Bleed of the default A6 card QR_PDFS.tent, in mm (page 111 × 154 mm, trim 105 × 148). */
export const QR_TENT_BLEED_MM = 3;

/**
 * Exaprint variants of the A6 card: same two faces, other bleed. Exaprint wants the file at
 * the finished size plus the bleed of the product ordered (flyers 1 mm, other products
 * 2 mm, brochures 3 mm). Not part of qrAllAssetPaths(), which lists the 12 main files.
 */
export const QR_TENT_VARIANTS = [
  { bleedMm: 1, path: '/qr/umai-qr-chevalet-a6-fp1mm.pdf' },
  { bleedMm: 2, path: '/qr/umai-qr-chevalet-a6-fp2mm.pdf' },
] as const;

/** URL encoded in the code of `locale`. */
export function qrMenuUrl(locale: QrLocale): string {
  return `${QR_ORIGIN}/${locale}/menu`;
}

/** The same URL without its scheme, printed under each code. */
export function qrDisplayUrl(locale: QrLocale): string {
  return `${QR_ORIGIN.replace(/^https:\/\//, '')}/${locale}/menu`;
}

/** `lang` attribute of a label (same rule as htmlLang in src/i18n/locales.ts). */
export function qrLabelLang(locale: QrLocale): string {
  return locale === 'zh' ? 'zh-Hans' : locale;
}

/** Public path of a code file: '/qr/umai-menu-fr.svg'. */
export function qrAssetPath(locale: QrLocale, kind: 'svg' | 'png'): string {
  return `/qr/umai-menu-${locale}.${kind}`;
}

/** Every downloadable file: per locale SVG then PNG, then the A4 and the A6 PDFs (12). */
export function qrAllAssetPaths(): string[] {
  const paths: string[] = [];
  for (const locale of QR_LOCALES) {
    paths.push(qrAssetPath(locale, 'svg'), qrAssetPath(locale, 'png'));
  }
  paths.push(QR_PDFS.a4, QR_PDFS.tent);
  return paths;
}

/**
 * The CJK characters the print files need (zh label, zh scan hint, title), unique
 * and sorted by code point. The Noto Sans SC subset used by the PDFs is fetched for
 * exactly this text.
 */
export function qrPrintCjkChars(): string {
  const seen = new Set<string>();
  for (const ch of QR_LABELS.zh + QR_SCAN_HINTS.zh + QR_PRINT_TITLE) {
    const point = ch.codePointAt(0);
    if (point !== undefined && point >= 0x2e80) seen.add(ch);
  }
  return [...seen].sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0)).join('');
}

/** Module matrix of a symbol: `size` × `size`, row-major, 1 (truthy) = dark. */
export type QrMatrix = { size: number; data: ArrayLike<number> };

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * SVG of a symbol with its white quiet zone: each horizontal run of dark modules is
 * one filled rectangle (no strokes, clean in print and in PDF). 1 module = 1 mm when
 * the file is placed at its intrinsic size (37 mm for version 3).
 */
export function qrSvg(modules: QrMatrix, title: string): string {
  const q = QR_QUIET_ZONE;
  const size = modules.size;
  const total = size + 2 * q;
  let d = '';
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!modules.data[row * size + col]) {
        col++;
        continue;
      }
      const start = col;
      while (col < size && modules.data[row * size + col]) col++;
      const len = col - start;
      d += `M${start + q} ${row + q}h${len}v1h-${len}z`;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}mm" height="${total}mm" shape-rendering="crispEdges">` +
    `<title>${escapeXml(title)}</title>` +
    `<rect width="${total}" height="${total}" fill="#FFFFFF"/>` +
    `<path fill="#000000" d="${d}"/>` +
    `</svg>\n`
  );
}
