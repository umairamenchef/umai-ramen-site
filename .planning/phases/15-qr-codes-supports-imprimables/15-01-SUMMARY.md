---
phase: 15-qr-codes-supports-imprimables
plan: 01
subsystem: qr
tags: [qrcode, jsqr, mutool, svg, png, node-test, type-stripping, tdd]

requires:
  - phase: 13-fondations-multilingues-page-menu-touriste
    provides: "src/i18n/locales.ts (LOCALES, htmlLang) and the import-free, Node-24-type-stripped module pattern; the live /{fr,en,de,it,zh}/menu pages with data-menu-locale-switcher"
  - phase: 14-traductions-en-de-it-zh
    provides: "translated menus live on the 5 URLs the codes encode"
provides:
  - "src/lib/qr.ts: import-free QR contract (production origin, locales, symbol constants, native-script labels, scan hints, print title/footer, asset paths, PDFs, CJK print set, qrSvg renderer), 12 node:test cases"
  - "public/qr/umai-menu-{fr,en,de,it,zh}.svg (vector, 37 mm, 1 module = 1 mm) and .png (1036 px, 28 px/module): version 3, level Q, quiet zone 4, black on white, no logo"
  - "scripts/qr/generate.mjs: deterministic generator (byte-identical re-runs)"
  - "scripts/qr/verify.mjs: decoder gate (checkAssets: SVG regeneration + mutool/jsQR decode of all 10 files; checkUrls with --urls: live 200, no redirect, <html lang>, menu switcher); renderPgm/decode(crop) helpers ready for Plan 02's checkPdfs"
  - "devDependencies qrcode ^1.5.4 and jsqr ^1.4.0"
affects: [15-02 print PDFs, 15-03 /menu/qr page, 15-04 deploy and live proof]

tech-stack:
  added: ["qrcode 1.5.4 (dev, MIT)", "jsqr 1.4.0 (dev, Apache-2.0)"]
  patterns:
    - "QR contract in one import-free, erasable-TS module (same rule as src/i18n/locales.ts and src/lib/menu.ts), imported by Next (@/lib/qr) and by Node 24 scripts ('../../src/lib/qr.ts')"
    - "Printed codes encode a literal production origin, never the build-time base URL"
    - "Own SVG renderer (filled rectangles per dark run) instead of qrcode's stroke-based SVG: clean in print and PDF"
    - "Phone-scan proxy = mutool render to PGM + jsQR decode + live GET with redirect: manual"

key-files:
  created:
    - src/lib/qr.ts
    - src/lib/qr.test.mjs
    - scripts/qr/generate.mjs
    - scripts/qr/verify.mjs
    - public/qr/umai-menu-fr.svg
    - public/qr/umai-menu-en.svg
    - public/qr/umai-menu-de.svg
    - public/qr/umai-menu-it.svg
    - public/qr/umai-menu-zh.svg
    - public/qr/umai-menu-fr.png
    - public/qr/umai-menu-en.png
    - public/qr/umai-menu-de.png
    - public/qr/umai-menu-it.png
    - public/qr/umai-menu-zh.png
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Phase 15-01: error correction Q (not M): every menu URL is 29 bytes, which fits version 3 at Q as at M (29 x 29 modules), so the stronger level costs nothing"
  - "Phase 15-01: src/lib/qr.ts is the single source of the QR URLs (literal https://umai-ramen.fr, never NEXT_PUBLIC_BASE_URL), labels, file names and the SVG renderer; Plans 02/03 import it, no hard-coded URL elsewhere"
  - "Phase 15-01: QR proof without a phone = scripts/qr/verify.mjs --urls (byte-identical SVG, mutool + jsQR decode of all 10 files, live 200 with no redirect and the right <html lang>); EK's real-phone scan stays a post-hoc check (Plan 04 hand-off)"

patterns-established:
  - "scripts/qr/*.mjs CLI convention: one FAIL line per failure, final OK/FAILED line with counters, exit 0 / 1 / 2 (2 = usage, missing tool, missing file)"

