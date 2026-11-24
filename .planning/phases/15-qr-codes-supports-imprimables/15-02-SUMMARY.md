---
phase: 15-qr-codes-supports-imprimables
plan: 02
subsystem: qr
tags: [print, pdf, chromium, pypdf, pymupdf, fonttools, ofl, exaprint, bleed, jsqr, mutool]

requires:
  - phase: 15-qr-codes-supports-imprimables
    provides: "15-01: src/lib/qr.ts contract (labels, hints, title, footer, qrPrintCjkChars, QR_PDFS), public/qr/umai-menu-*.svg, scripts/qr/verify.mjs (renderPgm, decode(crop))"
provides:
  - "public/qr/umai-qr-a4.pdf: A4 210 x 297 mm, 1 page, white, logo + title + 5 labelled codes (symbol 43.5 mm) + URLs + 5-language scan line + address footer"
  - "public/qr/umai-qr-chevalet-a6.pdf: A6 card 105 x 148 mm, recto/verso (2 identical pages), 3 mm bleed (page 111 x 154, TrimBox inset 3, BleedBox = MediaBox), ivory to the bleed edge, 5 labelled codes (symbol 25.52 mm) per face, 5 mm safety margin"
  - "Exaprint bleed variants (orchestrator addition): public/qr/umai-qr-chevalet-a6-fp1mm.pdf (1 mm, flyers, page 107 x 150) and umai-qr-chevalet-a6-fp2mm.pdf (2 mm, other products, page 109 x 152); QR_TENT_BLEED_MM + QR_TENT_VARIANTS in src/lib/qr.ts"
  - "scripts/qr/fetch-fonts.mjs (+ fonts/: Outfit 400/600, DM Serif Display 400, Noto Sans SC 600 subset, OFL texts, fonts.json; --check offline)"
  - "scripts/qr/extract-logo.py + scripts/qr/assets/umai-logo.svg (vector UMAÏ / Ramen Noodle bar from the 2026 Exaprint print)"
  - "scripts/qr/layout.mjs (a4Layout, a6Layout({ bleed }), validateLayout), scripts/qr/print.mjs (HTML -> Chromium -> pdftool boxes), scripts/qr/pdftool.py (boxes, info, check)"
  - "scripts/qr/verify.mjs checkPdfs: 15 printed codes (+20 in the variants) decoded at 300 dpi, symbol size, quiet zone, label under each code"
affects: [15-03 /menu/qr page (lists the PDFs incl. the 2 variants), 15-04 deploy + Exaprint hand-off]

tech-stack:
  added: ["Outfit, DM Serif Display, Noto Sans SC (SIL OFL 1.1, committed TTF files, print only)"]
  patterns:
    - "Print files = HTML with absolutely positioned mm boxes, inline SVG (codes + logo), @font-face file:// fonts -> headless Chromium --print-to-pdf -> pypdf exact boxes; deterministic output (byte-identical re-runs)"
    - "Print-readiness as an executable check (pdftool.py check) and scan-readiness as a decoder gate (verify.mjs checkPdfs), both re-runnable"
    - "A6 bleed is a layout parameter; the committed variants carry their bleed in their file name"

key-files:
  created:
    - scripts/qr/fetch-fonts.mjs
    - scripts/qr/fonts/Outfit-400.ttf
    - scripts/qr/fonts/Outfit-600.ttf
    - scripts/qr/fonts/DMSerifDisplay-400.ttf
    - scripts/qr/fonts/NotoSansSC-600-subset.ttf
    - scripts/qr/fonts/OFL-Outfit.txt
    - scripts/qr/fonts/OFL-DMSerifDisplay.txt
    - scripts/qr/fonts/OFL-NotoSansSC.txt
    - scripts/qr/fonts/fonts.json
    - scripts/qr/extract-logo.py
    - scripts/qr/assets/umai-logo.svg
    - scripts/qr/layout.mjs
    - scripts/qr/print.mjs
    - scripts/qr/pdftool.py
    - public/qr/umai-qr-a4.pdf
    - public/qr/umai-qr-chevalet-a6.pdf
    - public/qr/umai-qr-chevalet-a6-fp1mm.pdf
    - public/qr/umai-qr-chevalet-a6-fp2mm.pdf
  modified:
    - scripts/qr/verify.mjs
    - src/lib/qr.ts
    - src/lib/qr.test.mjs

