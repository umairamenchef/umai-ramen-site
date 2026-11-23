# Requirements: v2.2 — Menu multilingue & QR codes touristes

> Previous milestone requirements archived: [milestones/v2.1-REQUIREMENTS.md](milestones/v2.1-REQUIREMENTS.md)

**Milestone goal:** A foreign tourist scans a QR code and reads the 2026 menu in their language (EN/DE/IT/ZH) on their phone, with each dish's French name always visible so the server can take the order.

## Table Stakes (must be true for v2.2 to ship)

- The live web menu matches the 2026 printed menu (latest Exaprint print, `.planning/sources/menu-2026/`)
- `/en/menu`, `/de/menu`, `/it/menu`, `/zh/menu` show the full menu in that language, FR name visible on every item
- Printed QR codes open the right language and scan reliably

## v2.2 Requirements

### Menu Data Sync (printed menu 2026 → Sanity)

> Source: `.planning/sources/menu-2026/` — `plats-ouvert-360x250mm-print-2026-11-10.pdf` + `boissons-180x250mm-print-2026-11-03.pdf` (latest print, real text layer → `*-print.txt`).

- [ ] **MENU-01**: Every dish, drink, dessert, kids menu and extra from the 2026 print exists in Sanity with the exact FR name, FR description, price(s) and category, in the printed order
- [ ] **MENU-02**: Items with several prices (3/6/9 pcs, 25cl/50cl, 1/2 boules, verre/bouteille) display every price variant correctly on the web menu
- [ ] **MENU-03**: Items that are no longer on the printed menu are hidden from the web menu (availability off), not deleted
- [ ] **MENU-04**: EK validates a print-vs-Sanity discrepancy report (added / removed / changed price / changed text) before the sync is published
- [ ] **MENU-05**: Service notes and markers from the print are carried over and translated: « Le midi seulement » (Udon), « Pour les enfants de moins de 10 ans » (Menu enfant), « Notre best-seller » (Tantan Ramen), « Version végétarienne disponible », « Complétez votre bol avec nos extras »
- [ ] **MENU-06**: Print placeholders are resolved with EK before publishing — no `??` on the web (Année Lumière 12cl/25cl/50cl prices, Trio dégustation description) — and print typos are confirmed/corrected on the web (e.g. « Asashi » → « Asahi »)

### Languages & Routing

- [ ] **I18N-01**: Sanity `localeString` / `localeText` carry `it` and `zh` fields, editable in Studio alongside fr/en/de
- [ ] **I18N-02**: A tourist can open `umai-ramen.fr/it/menu` and `umai-ramen.fr/zh/menu`; any other `/it/*` or `/zh/*` URL redirects to the `/en/*` equivalent (IT/ZH are menu-only)
- [ ] **I18N-03**: All menu UI labels (section headings, badges, price units, notes) are translated in FR/EN/DE/IT/ZH
- [ ] **I18N-04**: A language switcher at the top of the menu page lets the tourist change between FR · EN · DE · IT · 中文 without rescanning, staying on the menu
- [ ] **I18N-05**: Chinese text renders with proper simplified-Chinese glyphs (no tofu/missing characters) and the page declares the right `lang`; hreflang + sitemap include the IT/ZH menu URLs

### Translations

- [ ] **TRANS-01**: Every menu item name, description and category is translated into EN, DE, IT and ZH
- [ ] **TRANS-02**: Japanese dish names (Tantan, Karaage, Gyoza, Mazesoba, Tsukemen, Takoyaki…) are kept as-is in every language, with a short explanation in the translated description
- [ ] **TRANS-03**: A review sheet (FR | EN | DE | IT | ZH per item) is exported for optional native-speaker review; ZH is flagged "to review"

### Tourist Menu Page

- [ ] **UI-01**: On `/{en,de,it,zh}/menu`, each item shows the translated name as primary text and the FR name as clearly legible secondary text, next to the price
- [ ] **UI-02**: `/fr/menu` is unchanged for French visitors (FR only, no duplicate name)
- [ ] **UI-03**: The "allergen list available on request" and "service included" notes appear translated in each language
- [ ] **UI-04**: The menu page is comfortable on a 375px-wide phone (category quick-nav, no horizontal scroll) and keeps Lighthouse > 90

### QR Codes

- [ ] **QR-01**: Each language has a QR code encoding `https://umai-ramen.fr/{locale}/menu`, verified by scanning on a real phone
- [ ] **QR-02**: A printable A4 sheet (PDF, vector QR) shows the 5 QR codes, each labelled in its own language/script (e.g. "Menu in English", "中文菜单"), on-brand
- [ ] **QR-03**: A print-ready table tent (A6 or folded card, PDF with bleed, Exaprint-compatible) carries the 5 QR codes
- [ ] **QR-04**: A web page (`/menu/qr`) displays the 5 QR codes and lets EK/Loan download each one (SVG/PNG) plus the A4 and table-tent PDFs at any time

## Future Requirements (deferred)

- "Montrer au serveur" mode — tourist ticks dishes, shows an FR recap screen to the server
- Per-language scan tracking (UTM / analytics per QR)
- Per-language downloadable PDF menu
- IT/ZH on the rest of the site (accueil, infos, réservation…)
- Traditional Chinese (Taiwan / Hong Kong)
- Native-speaker review integrated (once reviewers are found)
- Additional languages (ES, JA, KO…)

## Out of Scope (v2.2)

| Feature | Reason |
|---------|--------|
| Online ordering / payment from the menu | Orders are taken by the server in the restaurant |
| Runtime machine translation (DeepL/Google API) | Translations are static content in Sanity, reviewed once |
| Per-language PDF menus | EK chose the mobile web page as the format |
| Redesign of the printed menu | Already printed at Exaprint |
| Replacing the eazee-link QR in the restaurant | Out of this milestone unless EK decides to retire it |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MENU-01 | Phase 12 | Pending |
| MENU-02 | Phase 12 | Pending |
| MENU-03 | Phase 12 | Pending |
| MENU-04 | Phase 12 | Pending |
| MENU-05 | Phase 12 | Pending |
| MENU-06 | Phase 12 | Pending |
| I18N-01 | Phase 13 | Pending |
| I18N-02 | Phase 13 | Pending |
| I18N-03 | Phase 13 | Pending |
| I18N-04 | Phase 13 | Pending |
| I18N-05 | Phase 13 | Pending |
| TRANS-01 | Phase 14 | Pending |
| TRANS-02 | Phase 14 | Pending |
| TRANS-03 | Phase 14 | Pending |
| UI-01 | Phase 13 | Pending |
| UI-02 | Phase 13 | Pending |
| UI-03 | Phase 13 | Pending |
| UI-04 | Phase 13 | Pending |
| QR-01 | Phase 15 | Pending |
| QR-02 | Phase 15 | Pending |
| QR-03 | Phase 15 | Pending |
| QR-04 | Phase 15 | Pending |

**Coverage:** 22/22 mapped ✓ — every requirement assigned to exactly one phase (MENU 6 → Phase 12 · I18N 5 + UI 4 → Phase 13 · TRANS 3 → Phase 14 · QR 4 → Phase 15)

> MENU-05 is mapped to Phase 12 for the French carry-over of the print notes and markers; their EN/DE/IT/ZH versions are produced under I18N-03 (Phase 13 UI labels) and TRANS-01 (Phase 14 content).

---
*Requirements defined: 2026-11-22 (v2.2 milestone opening)*
*Traceability filled: 2026-11-23 (roadmap v2.2, Phases 12–15)*