requirements-completed: []  # QR-01 capability only; ticked by Plan 04 after the live proof

duration: 6min
completed: 2026-11-24
---

# Phase 15 Plan 01: QR contract, generator and decoder gate Summary

**Five version-3 / level-Q menu QR codes (SVG 37 mm + PNG 1036 px) encoding the literal `https://umai-ramen.fr/{fr,en,de,it,zh}/menu`, built from one import-free contract module and proven by a mutool + jsQR decoder gate and a live 200 / no-redirect / `<html lang>` check.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-11-23T23:39:24Z
- **Completed:** 2026-11-23T23:45:30Z
- **Tasks:** 2 (Task 1 TDD: RED + GREEN commits)
- **Files modified:** 16 (14 created, 2 modified)

## Accomplishments

- `src/lib/qr.ts`: the QR contract shared by the `/menu/qr` page (Plan 03) and every script under `scripts/qr/`, 12 node:test cases (golden URLs, labels, paths, renderer, CJK set, sync with `src/i18n/locales.ts`).
- 10 committed files under `public/qr/`, decoded automatically to the exact production URLs, deterministic (second run: identical sha256).
- `node scripts/qr/verify.mjs --urls` proves each decoded URL is a live 200 menu page in the right language, with no redirect.

## `src/lib/qr.ts` API

```ts
export const QR_ORIGIN = 'https://umai-ramen.fr';
export const QR_LOCALES = ['fr', 'en', 'de', 'it', 'zh'] as const;
export type QrLocale = (typeof QR_LOCALES)[number];
export const QR_EC_LEVEL = 'Q';
export const QR_VERSION = 3;
export const QR_MODULES = 29;
export const QR_QUIET_ZONE = 4;
export const QR_PNG_SCALE = 28;
export const QR_PNG_SIZE = 1036;
export const QR_LABELS: Record<QrLocale, string>;      // 'Menu en français', 'Menu in English', 'Speisekarte auf Deutsch', 'Menù in italiano', '中文菜单'
export const QR_SCAN_HINTS: Record<QrLocale, string>;  // "Scannez avec l'appareil photo", 'Scan with your phone camera', 'Mit der Handykamera scannen', 'Inquadra con la fotocamera', '用手机相机扫码'
export const QR_PRINT_TITLE = 'Menu · Speisekarte · Menù · 菜单';
export const QR_PRINT_FOOTER = 'Umaï Ramen · 5 Rue des Orphelins, 67000 Strasbourg · umai-ramen.fr';
export const QR_PDFS = { a4: '/qr/umai-qr-a4.pdf', tent: '/qr/umai-qr-chevalet-a6.pdf' } as const;
export function qrMenuUrl(locale: QrLocale): string;            // https://umai-ramen.fr/{locale}/menu
export function qrDisplayUrl(locale: QrLocale): string;         // umai-ramen.fr/{locale}/menu
export function qrLabelLang(locale: QrLocale): string;          // zh -> 'zh-Hans'
export function qrAssetPath(locale: QrLocale, kind: 'svg' | 'png'): string; // /qr/umai-menu-{locale}.{kind}
export function qrAllAssetPaths(): string[];                    // 12: per locale svg, png; then a4, tent
export function qrPrintCjkChars(): string;                      // '中单手扫文机用相码菜' (10, by code point)
export type QrMatrix = { size: number; data: ArrayLike<number> };
export function qrSvg(modules: QrMatrix, title: string): string;
```

## QR facts per locale

| Locale | Encoded URL (29 bytes, byte mode) | Version | EC | Mask | SVG bytes | PNG bytes |
|--------|-----------------------------------|---------|----|------|-----------|-----------|
| fr | https://umai-ramen.fr/fr/menu | 3 (29 x 29) | Q | 0 | 3279 | 7056 |
| en | https://umai-ramen.fr/en/menu | 3 | Q | 0 | 3166 | 7038 |
| de | https://umai-ramen.fr/de/menu | 3 | Q | 0 | 3185 | 7035 |
| it | https://umai-ramen.fr/it/menu | 3 | Q | 0 | 3279 | 7044 |
| zh | https://umai-ramen.fr/zh/menu | 3 | Q | 6 | 3215 | 7042 |