key-decisions:
  - "Phase 15-02: A4 white (office printing), A6 ivory #F5F0E8 to the bleed edge; both A6 faces carry all 5 codes (a card in a table stand faces both sides of the table); accent rule #77967A, text #1A1A1A, muted #6B6B6B; fonts Outfit / DM Serif Display / Noto Sans SC (OFL) embedded, never a system font"
  - "Phase 15-02: A6 default bleed 3 mm (CONTEXT); Exaprint 1 mm (flyers) and 2 mm (other products) variants committed next to it as umai-qr-chevalet-a6-fp1mm.pdf / -fp2mm.pdf, single-sourced by QR_TENT_VARIANTS in src/lib/qr.ts (QR_PDFS and qrAllAssetPaths() unchanged: 12 main files)"
  - "Phase 15-02: node scripts/qr/print.mjs writes all 4 PDFs; an ad-hoc bleed needs --out (--only a6 --bleed N --out <file>), so a committed file never gets the wrong bleed; output is deterministic"
  - "Phase 15-02: verify.mjs measures each printed symbol on its pixels (jsQR's extrapolated corners were 0.39 mm off on one A6 code) and reports QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15[ urls=5] variants=2 variantCodes=20 checks=<n>"

patterns-established:
  - "pdftool.py check: one FAIL line per print-readiness failure, PDF CHECK OK / FAILED line, exit 0/1/2"

requirements-completed: []  # QR-02 / QR-03 capability; ticked by Plan 04 after the live proof

duration: 17min
completed: 2026-11-24
---

# Phase 15 Plan 02: Print fonts, logo, A4 sheet and A6 table card Summary

**Vector, print-ready QR PDFs in the Umaï look (A4 sheet + A6 recto/verso table card with 3 mm bleed, plus Exaprint 1 mm and 2 mm variants), built from committed OFL fonts, a vector logo re-drawn from the 2026 print and the Plan 01 SVG codes, and proven by `pdftool.py check` (boxes, vector, fonts, safe area) and a 300 dpi decode of all 35 printed codes.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-23T23:47:38Z
- **Completed:** 2026-11-24T00:04:30Z
- **Tasks:** 3 (+1 contract commit for the orchestrator's bleed variants)
- **Files modified:** 21 (18 created, 3 modified)

## Accomplishments

- QR-02 capability: `public/qr/umai-qr-a4.pdf`, one vector page, the 5 codes labelled in their own language and script, logo on top.
- QR-03 capability: `public/qr/umai-qr-chevalet-a6.pdf`, Exaprint-ready A6 card (recto/verso, 3 mm bleed, TrimBox/BleedBox, embedded fonts incl. the CJK label font, 5 mm safety margin), plus the 1 mm and 2 mm Exaprint variants.
- Everything is regenerable offline from the repo (`fetch-fonts.mjs --check`, committed logo, committed codes), deterministically, and checked by two re-runnable commands.

## Files for Plan 03 (`/menu/qr` page) and Plan 04 (hand-off)

| File | Use | Page (mm) | Trim (mm) | Bleed | Pages | Bytes |
|------|-----|-----------|-----------|-------|-------|-------|
| `public/qr/umai-qr-a4.pdf` (`QR_PDFS.a4`) | office printing | 210 x 297 | = page | 0 | 1 | 89,452 |
| `public/qr/umai-qr-chevalet-a6.pdf` (`QR_PDFS.tent`) | Exaprint, default (brochure rule) | 111 x 154 | 105 x 148 | 3 mm | 2 | 125,871 |
| `public/qr/umai-qr-chevalet-a6-fp1mm.pdf` (`QR_TENT_VARIANTS[0]`) | Exaprint flyers | 107 x 150 | 105 x 148 | 1 mm | 2 | 125,913 |
| `public/qr/umai-qr-chevalet-a6-fp2mm.pdf` (`QR_TENT_VARIANTS[1]`) | Exaprint other products | 109 x 152 | 105 x 148 | 2 mm | 2 | 125,933 |

**Note for the 15-03 executor:** the page should list all three A6 files. Import `QR_TENT_VARIANTS` (`{ bleedMm, path }[]`) and `QR_TENT_BLEED_MM` (3) from `@/lib/qr` rather than hard-coding the names. `QR_PDFS` and `qrAllAssetPaths()` are unchanged (12 paths), so `verify-site.mjs`'s planned « 12 download links » check still holds. If the variants are offered as downloads, extend that check (and Plan 04's `/qr/*` 200 + content-type check) with `QR_TENT_VARIANTS.map((v) => v.path)`.

