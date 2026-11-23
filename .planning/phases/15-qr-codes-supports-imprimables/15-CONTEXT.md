# Phase 15: QR codes & supports imprimables - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning (after Phases 13 + 14)
**Mode:** Autonomous (EK, 2026-11-23: « Avance en autonome jusqu'à livraison déployé »).

<domain>
## Phase Boundary

One QR code per language (FR, EN, DE, IT, 中文) pointing to `https://umai-ramen.fr/{locale}/menu`; an on-brand printable **A4 sheet** and a print-ready **table tent** (Exaprint), both vector PDFs; and a `/menu/qr` web page where EK/Loan can see and download everything at any time. No tracking parameters (deferred).

</domain>

<decisions>
## Implementation Decisions

### QR codes
- Encode exactly `https://umai-ramen.fr/{fr|en|de|it|zh}/menu` (no UTM). Error correction **M** (or Q if the layout allows), quiet zone ≥ 4 modules, pure black modules on white (no brand colour inside the code, no logo overlay).
- Generated as **SVG** (vector) by a build-time Node script (`scripts/qr/generate.mjs`, npm `qrcode` package — add as devDependency) → committed under `public/qr/` (`umai-menu-{locale}.svg` + `umai-menu-{locale}.png` at 1024 px for messaging apps).
- Verify each code decodes to the right URL with a decoder (e.g. render PNG → decode with a JS/Python QR decoder) — this is the automated proxy for « scan with a real phone »; EK's real-phone scan is listed in the final report as the human check.

### Print files (vector PDF, generated from HTML with the local Playwright Chromium already on this Mac)
- Generator script `scripts/qr/print.mjs`: builds an HTML page per format with inline SVG QR codes + brand elements, prints to PDF with exact page sizes via headless Chromium (vector output), then post-processes with PyMuPDF/pypdf if needed to set `TrimBox`/`BleedBox`.
- **Brand:** ivoire background `#F5F0E8` optional (white is safer for print — planner's discretion), accent green `#77967A`, the vector logo « UMAÏ — Ramen Noodle bar » (from the latest print; extraction already proven — see `umai-logo-vectoriel` pack approach: PyMuPDF drawing re-composition from `.planning/sources/menu-2026/plats-ouvert-360x250mm-print-2026-11-10.pdf` page 1, bottom-left block, or use `public/logo.svg` wordmark), fonts Outfit / DM Serif Display (OFL) and **Noto Sans SC (OFL)** for the 中文 label — embed fonts (no system fonts like PingFang in print files).
- Labels in each language's own script: « Menu en français », « Menu in English », « Speisekarte auf Deutsch », « Menù in italiano », « 中文菜单 ». Optional short line « Scannez pour lire le menu » + equivalents.
- **A4 sheet** (210 × 297 mm, no bleed needed — office printing): 5 QR codes ≥ 40 mm each, labelled, logo on top.
- **Table tent:** **A6 flat card 105 × 148 mm, recto/verso, 3 mm bleed** (final PDF page 111 × 154 mm with TrimBox 105 × 148), 5 QR codes ≥ 25 mm each (recto: FR/EN/DE or all 5; verso: logo + IT/中文 or a repeat — planner's choice, keep every code ≥ 25 mm with quiet zone), safety margin 5 mm inside trim. Exaprint accepts RGB PDF (converts to CMYK); note in the report that a CMYK/PDF-X conversion can be done by Exaprint's check or later with Ghostscript if EK wants (Ghostscript not installed here).
- Output committed to `public/qr/umai-qr-a4.pdf` and `public/qr/umai-qr-chevalet-a6.pdf`.

### `/menu/qr` page
- Route `src/app/(site)/[locale]/menu/qr/page.tsx` (works under every locale; the Phase 13 proxy rule allows `/{it,zh}/menu/*`). `robots: noindex, nofollow`, excluded from sitemap and hreflang. No password (codes are public anyway).
- Shows the 5 QR codes with their label and URL, download links (SVG, PNG) per code, and the two PDFs. Simple, on-brand, mobile-friendly; UI strings via messages (FR/EN/DE at least; IT/ZH fall back per Phase 13 merge).

### Deploy & verification
- Build, commit, push, manual SSH deploy (STATE), then verify live: `/fr/menu/qr` 200 + `noindex`; every `/qr/*` asset 200 with the right content-type; each QR decodes to a live 200 menu URL in the right language (`<html lang>` check: `zh-Hans` for zh).

### Claude's Discretion
- Exact layout/typography of the A4 sheet and the card, PNG size, whether to also offer a ZIP of everything.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/phases/13-fondations-multilingues-page-menu-touriste/13-CONTEXT.md` — routing rule for `/{it,zh}/menu/*`, html lang
- `public/logo.svg`, `.planning/sources/menu-2026/*.pdf` — logo sources
- `src/app/(site)/[locale]/menu/page.tsx`, `src/messages/*.json`
- `.planning/STATE.md` — deploy procedure

</canonical_refs>

<deferred>
## Deferred Ideas

- Per-language scan tracking (UTM), folded tent format, CMYK/PDF-X conversion, Exaprint order itself (EK).

</deferred>

---

*Phase: 15-qr-codes-supports-imprimables*
*Context gathered: 2026-11-23 (autonomous)*