Total 51,339 bytes. Every SVG starts with `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37" width="37mm" height="37mm"`, carries `<title>https://umai-ramen.fr/<locale>/menu</title>` and `fill="#000000"`, 0 `stroke`. Every PNG is 1036 x 1036 (RGBA, pure black/white). Visual check of `umai-menu-zh.png`: plain black-on-white code, white border, no logo.

## Verify outputs

```
$ node scripts/qr/generate.mjs
QR fr https://umai-ramen.fr/fr/menu v3 Q mask 0 -> public/qr/umai-menu-fr.svg, .png
QR en https://umai-ramen.fr/en/menu v3 Q mask 0 -> public/qr/umai-menu-en.svg, .png
QR de https://umai-ramen.fr/de/menu v3 Q mask 0 -> public/qr/umai-menu-de.svg, .png
QR it https://umai-ramen.fr/it/menu v3 Q mask 0 -> public/qr/umai-menu-it.svg, .png
QR zh https://umai-ramen.fr/zh/menu v3 Q mask 6 -> public/qr/umai-menu-zh.svg, .png
GENERATE OK files=10

$ node scripts/qr/verify.mjs
QR VERIFY OK assets=10 checks=40

$ node scripts/qr/verify.mjs --urls
QR VERIFY OK assets=10 urls=5 checks=55
```

Mutation test (never committed): `cp public/qr/umai-menu-de.png public/qr/umai-menu-it.png`, then

```
$ node scripts/qr/verify.mjs
FAIL it png decode: decodes to "https://umai-ramen.fr/de/menu", expected https://umai-ramen.fr/it/menu
QR VERIFY FAILED failures=1          (exit 1)
```

Restored with `node scripts/qr/generate.mjs` → `GENERATE OK files=10`, then `QR VERIFY OK assets=10 checks=40` (exit 0). Determinism: a second `generate.mjs` run left every `shasum -a 256 public/qr/*` unchanged and `git status --porcelain -- public/qr` empty.

Checks per locale: SVG byte-identical (1), SVG decode found / URL / version 3 (3), PNG 1036 x 1036 (1), PNG decode found / URL / version 3 (3) = 8, x 5 = 40; `--urls` adds 200-no-redirect / `<html lang>` / `data-menu-locale-switcher` = 3 x 5 = 15.

## npm diff

- `package.json`: exactly two lines added to `devDependencies`: `"jsqr": "^1.4.0"`, `"qrcode": "^1.5.4"`.
- `package-lock.json`: 20 new entries, all `"dev": true`, none with an install script: `qrcode@1.5.4`, `jsqr@1.4.0`, `pngjs@5.0.0`, `dijkstrajs@1.0.3`, `decamelize@1.2.0`, `require-main-filename@2.0.0`, `set-blocking@2.0.0`, `which-module@2.0.1`, and 12 nested under `node_modules/qrcode/node_modules/` (yargs 15.4.1, yargs-parser 18.1.3, cliui 6.0.0, camelcase 5.3.1, find-up 4.1.0, locate-path 5.0.0, p-limit 2.3.0, p-locate 4.1.0, ansi-regex 5.0.1, strip-ansi 6.0.1, wrap-ansi 6.2.0, y18n 4.0.3). The only modified entry is the root (`""`) devDependencies list; 0 removed.
- `npm ls --depth=0`: all 20 previous top-level packages at their previous versions, plus the two new ones.
- Docker build safety: `npm ci --dry-run --ignore-scripts` on a scratch copy of package.json + package-lock.json exits 0 (lock in sync). `npm install --package-lock-only` would add bundled `@tailwindcss/oxide-wasm32-wasi` entries, but it does exactly the same on the pre-install lockfile (pre-existing npm behaviour, unrelated to this plan).

## Task Commits