## Final layout numbers (mm, top-left of the final page)

**A4** (page 210 x 297, white, safe area [12, 12, 198, 285], module 1.5 mm, tile 55.5 mm, symbol 43.5 mm, minimum 40):
- logo x 75, y 18, w 60 (h 26.32); title y 56, DM Serif Display 21 pt (« 菜单 » in Noto Sans SC 600); accent rule x 93, y 70, 24 x 0.7, #77967A
- tiles: fr 13.75 / en 77.25 / de 140.75 at y 84; it 45.5 / zh 109 at y 157.5 (gaps 8 mm horizontally, 18 mm vertically)
- labels: tile bottom + 1.5, 64 wide, Outfit 600 13 pt (zh Noto Sans SC 600 13.5 pt, letter-spacing .08em), display URL below in Outfit 400 8.5 pt #6B6B6B
- scan hints y 247 (Outfit 400 9.5 pt, line-height 1.5, fr · en · de / it · zh), footer y 276 (Outfit 400 9 pt #6B6B6B)

**A6** (bleed b, default 3: page (105 + 2b) x (148 + 2b), trim inset b, safe [b + 5, b + 5, b + 100, b + 143], ivory #F5F0E8, module 0.88 mm, tile 32.56 mm, symbol 25.52 mm, minimum 25), both faces identical:
- logo centred, y b + 5.5, w 30 (h 13.16); accent rule centred, y b + 20.4, 16 x 0.5
- tiles: column centres page.w / 2 ∓ 22.28 (gap 12 mm), rows y b + 23, b + 62.5, b + 102: fr / en, de / it, zh centred (vertical gaps 6.94 mm)
- labels: tile bottom + 1.0, 44 wide, Outfit 600 8 pt letter-spacing .02em (zh Noto Sans SC 600 8.5 pt, .08em)
- at b = 3, measured text spans 17.08 to 88.19 mm x 59.36 to 142.68 mm, logo 8.5 to 21.66 mm, all inside the safe area 8 to 103 x 8 to 146 mm

## Fonts and logo

| File | Bytes | sha256 (prefix) | Source |
|------|-------|-----------------|--------|
| Outfit-400.ttf | 47,844 | 6a8c9be856a6 | fonts.gstatic.com/s/outfit/v15 |
| Outfit-600.ttf | 48,456 | 8900df5726b5 | fonts.gstatic.com/s/outfit/v15 |
| DMSerifDisplay-400.ttf | 70,348 | c03775f8cc3d | fonts.gstatic.com/s/dmserifdisplay/v17 |
| NotoSansSC-600-subset.ttf | 3,740 | 49950c5fa56c | Google Fonts `&text=中单手扫文机用相码菜` (v41) |

OFL texts: OFL-Outfit.txt 4,389 B, OFL-DMSerifDisplay.txt 4,605 B, OFL-NotoSansSC.txt 4,388 B (« Copyright 2014-2021 Adobe … »). Folder total 200 KB. `FONTS OK files=4 licenses=3 (check)` offline. fontTools coverage: Outfit 400/600 cover the 46 non-CJK characters of labels, hints, footer, URLs and title; DM Serif Display covers the 14 of the title (incl. « ù » and « · »); the Noto subset holds the 10 CJK characters → **COVERAGE OK**.

Logo: `LOGO OK paths=8 size_mm=45.05x19.76 out=scripts/qr/assets/umai-logo.svg` (viewBox 127.69 x 56.02 pt, ratio 2.2795, 8,718 bytes, `fill="#1A1A1A"`, no `<image>`, no `<text>`). The 300 dpi render shows « UMAÏ » with both tréma dots, « Ramen Noodle bar » below, counters of A / o / e / a / d / b open, nothing from the bowl illustration.

## Evidence

```
$ python3 scripts/qr/pdftool.py check public/qr/umai-qr-a4.pdf --kind a4
PDF CHECK OK file=public/qr/umai-qr-a4.pdf pages=1 media=210.00x297.00 trim=210.00x297.00 bleed=0 images=0 fonts=DMSerifDisplay-Regular,NotoSansSC-SemiBold,Outfit-Regular,Outfit-SemiBold checks=68
$ python3 scripts/qr/pdftool.py check public/qr/umai-qr-chevalet-a6.pdf --kind a6 --bleed-mm 3
PDF CHECK OK file=public/qr/umai-qr-chevalet-a6.pdf pages=2 media=111.00x154.00 trim=105.00x148.00 bleed=3 images=0 fonts=NotoSansSC-SemiBold,Outfit-SemiBold checks=79
$ python3 scripts/qr/pdftool.py check public/qr/umai-qr-chevalet-a6-fp1mm.pdf --kind a6 --bleed-mm 1
PDF CHECK OK file=public/qr/umai-qr-chevalet-a6-fp1mm.pdf pages=2 media=107.00x150.00 trim=105.00x148.00 bleed=1 images=0 fonts=NotoSansSC-SemiBold,Outfit-SemiBold checks=79
$ python3 scripts/qr/pdftool.py check public/qr/umai-qr-chevalet-a6-fp2mm.pdf --kind a6 --bleed-mm 2
PDF CHECK OK file=public/qr/umai-qr-chevalet-a6-fp2mm.pdf pages=2 media=109.00x152.00 trim=105.00x148.00 bleed=2 images=0 fonts=NotoSansSC-SemiBold,Outfit-SemiBold checks=79
$ node scripts/qr/verify.mjs
QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15 variants=2 variantCodes=20 checks=337
$ node scripts/qr/verify.mjs --urls
QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15 urls=5 variants=2 variantCodes=20 checks=352
```

All fonts are Type0 / Identity-H with embedded TrueType (`ext` ttf), 0 raster images on every page. Metadata: Title « Umaï Ramen · QR codes du menu (A4) » / « Umaï Ramen · Chevalet QR A6 recto verso » (variants: « … (fond perdu N mm) »), Author « Umaï Ramen », Subject the 5 menu URLs, Creator « scripts/qr/print.mjs (Chromium) ».

**Measured symbol widths** (`verify.mjs --verbose`, dark-pixel box at 300 dpi, ±0.085 mm): A4 43.52 mm on all 5 codes (nominal 43.5); A6 3 mm card 25.48 to 25.53 mm, fp1mm 25.48 to 25.57 mm, fp2mm 25.48 to 25.57 mm (nominal 25.52). Quiet zone band 100 % white on all 35 codes. Every code decodes to its own `https://umai-ramen.fr/{locale}/menu`, version 3, with the right label under it (and on the A4 the right `umai-ramen.fr/{locale}/menu` line). jsQR's corner-based estimate, the planned method, ranged from 25.13 to 25.57 mm on the A6 files (see Deviations).

**Renders reviewed** (`mutool draw -r 60` A4, `-r 110` A6): A4 shows the logo, the serif title with « 菜单 » as real glyphs, the green rule, 3 + 2 codes with « Menu en français / Menu in English / Speisekarte auf Deutsch / Menù in italiano / 中文菜单 » and the URL under each, the two-line scan hint (zh glyphs fine, no tofu) and the address footer. Nothing overlaps. A6 recto and verso are identical: ivory to every edge, logo + green rule, 5 codes on white squares (2 / 2 / 1), labels under the right codes, 中文菜单 as real glyphs.

**Bleed parameter** (scratch): `node scripts/qr/print.mjs --only a6 --bleed 2 --out $TMPDIR/umai-15/a6-fp2.pdf` gives media 109 x 152, trim [2, 2, 107, 150] on both pages, leaves `public/qr/` untouched, and is byte-identical to the committed `-fp2mm.pdf`. The orchestrator's literal commands `--only a6 --bleed 1|2 --out public/qr/umai-qr-chevalet-a6-fp{1,2}mm.pdf` reproduce the committed variants byte for byte. A full `node scripts/qr/print.mjs` re-run leaves all 4 PDFs byte-identical.

## Negative controls (scratch, nothing committed)

1. Bleed mismatch: the 2 mm scratch file checked as 3 mm →
   ```
   FAIL page 1 MediaBox [0.00, 0.00, 109.00, 152.00] mm, expected [0.00, 0.00, 111.00, 154.00]
   FAIL page 1 TrimBox [2.00, 2.00, 107.00, 150.00] mm, expected [3.00, 3.00, 108.00, 151.00]
   FAIL page 1 BleedBox [0.00, 0.00, 109.00, 152.00] mm, expected the MediaBox
   FAIL page 1: drawing at [66.75, 7.41, 67.71, 8.38] mm outside the safe area [8.00, 8.00, 103.00, 146.00]
   … (same on page 2)
   PDF CHECK FAILED file=…/a6-fp2.pdf failures=10          (exit 1)
   ```
   and with `--bleed-mm 2`: `PDF CHECK OK … media=109.00x152.00 trim=105.00x148.00 bleed=2 … checks=79`.
2. System font: the kept A6 HTML (`--keep-html`) with the zh labels set to `font-family: 'PingFang SC'`, printed by hand with the same Chromium command and `pdftool.py boxes` → Chromium embeds PingFang as nameless Type3 fonts →
   ```
   FAIL page 1: font BAAAAA+PingFangSC-Semibold (Type3, xref 11) is not embedded as a font program
   FAIL page 1: font BAAAAA+PingFangSC-Semibold (Type3, xref 11) is not Outfit / DM Serif Display / Noto Sans SC
   FAIL page 1: system font BAAAAA+PingFangSC-Semibold (Type3, xref 11) in a print file
   …
   PDF CHECK FAILED file=…/a6-pingfang.pdf failures=24     (exit 1)
   ```
3. Verify-level mutation: `cp …-fp1mm.pdf public/qr/umai-qr-chevalet-a6.pdf` → `verify.mjs` repeats pdftool's 10 FAIL lines + `pdftool.py check exited 1` → `QR VERIFY FAILED failures=11` (exit 1); restored with `node scripts/qr/print.mjs --only a6` (byte-identical, `git status` clean).

## Regeneration

```
node scripts/qr/generate.mjs && node scripts/qr/print.mjs && node scripts/qr/verify.mjs --urls
```

(`node scripts/qr/fetch-fonts.mjs` only when the CJK print strings of `src/lib/qr.ts` change: `--check` then says FONTS STALE; `python3 scripts/qr/extract-logo.py` only if the logo source changes.)

## Exaprint note for Plan 04's hand-off

- Exaprint rule: the file = finished size + the bleed the product asks (flyers et dépliants 1 mm, autres produits 2 mm, brochures 3 mm); safety zone 3 mm requested / 5 mm recommended (ours: 5 mm); ±1 mm cutting tolerance; page 1 = recto; fonts embedded (ours: all embedded TrueType).
- The three ready files: `umai-qr-chevalet-a6.pdf` (3 mm, default), `umai-qr-chevalet-a6-fp1mm.pdf` (1 mm, flyers), `umai-qr-chevalet-a6-fp2mm.pdf` (2 mm, other products). Any other bleed: `node scripts/qr/print.mjs --only a6 --bleed <0..5> --out <file>`.
- Colours are RGB; Exaprint converts to CMYK automatically, so the ivory may shift slightly. No CMYK / PDF-X conversion here (Ghostscript not installed; deferred in CONTEXT). Paper ≥ 350 g for a table stand.

## Task Commits

1. **Task 1: print fonts (OFL) and vector logo** - `247f8ec` (feat)
2. **Orchestrator addition: A6 bleed variants in the QR contract** - `8e6e146` (feat)
3. **Task 2: A4 sheet and A6 table card PDFs (+ the 2 variants)** - `d37eb87` (feat)
4. **Task 3: PDF print checks and printed-code decoding** - `677f758` (feat)

## Files Created/Modified

- `scripts/qr/fetch-fonts.mjs` - font download + offline `--check`; exports `checkFonts()` for print.mjs
- `scripts/qr/fonts/*` - 4 TTF, 3 OFL texts, `fonts.json` (family, weight, file, bytes, sha256, source CSS URL, font URL, Noto subset text)
- `scripts/qr/extract-logo.py`, `scripts/qr/assets/umai-logo.svg` - vector logo
- `scripts/qr/layout.mjs` - `a4Layout()`, `a6Layout({ bleed })`, `validateLayout()`, `logoRatio()`, `TILE_MODULES`, `COLORS`
- `scripts/qr/print.mjs` - HTML → Chromium → boxes, 4 PDFs by default
- `scripts/qr/pdftool.py` - `boxes`, `info`, `check`
- `scripts/qr/verify.mjs` - `checkPdfs()` added (and `--verbose`)
- `src/lib/qr.ts`, `src/lib/qr.test.mjs` - `QR_TENT_BLEED_MM`, `QR_TENT_VARIANTS` (+1 test, 13 in the file)
- `public/qr/umai-qr-a4.pdf`, `umai-qr-chevalet-a6.pdf`, `umai-qr-chevalet-a6-fp1mm.pdf`, `umai-qr-chevalet-a6-fp2mm.pdf`

## Decisions Made

See key-decisions in the frontmatter (brand look per format, the bleed variants and their single source, the `print.mjs` CLI rule, the verify line and the pixel measurement).

## Deviations from Plan

### Orchestrator addition (in scope by instruction)

**1. Exaprint 1 mm / 2 mm A6 variants, committed and checked like the main card**
- **Asked by:** the orchestrator (keep the 3 mm default, add `-fp1mm` / `-fp2mm`, same checks).
- **Done:** `QR_TENT_BLEED_MM` + `QR_TENT_VARIANTS` added to `src/lib/qr.ts` with a test, in their own commit (`8e6e146`). Plan 02 did not list `src/lib/qr.ts`, but the names must be single-sourced for the 15-03 page. `print.mjs` writes the variants with the main card, and `verify.mjs` checks them (`pdftool.py check --bleed-mm 1|2` + 20 decoded codes). The final line appends `variants=2 variantCodes=20` after the planned fields, so the greps of Plans 03/04 (`QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15[ urls=5]`) still match.

### Auto-fixed Issues

**2. [Rule 1 - Flaky measurement] Printed symbol width measured on the pixels, not on jsQR's corners**
- **Found during:** Task 3
- **Issue:** the planned measurement (mean of jsQR's top and left edges) read 25.13 mm for the « it » code of the 1 mm variant, a 25.52 mm vector symbol. That is inside the 0.4 mm tolerance but 0.13 mm from a false failure against the 25 mm floor. jsQR extrapolates the corners from the finder-pattern centres.
- **Fix:** jsQR locates the code. The width is the dark-pixel box found around that location (the finder patterns touch all four symbol edges; ±1 px = 0.085 mm), and the quiet-zone band is anchored to that box. The thresholds are unchanged (≥ minimum, ±0.4 mm, 0.75 to 3.5 modules, ≥ 99.5 % white). jsQR's estimate is still printed by `--verbose`.
- **Verification:** all 35 codes now measure within 0.05 mm of nominal; mutation run fails as expected.
- **Committed in:** `677f758`

**3. [Rule 2 - Guard precision] Type3 / nameless fonts resolved and rejected explicitly in `pdftool.py check`**
- **Found during:** Task 3 (PingFang negative control)
- **Issue:** Chromium embeds a system font it cannot embed as TrueType (PingFang) as Type3 glyph procedures with an empty BaseFont. The check failed, but its messages named no font.
- **Fix:** nameless fonts are named through their FontDescriptor `/FontName`, and Type3 counts as « not embedded as a font program ». The control now reports `BAAAAA+PingFangSC-Semibold` on all three font rules.
- **Committed in:** `677f758`

**4. [Rule 2 - Protect committed files] `print.mjs` CLI: the default run writes all 4 PDFs, and `--bleed` needs `--out`**
- **Issue:** with the plan's CLI, `--only a6 --bleed 2` (no `--out`) would have overwritten the committed 3 mm file with a 2 mm card, and the variants could go stale after a layout change.
- **Fix:** `node scripts/qr/print.mjs` (and `--only a6`) regenerates the 3 mm card and its variants together. `--bleed` without `--out` is a usage error (exit 2). The plan's `--only a6 --bleed 2 --out <file>` works as specified.
- **Committed in:** `d37eb87`

**5. [Rule 2 - Strictness] `verify.mjs` passes the contract bleed to `pdftool.py check`**
- **Issue:** the plan let `check` infer the A6 bleed from the TrimBox, so a card with the wrong bleed under the 3 mm name would have passed.
- **Fix:** `--bleed-mm` is passed (3, 1, 2 from `QR_TENT_BLEED_MM` / `QR_TENT_VARIANTS`). The layout is still built from the measured TrimBox inset, as planned. The mutation run proves the failure path.
- **Committed in:** `677f758`

Minor supersets, not behaviour changes: `fonts.json` also records each font's download `url`; `pdftool.py info` also returns `lines` and `media_box_mm`; `pdftool.py` turns unreadable or invalid PDFs into `ERROR …` + exit 2 instead of a traceback; `verify.mjs --verbose`.

---

**Total deviations:** 1 orchestrator addition + 4 auto-fixed (Rule 1: 1, Rule 2: 3). **Impact on plan:** all planned outputs, numbers and command lines hold. The variants add files and checks without changing the planned ones.

## Issues Encountered

- Plan 01's Task 2 grep `QR VERIFY OK assets=10 urls=5` no longer matches, as Plan 02 intends: the final line now carries the PDF counters (`assets=10 pdfFiles=2 pdfCodes=15 urls=5 …`). Plans 03/04 use the new form.
- Chromium prints harmless `CVDisplayLinkCreateWithCGDisplay failed` lines on stderr. `print.mjs` judges success by the output file.
- PyMuPDF's « No common ancestor in structure tree » message on the 2026 print is silenced in `extract-logo.py` (harmless, as noted in the plan).

## Known Stubs

None.

## User Setup Required

None. Print tooling is local to this Mac: the Playwright Chromium 1228 headless shell, python3 with PyMuPDF 1.27.2 + pypdf 6.9.2, mutool 1.27.2, fontTools (coverage check only).

## Next Phase Readiness

- 15-03 can link `QR_PDFS.a4`, `QR_PDFS.tent` and the `QR_TENT_VARIANTS` paths; the files exist under `public/qr/`.
- 15-04: the hand-off can point to the three A6 files (the bleed table above). QR-02 / QR-03 are NOT ticked yet; Plan 04 ticks them after the live proof.

## Self-Check: PASSED

- FOUND: the 18 created files and the 3 modified files listed above (all tracked, `git status --porcelain -- scripts/qr public/qr src/lib` empty)
- FOUND commits: 247f8ec, 8e6e146, d37eb87, 677f758
