---
phase: 15-qr-codes-supports-imprimables
status: passed
verified: 2026-11-24
mode: lean (orchestrator verification — EK asked to speed up on 2026-11-24; no separate gsd-verifier run)
score: 4/4 success criteria
---

# Phase 15 — QR codes & supports imprimables — Verification

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| 1 | Each of the 5 QR codes opens `https://umai-ramen.fr/{fr,en,de,it,zh}/menu` in the matching language | `QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15 urls=5 variants=2 variantCodes=20 checks=352` (orchestrator re-run 2026-11-24): every SVG/PNG and every code printed in the 4 PDFs decodes (jsQR) to its own URL; each URL answers 200 with no redirect and the right `<html lang>` (zh-Hans for zh). Real-phone scan = EK follow-up (hand-off in 15-04-SUMMARY) | ✓ (automated proxy) |
| 2 | Printable A4 vector sheet, 5 labelled codes in their own language/script, on-brand | `public/qr/umai-qr-a4.pdf` 210×297 mm, 0 raster images, embedded Outfit / DM Serif Display / Noto Sans SC, symbols 43.5 mm, labels « Menu en français », « Menu in English », « Speisekarte auf Deutsch », « Menù in italiano », « 中文菜单 »; visual check by orchestrator (render) | ✓ |
| 3 | Print-ready table tent (A6, bleed, Exaprint-compatible) | `public/qr/umai-qr-chevalet-a6.pdf` 111×154 mm page, TrimBox 105×148 (3 mm bleed), recto/verso with all 5 codes ≥ 25 mm; Exaprint variants `-fp1mm.pdf` (flyers) and `-fp2mm.pdf` (other products); fonts embedded, vector, RGB (Exaprint converts to CMYK) | ✓ |
| 4 | `/menu/qr` lets EK/Loan see the 5 codes and download SVG/PNG + PDFs any time | Live (orchestrator GETs): `/fr/menu/qr`, `/it/menu/qr`, `/zh/menu/qr` 200; `<meta name="robots" content="noindex, nofollow">`; not in sitemap; PDFs `application/pdf`, SVG `image/svg+xml`; `QR SITE OK checks=248` (14 downloads byte-identical to repo, `X-Robots-Tag: noindex`); `QR MOBILE OK` at 375 px | ✓ |

## Also shipped in this phase

- Sanity freshness fix (`useCdn: false` for tagged fetches): `FRESHNESS OK check-on-attempt=1 control-cdn-stale=true` live — a Studio edit now shows right after `revalidate.mjs` (no 2-minute wait). Phase 13 deferred item #3 resolved.
- Regression after deploy: `ROUTING OK checks=84`, `VERIFY OK` ×5 menus + home, `VERIFY TRANSLATIONS OK locales=5`.

## Requirements

QR-01, QR-02, QR-03, QR-04 — satisfied (QR-01: automated decode + live checks; EK's real-phone scan is the post-hoc human check).

## Rollback

VPS was at `86068ab` before this deploy (`ssh umai-app 'cd /home/ek/apps/umai && git reset --hard 86068ab && docker compose -p umai up -d --build web'`).