1. **Task 1 (RED): failing tests for the QR contract** - `1a60123` (test)
2. **Task 1 (GREEN): QR contract module** - `d01d2c4` (feat)
3. **Task 2: generator, decoder verifier and the 5 menu QR codes** - `7ba3565` (feat)

No REFACTOR commit (nothing to clean up).

## Files Created/Modified

- `src/lib/qr.ts` - QR contract (URLs, labels, files, symbol constants, SVG renderer), import-free
- `src/lib/qr.test.mjs` - 12 node:test cases (Run: `node --test src/lib/qr.test.mjs`)
- `scripts/qr/generate.mjs` - writes the 10 files of `public/qr/` (exit 0/1/2)
- `scripts/qr/verify.mjs` - decoder gate + `--urls` live check (exit 0/1/2), sections `checkAssets` / `checkUrls`, helpers `renderPgm`, `parsePgm`, `decode(img, crop?)`
- `public/qr/umai-menu-{fr,en,de,it,zh}.{svg,png}` - the codes
- `package.json`, `package-lock.json` - devDependencies qrcode + jsqr

## Decisions Made

- Level Q, version 3 (see key-decisions); the PNG uses the same mask as the SVG.
- `verify.mjs` reports a network error on `--urls` as a `FAIL` line (exit 1), not exit 2: exit 2 stays for usage errors, missing `mutool` and missing files, as planned.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness guarantee] PNG encoded with the SVG's mask pattern**
- **Found during:** Task 2 (generator)
- **Issue:** `QRCode.toFile` re-encodes the URL on its own; nothing in the planned options tied the PNG's symbol to the SVG's (`qrSvg(QRCode.create(...).modules)`).
- **Fix:** `toFile(..., { maskPattern: qr.maskPattern, ... })` so both files carry the very same matrix.
- **Verification:** the PNGs are byte-identical to a scratch run with exactly the planned options (no mask passed), on all 5 locales; both still decode.
- **Committed in:** `7ba3565`

---

**Total deviations:** 1 auto-fixed (Rule 2). **Impact on plan:** none on the outputs (byte-identical files); it only makes the SVG/PNG identity explicit.

## Issues Encountered

- Node prints `[MODULE_TYPELESS_PACKAGE_JSON] Warning` on stderr when a script imports `src/lib/qr.ts` (no `"type"` in package.json), the same harmless notice as the existing `locales.ts` / `menu.ts` tests. Adding `"type": "module"` would affect the Next/Sanity config and is out of scope. stdout (the OK lines) is unaffected.
- `jsqr` 1.4.0 arrives as a function under Node 24's CJS interop here; the planned `typeof jsQRModule === 'function' ? jsQRModule : jsQRModule.default` import handles both shapes.

## User Setup Required

None. `mutool` (`brew install mupdf-tools`) is needed only to run `verify.mjs`, already installed on this Mac.

## Next Phase Readiness

- Plan 02 imports `QR_LABELS`, `QR_SCAN_HINTS`, `QR_PRINT_TITLE`, `QR_PRINT_FOOTER`, `qrPrintCjkChars()` and inlines `public/qr/umai-menu-*.svg`; `verify.mjs` is ready for a `checkPdfs` section (`renderPgm` handles multi-page `-r 300` renders, `decode` takes a pixel crop).
- Plan 03 imports `QR_LOCALES`, `QR_LABELS`, `QR_PDFS`, `qrAssetPath`, `qrDisplayUrl`, `qrLabelLang`, `qrMenuUrl`, `qrAllAssetPaths` from `@/lib/qr`.
- QR-01 is NOT ticked: Plan 04 ticks it after the deploy and the live proof; EK's real-phone scan is in the Plan 04 hand-off.

## Self-Check: PASSED

- FOUND: src/lib/qr.ts, src/lib/qr.test.mjs, scripts/qr/generate.mjs, scripts/qr/verify.mjs, the 10 files under public/qr/ (all tracked)
- FOUND commits: 1a60123, d01d2c4, 7ba3565
