# Roadmap: UMAI Ramen — Refonte Site Web 2026

## Milestones

- ✅ **v1.0 MVP Launch** — Phases 1–3, 11 plans (shipped 2026-02-23) → [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 IG Content Studio** — Phases 4–7, de facto delivered & deployed (umai.turfu.in/ig-studio); formal archive pending
- ✅ **v2.1 Mise en ligne production & bascule umai-ramen.fr** — Phases 8–11, delivered 2026-07-16 (umai-ramen.fr live), all 24 REQs checked; formal archive pending
- 🚧 **v2.2 Menu multilingue & QR codes touristes** — Phases 12–15, in progress (opened 2026-11-22)

## Phases

<details>
<summary>✅ v1.0 MVP Launch (Phases 1–3) — SHIPPED 2026-02-23</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-02-23
- [x] Phase 2: Content Pages (5/5 plans) — completed 2026-02-23
- [x] Phase 3: SEO, Compliance, and Launch (3/3 plans) — completed 2026-02-23

</details>

---

## v2.0 — Umaï IG Content Studio

**Core value:** From ~81 professional photos (Nis&For, 2024) → batch-generate Instagram-ready posts: correctly dish-labeled, subtly Umaï-branded, with French captions targeting a Strasbourg audience, plus a human override step for classification corrections.

**Key decisions:**
- CLI batch tool first (fast end-to-end result) → web review UI second (do it well)
- Pilot ~10 photos, validate, then industrialize over all 81
- Overlay auto-selected by shot type: packshot → corner logo + dish chip; ambiance → photo-only
- AI stack: `claude-opus-4-8` for vision quality, `claude-sonnet-4-6` for batch captions (`@anthropic-ai/sdk`)
- Render pipeline: puppeteer-core + local Chrome → PNG → sips (macOS) → 3 Meta formats
- Lives in `ig-studio/` subfolder, separate from website runtime
- **Re-prioritization (2026-06-29): Phase 07 (editor) brought ahead of Phase 06.** Auto-classification proved too error-prone on subtle ramen/mazesoba/végé distinctions → AI is pre-fill only; Loan finalizes everything (dish, overlay, caption) in the `/ig-studio` editor. The editor subsumes most of Phase 06's per-post caption + assembly work.

### Phase 04: Ingestion & Classification (Pilot)

**Goal:** Given the ~81 photos already extracted locally to `ig-studio/photos/`, the CLI classifies each into a summer-menu dish slug or ambiance class with a shot-type tag (Claude Vision, `claude-opus-4-8`), emits a human-editable `classification.json`, and renders an HTML contact sheet for visual review — running `--pilot` (~10) first, gated before `--all` (81).

**Depends on:** v1.0 complete (Sanity schema with 17 dishes is the ground truth)

**Requirements mapped:** INGEST-01, INGEST-02, INGEST-03, INGEST-04, INGEST-05, INGEST-06, INGEST-07, INGEST-08

**Success criteria:**
- `npm run classify -- --pilot` (in `ig-studio/`) classifies ~10 varied local photos → `classification.json`, each `{ file, dishSlug|ambiance, shotType, confidence, reasoning, override }`
- Broth+noodle disambiguation (tantan / tokyo / yuzu / tsukemen / mazesoba / hiyashi / ambiance) produces plausible labels on the pilot set; chashu treated as a topping
- `npm run contact-sheet` renders thumbnails + classification + confidence, sortable for human review
- Manual corrections in `classification.json` (`override: true`) are respected on re-run and by downstream phases
- Full 81-photo `--all` run remains gated until the pilot is reviewed and signed off (`npm run signoff`)

**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — CLI scaffold + Claude Vision classifier against the summer KB → classification.json (override-wins) + pilot gate (INGEST-01..06, 08)
- [ ] 04-02-PLAN.md — HTML contact sheet + pilot review/sign-off checkpoint (INGEST-07, 08)

---

### Phase 05: Brand Kit & Compositing (CLI — Fast Result)

**Goal:** Given a pilot `classification.json` (post-correction), the CLI produces branded PNG variants in all 3 Meta formats for each photo — packshots get a corner Umaï logo + optional dish chip, ambiance shots are photo-only — using a sharp-only compositing pipeline (documented deviation from the puppeteer+sips plan — no Chrome dependency, fully offline).

**Depends on:** Phase 04 (validated pilot classification)

**Requirements mapped:** BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, BRAND-07

**Success criteria:**
- `ig-studio/brand/` module exports design tokens and logo PNG at compositing resolution
- Running `npm run ig:compose` on the pilot set produces `feed.png`, `square.png`, `story.png` per photo
- Packshot output shows Umaï logo in corner; dish-name chip visible when confidence ≥ 0.7
- Ambiance output is photo-only (no overlay elements)
- All output dimensions exactly match Meta specs: 1080×1350, 1080×1080, 1080×1920 (verified via `sips -g pixelHeight`)
- puppeteer-core launches local Chrome (no download, no cloud); no network call at compose time

**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md — Brand kit (tokens + sharp-rasterized logo PNG) + dish chip + shotType-driven applyOverlay (BRAND-01..05)
- [x] 05-02-PLAN.md — coverCrop to exact Meta formats + compose CLI (out/{photoId}/) + review gallery (BRAND-06, 07)

---

### Phase 06: Captions & Full Assembly (CLI Complete) — DEFERRED / OPTIONAL

**Goal:** (Originally) CLI generates FR captions per post and assembles `out/{photo-id}/` deliverables, then industrializes over all 81 with a review gallery.

**Status (2026-06-29):** Largely SUBSUMED by Phase 07. The editor delivers interactive FR captions (CAPTION-01/02/03, UI path) and per-post `out/{id}/` assembly + caption.txt at export (CAPTION-04, UI path). What remains optional here is the headless batch over all 81 (`npm run ig:caption`/`ig:build:all`, CAPTION-05/06) — only build it if a non-interactive bulk pass is wanted after the editor work.

**Depends on:** Phase 05 (composed pilot images), Phase 04 override JSON reviewed by owner

**Requirements mapped:** CAPTION-01, CAPTION-02, CAPTION-03, CAPTION-04, CAPTION-05, CAPTION-06 (01–04 satisfied via Phase 07 UI; 05–06 optional batch)

**Plans placeholder:** TBD (only if a batch pass is still wanted)

---

### Phase 07: IG Studio Editor (web UI for Loan)

**Goal:** A `/ig-studio` route in the existing Next 16 app where Loan reviews each photo, picks the correct dish in a few clicks (canonical menu-options dropdown that auto-fills price/baseline), edits caption, picks overlay mode, sees a live preview of the branded post, regenerates the 3 formats, and exports validated posts — fast, no JSON editing. AI classification is pre-fill only; the human finalizes. FR-only admin tool, auth-gated, outside next-intl `[locale]`.

**Depends on:** Phase 05 (compose/overlay/crop modules to reuse), Phase 04 (classification.json pre-fill). Phase 06 NOT required (editor subsumes its caption/assembly work).

**Requirements mapped:** REVIEW-01, REVIEW-02, REVIEW-03, REVIEW-04, REVIEW-05, REVIEW-06 (+ UI path for CAPTION-01..04)

**Success criteria:**
- `/ig-studio` loads (auth-gated, env-var password), outside `[locale]`; lists all 81 photos with AI suggestion + validated/pending status, filterable
- Per-photo editor: grouped dish dropdown auto-fills editable price/baseline; overlay-mode toggle; "Générer caption" (Claude FR) + editable + savable caption
- Live preview reflects unsaved choices; per-photo Regenerate writes `out/{id}/{feed,square,story}.png` (reuses ig-studio compose)
- Corrections persist to classification.json (override-wins) and survive reload; works against the CANONICAL menu (no tsukemen/hiyashi; végé = Yasai Tantan / Miso végétarien)
- Photos served (with thumbnails) from `ig-studio/photos/` via an auth-gated API route — never copied into `public/`
- Export downloads validated posts as a zip (`{id}/feed,square,story.png` + caption.txt + manifest)

**Plans:** 5/5 plans complete

Plans:
- [x] 07-01-PLAN.md — Auth + (ig-studio) FR route group + locale exclusion in proxy.ts (REVIEW-01, 06) [wave 1]
- [x] 07-02-PLAN.md — ig-studio compositor glue: menu.js + overlayMode-aware overlay + compose --photo/--preview + caption.js (REVIEW-05 capability, CAPTION-01..03 UI) [wave 1]
- [x] 07-03-PLAN.md — Server data lib + auth-gated photo/thumbnail route + gallery grid with filters (REVIEW-01, 02) [wave 2]
- [x] 07-04-PLAN.md — Per-photo editor: dropdown autofill, overlay toggle, caption gen/edit, live preview, save (override-wins), regenerate (REVIEW-03, 04, 05) [wave 3]
- [x] 07-05-PLAN.md — Export validated posts as a zip (out tree + caption.txt + manifest) (REVIEW-05, CAPTION-04 UI) [wave 4]

---

## v2.1 — Mise en ligne production & bascule umai-ramen.fr

**Core value:** Publish the new Next.js site on the primary domain umai-ramen.fr (today still the old GitHub Pages site at `185.199.10x.153`) with complete production content and a controlled, low-risk cutover. Target go-live: week of 2026-07-11.

**Key context:**
- Staging: umai.turfu.in — VPS srv1417179, Docker + Caddy + HMAC deployer
- Production domain: umai-ramen.fr — today GitHub Pages (`umairamenchef.github.io`), target VPS `76.13.61.239`
- Sanity: project `c7twe801`, dataset `production`
- GitHub: `umairamenchef/umai-ramen-site`, branch `v2-2026`
- Short maintenance window acceptable; rollback = revert DNS to GitHub Pages IPs

### Phase 08: Audit go-live & gap analysis

**Goal:** A documented, prioritized gap list covering content, SEO, performance, redirects, and cutover mechanics — produced by real page-by-page review of umai.turfu.in — that gates all execution in Phases 09, 10, and 11.

**Depends on:** umai.turfu.in accessible (staging site running on VPS)

**Requirements:** AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05, AUDIT-06, AUDIT-07

**Success criteria (what must be TRUE):**
1. Every page on umai.turfu.in has a written review documenting missing content, placeholder images, broken links, and untranslated FR/EN/DE strings
2. Menu discrepancies against the current in-restaurant summer menu are listed at dish/price/tag/availability granularity
3. An old-URL → new-URL 301 redirect map is produced from the indexed GitHub Pages URL set, covering all paths that appear in search results or external links
4. A cutover-readiness dossier exists with the exact Caddy config diff, DNS records to change (apex A + www CNAME/A), TTL-lowering plan, and TLS provisioning approach
5. A single prioritized gap list (blocking / major / minor) is in hand and drives the scope of Phases 09 and 10

**Plans:** TBD

---

### Phase 09: Contenu & visuels production (Sanity)

**Goal:** Sanity production dataset (`c7twe801/production`) holds real hero photography, accurate summer menu, verified contact/hours/NAP, complete legal pages in FR/EN/DE, validated Notre Histoire copy and gallery, and on-brand OG images — nothing placeholder remains before the domain goes live.

**Depends on:** Phase 08 (asset list from AUDIT-03 and content discrepancy list from AUDIT-01/02)

**Requirements:** CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, CONTENT-06

**Success criteria (what must be TRUE):**
1. Accueil hero and any per-page heroes display real Nis&For photography — no placeholder images remain visible on umai.turfu.in
2. Summer menu in Sanity matches the current in-restaurant offering: all dishes present in FR/EN/DE with correct prices, dietary tags, and availability flags
3. Legal pages (mentions légales, confidentialité, cookies, CGV) are complete and accurate in all three languages, including éditeur, directeur de publication, hébergeur, and SIRET
4. Notre Histoire copy is validated with Loan and the Galerie page is populated with the final selected photos
5. Opening a key page link on social media shows a real, on-brand OG image (not a placeholder or the default fallback)

**Plans:** TBD
**UI hint:** yes

---

### Phase 10: Résorption dette & polish

**Goal:** Known tech debt (SEO-07 footer NAP, PERF-05 JS budget, bundle-analyzer unwired) is resolved and every blocking/major issue from the Phase 08 audit is fixed — the site on umai.turfu.in is production-worthy before any domain cutover starts.

**Depends on:** Phase 08 (prioritized gap list drives DEBT-04 scope)

**Requirements:** DEBT-01, DEBT-02, DEBT-03, DEBT-04

**Success criteria (what must be TRUE):**
1. Footer NAP (address, phone, hours) is wired to `seo.ts` constants and visually matches JSON-LD output across all three locales — no divergence between footer text and structured data
2. `ANALYZE=true npm run build` completes without error and opens the bundle-analyzer report
3. First-load JS budget is documented with the irreducible framework floor; any achievable reductions are applied and the final number is committed to DEBT-03 plan summary
4. Every issue marked "blocking" in the Phase 08 gap list is closed and verified on umai.turfu.in

**Plans:** TBD

---

### Phase 11: Cutover domaine & vérifications live

**Goal:** umai-ramen.fr serves the new Next.js site over HTTPS with a single canonical host, old indexed URLs 301-redirect to their new equivalents, and post-cutover verification confirms the site is production-healthy — Lighthouse > 90, Core Web Vitals pass, Search Console updated.

**Depends on:** Phase 08 (cutover dossier: Caddy config + DNS records), Phase 09 (all content ready), Phase 10 (all blocking debt fixed). This is the go-live gate.

**Requirements:** CUTOVER-01, CUTOVER-02, CUTOVER-03, CUTOVER-04, CUTOVER-05, CUTOVER-06, CUTOVER-07

**Success criteria (what must be TRUE):**
1. umai-ramen.fr and www.umai-ramen.fr both resolve to the VPS with a valid TLS certificate — no browser security warnings, no mixed-content errors
2. www.umai-ramen.fr permanently (301) redirects to the apex domain on every request, enforcing a single canonical host
3. A representative sample of old GitHub Pages URLs return 301 to their correct new equivalents — no terminal 404s on indexed inbound links
4. Post-cutover Lighthouse score > 90, Core Web Vitals pass, sitemap.xml and robots.txt resolve correctly, JSON-LD validates, reservation and order CTAs are functional, and `/ig-studio` is reachable behind its password gate on the public domain
5. The rollback procedure (revert apex A and www records to GitHub Pages IPs + disable Caddy site block) is written and Search Console shows the new sitemap submitted with a reindex request

**Plans:** TBD

---

## v2.2 — Menu multilingue & QR codes touristes

**Core value:** A foreign tourist scans a QR code and reads the 2026 menu in their language (EN/DE/IT/ZH) on their phone, with each dish's French name always visible so the server can take the order.

**Key context:**
- Source of truth = the latest Exaprint print, stored in `.planning/sources/menu-2026/` (`plats-ouvert-360x250mm-print-2026-11-10.pdf`, `boissons-180x250mm-print-2026-11-03.pdf` + extracted `*-print.txt`). The print still contains placeholders (`??` Année Lumière prices, `????` Trio dégustation description) and typos (`Asashi`) that EK must settle before anything is published.
- Locked by EK (2026-11-22): IT/ZH are menu-only (+ QR page); simplified Chinese only; Claude translates (native review optional later); mobile web page, no per-language PDF.
- Starting point: Next.js 16 + next-intl v4 (locales fr/en/de in `src/i18n/routing.ts`), Sanity v5 field-level `localeString`/`localeText` (fr required, en/de optional), menu page `src/app/(site)/[locale]/menu/page.tsx`, live on https://umai-ramen.fr. Sanity content (`c7twe801` / `production`) is edited directly in production.

**Execution order:** 12 → 13 → 14 → 15. Phase 13 can overlap Phase 12's wait on EK's validation; Phase 15 can be built as soon as Phase 13 lands, but its real-phone scan test and the Exaprint order wait for Phase 14's content.

**Phases (v2.2):**

- [x] **Phase 12: Synchronisation menu print 2026 → Sanity** - The live FR menu mirrors the 2026 print exactly (items, prices, variants, notes), validated by EK before publication (completed 2026-11-23)
- [ ] **Phase 13: Fondations multilingues & page menu touriste** - IT/ZH menu-only locales, language switcher and a bilingual (translated name + FR name) mobile menu page
- [ ] **Phase 14: Traductions EN/DE/IT/ZH** - Full menu translated into 4 languages in Sanity, Japanese names kept and explained, review sheet for native speakers
- [ ] **Phase 15: QR codes & supports imprimables** - One QR per language on an A4 sheet and a table tent ready for Exaprint, plus a `/menu/qr` download page

**Coverage:** 22/22 v2.2 requirements mapped, each to exactly one phase (MENU-01..06 → 12 · I18N-01..05 + UI-01..04 → 13 · TRANS-01..03 → 14 · QR-01..04 → 15).

### Phase 12: Synchronisation menu print 2026 → Sanity
**Goal**: The live FR menu is a faithful, EK-validated mirror of the 2026 printed menu — every dish, drink, dessert, kids menu and extra with the exact names, descriptions, prices and order — and no placeholder or typo from the print reaches production.
**Depends on**: Nothing (builds on the live v2.1 site; the current Sanity menu, rebuilt from eazee-link in July, is the starting point)
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06
**Success Criteria** (what must be TRUE):
  1. On `umai-ramen.fr/fr/menu` a visitor sees every dish, drink, dessert, kids menu and extra of the 2026 print (food spread and drinks) with the same FR names, descriptions, prices and category order, and nothing that is not on the print; items dropped from the print no longer show (availability off) but still exist in Studio.
  2. Items with several prices show every variant, correctly labelled, on the live menu (3/6/9 pcs, 25cl/50cl, 1/2 boules, verre/bouteille — « 1/2 boules » is not on the 2026 print: unit supported, unused).
  3. A print-vs-Sanity discrepancy report (added / removed / changed price / changed text) is produced and kept in the phase folder, and a full export of the Sanity menu documents is taken before any production write (rollback path). _Autonomy grant (EK, 2026-11-23: « Avance en autonome jusqu'à livraison déployé »): the report is applied with Claude's documented defaults and handed to EK for post-hoc review instead of a blocking pre-approval._
  4. The print's service notes and markers appear on the live menu in French and are stored so they can be translated: « Le midi seulement » (Udon), « Pour les enfants de moins de 10 ans » (Menu enfant), « Notre best-seller » (Tantan Ramen), « Version végétarienne disponible » (not on the 2026 print: badge supported, unused), « Complétez votre bol avec nos extras ».
  5. No `??` or `????` is visible anywhere on the live menu — Année Lumière shows « Prix sur demande » (translatable) until EK supplies the 12cl/25cl/50cl prices, Trio dégustation uses the BAT description « Trois sakés sélectionnés par notre équipe. » — and obvious print typos are corrected on the web (« Asashi » → « Asahi »), all listed for EK's post-hoc review.
**Plans:** 3/3 plans complete

Plans:
- [x] 12-01-PLAN.md — Schema (price variants, prix sur demande, badges, sub-groups, category JP label/section/footnote, formule availability) + FR rendering, page notes, JSON-LD offers, hardened home queries; backward compatible (MENU-01/02/03/05/06) [wave 1]
- [x] 12-02-PLAN.md — Visual transcription of the print → scripts/menu-2026/menu-2026.json (validated, price cross-check) + sync-menu.mjs (backup / dry-run / apply / rollback) + discrepancy report, read-only runs (MENU-01..06) [wave 1]
- [x] 12-03-PLAN.md — Live tooling (verify-live, signed revalidate), deploy code via SSH and verify legacy still renders, then backup + apply sync to production, refresh cache, verify FR/EN/DE/home live, finalize report (MENU-01..06) [wave 2]

**Notes**:
- Read the print PDFs visually, not only the `*-print.txt`: the text layer detaches prices from items (e.g. the takoyaki vs gyoza price rows, the sake descriptions), and « Version végétarienne disponible » and the « 1/2 boules » variants are not visible in it.
- Schema gap: `menuItem.price` is a single required number, so MENU-02 needs a price-variant model — keep quantity and unit structured so Phase 13 can translate units through message files — plus matching JSON-LD offers; the MENU-05 markers need fields too.
- Scale: ≈80 print entries vs ≈167 `menuItem` / 26 `menuCategory` in Sanity (state of 2026-07-14), so expect a large hide set. Export the dataset before applying, hide rather than delete, and reset stale en/de copies whenever an item's FR text changes.
- EK-gated inputs: Année Lumière prices, Trio dégustation description, typo and format confirmations (« Asashi », `9.00` / `8.50` / `15.5°` decimal styles). If a value cannot be supplied, EK chooses the fallback (hide the item or omit the variant); `??` is never published.
- MENU-05 is mapped here for the French carry-over; its EN/DE/IT/ZH versions arrive through the Phase 13 labels (I18N-03) and the Phase 14 content (TRANS-01).

### Phase 13: Fondations multilingues & page menu touriste
**Goal**: A tourist can open the menu in English, German, Italian or Chinese on a phone, switch language without rescanning, and read each dish with the translated name first and the French name always visible; IT and ZH exist for the menu only.
**Depends on**: Phase 12 (shared menu schema and components: price variants and notes); can overlap Phase 12's wait on EK's validation
**Requirements**: I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. In Sanity Studio every translatable menu text (item names and descriptions, categories, notes) offers Italian and Chinese inputs next to FR/EN/DE, and a value typed there appears on `/it/menu` or `/zh/menu`.
  2. `umai-ramen.fr/it/menu` and `/zh/menu` load, while any other `/it/*` or `/zh/*` URL (e.g. `/it/infos`, `/zh`) redirects to its `/en/*` equivalent; `/fr`, `/en` and `/de` are unchanged; hreflang alternates and `sitemap.xml` list the IT and ZH menu URLs (and only those).
  3. A language switcher at the top of the menu page (FR · EN · DE · IT · 中文) changes the language while keeping the visitor on the menu; section headings, badges, price units and the « allergen list available on request » and « service included » notes all appear in the selected language.
  4. On the `/en`, `/de`, `/it` and `/zh` menu pages every item shows the translated name as primary text and the French name as clearly legible secondary text next to the price (shown once when identical, e.g. Japanese names), while `/fr/menu` stays French-only with no duplicate name; Chinese text renders in simplified glyphs with no missing characters under a simplified-Chinese `lang`.
  5. On a 375px-wide phone the menu offers a category quick-nav with no horizontal scroll, and Lighthouse stays above 90 on every menu locale, including `/zh/menu`.
**Plans:** 1/3 plans executed

Plans:
- [x] 13-01-PLAN.md — Locale rules module (`src/i18n/locales.ts`), message checker, it.json/zh.json (EN-merged base), proxy redirect non-menu /it|/zh → /en, `<html lang>` (zh-Hans), hreflang + sitemap (menu only), routing verifier (I18N-02/03/05, UI-04) [wave 1]
- [ ] 13-02-PLAN.md — Studio it/zh fields + FR-secondary-name rule (TDD), menu-page language pills, bilingual item row, zh system font stack, eazee CTA removed, lighter quick-nav, it/zh prerender, chrome strings, translated dietary pills, meta description without formules (I18N-01/04/05, UI-01..04) [wave 2]
- [ ] 13-03-PLAN.md — Local production gate, SSH deploy, live checks (routing matrix, 5-locale menu verify, 375px browser check), Lighthouse 3 runs × 5 locales, reversible Studio→it/zh probe (all 9) [wave 3]
**UI hint**: yes
**Notes**:
- Menu-only gating touches `src/i18n/routing.ts` (fr/en/de today), `src/proxy.ts` (redirect rule), per-page `generateStaticParams`, `buildAlternates` in `src/lib/seo.ts` (hreflang hardcoded to fr/en/de), `src/app/sitemap.ts`, the OG `locale` mapping on the menu page and `<html lang>` (zh → simplified Chinese).
- Header, footer, cookie banner and order modal also render around `/it/menu` and `/zh/menu`: decide in discuss-phase whether they fall back to EN or get minimal IT/ZH strings (I18N-03 only mandates the menu UI labels).
- `Noto Sans JP` (300/400, decorative, `preload: false`) will not cover simplified-only glyphs: scope a Simplified-Chinese font to the zh menu route and watch the Lighthouse budget (research flag).
- Shared `localeString` / `localeText` also serve non-menu documents (pages, settings): IT/ZH inputs will appear there unused. Accept (collapsed fieldset) or scope to menu documents.
- The item row (translated name, FR secondary name, price variants from Phase 12, badges) is designed once here; consider `/gsd:ui-phase 13` before planning.

### Phase 14: Traductions EN/DE/IT/ZH
**Goal**: Every text of the menu (items, descriptions, categories, notes) exists in English, German, Italian and simplified Chinese in Sanity, with Japanese dish names preserved and explained, and EK holds a review sheet to have the translations checked by native speakers.
**Depends on**: Phase 12 (final validated FR content), Phase 13 (IT/ZH fields and UI labels in place)
**Requirements**: TRANS-01, TRANS-02, TRANS-03
**Success Criteria** (what must be TRUE):
  1. On `/en/menu`, `/de/menu`, `/it/menu` and `/zh/menu`, every available item name, description and category heading — and the service notes and markers from Phase 12 — appears in that language, with no French text except the intentional secondary FR name.
  2. Japanese dish names (Tantan, Karaage, Gyoza, Mazesoba, Tsukemen, Takoyaki…) appear unchanged in every language, and each translated description explains the dish in a few words.
  3. EK has a review sheet listing FR | EN | DE | IT | ZH for every item, ready to hand to native speakers, with the ZH column visibly flagged "to review".
**Plans:** TBD
**Notes**:
- Claude produces the translations (locked by EK); they are static Sanity content, with no runtime machine translation. Native review is optional and comes later.
- Back criterion 1 with a completeness check (no empty en/de/it/zh on an available item); the review sheet must be regenerable from Sanity after native-speaker corrections are applied.

### Phase 15: QR codes & supports imprimables
**Goal**: EK can print and place QR codes — one per language — that open the right tourist menu on any phone, using on-brand A4 and table-tent files ready for Exaprint, and can download them again at any time.
**Depends on**: Phase 13 (menu routes live), Phase 14 (translated content live before the real-phone scan test and the print order)
**Requirements**: QR-01, QR-02, QR-03, QR-04
**Success Criteria** (what must be TRUE):
  1. Scanning each of the 5 QR codes with a real phone camera opens `https://umai-ramen.fr/{fr,en,de,it,zh}/menu` in the matching language, showing the translated menu.
  2. A printable A4 sheet (vector PDF) shows the 5 QR codes, each labelled in its own language and script ("Menu in English", "中文菜单", …), in the Umaï brand look.
  3. A print-ready table tent (A6 or folded card, PDF with bleed, Exaprint-compatible) carries the 5 QR codes, and EK can send it to Exaprint without rework.
  4. EK or Loan can open `/menu/qr` at any time, see the 5 QR codes, and download each as SVG or PNG plus the A4 and table-tent PDFs.
**Plans:** TBD
**UI hint**: yes
**Notes**:
- Research flag: Exaprint requirements for the chosen format (bleed, colour profile, embedded fonts including a CJK font for the 中文 label) and QR minimum size and quiet zone. EK picks A6 vs folded card in discuss-phase.
- `/menu/qr` sits under the locale prefix (`/fr/menu/qr`): keep it `noindex` and out of the sitemap, and decide whether to gate it (e.g. reuse the ig-studio password). The I18N-02 redirect rule applies to its `/it` and `/zh` variants.
- QR codes encode plain `https://umai-ramen.fr/{locale}/menu` URLs (per-language scan tracking is deferred).

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-23 |
| 2. Content Pages | v1.0 | 5/5 | Complete | 2026-02-23 |
| 3. SEO, Compliance, and Launch | v1.0 | 3/3 | Complete | 2026-02-23 |
| 4. Ingestion & Classification (Pilot) | v2.0 | 0/2 | Pending | — |
| 5. Brand Kit & Compositing | v2.0 | 2/2 | Complete | 2026-06-29 |
| 6. Captions & Full Assembly | v2.0 | 0/? | Deferred (subsumed by Phase 07) | — |
| 7. IG Studio Editor (web UI) | v2.0 | 4/5 | In Progress | — |
| 8. Audit go-live & gap analysis | v2.1 | 1/1 | Complete | 2026-07-09 |
| 9. Contenu & visuels production (Sanity) | v2.1 | — | Complete (done inline, no plans; see STATE) | 2026-07-16 |
| 10. Résorption dette & polish | v2.1 | — | Complete (done inline, no plans; see STATE) | 2026-07-16 |
| 11. Cutover domaine & vérifications live | v2.1 | — | Complete (done inline, no plans; see STATE) | 2026-07-16 |
| 12. Synchronisation menu print 2026 → Sanity | v2.2 | 3/3 | Complete    | 2026-11-23 |
| 13. Fondations multilingues & page menu touriste | v2.2 | 1/3 | In Progress|  |
| 14. Traductions EN/DE/IT/ZH | v2.2 | 0/? | Not started | — |
| 15. QR codes & supports imprimables | v2.2 | 0/? | Not started | — |
