---
gsd_state_version: 1.0
milestone: v2.2
milestone_name: Menu multilingue & QR codes touristes
status: Ready to execute
stopped_at: Completed 13-01-PLAN.md
last_updated: "2026-11-23T21:28:45.523Z"
progress:
  total_phases: 12
  completed_phases: 4
  total_plans: 17
  completed_plans: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-22 after v2.2 milestone opening)

**Core value (v2.2):** A foreign tourist scans a QR code and reads the 2026 menu in their language (EN/DE/IT/ZH), with the FR dish name always visible for ordering.
**Current focus:** Phase 13 — Fondations multilingues & page menu touriste

## Current Position

Phase: 13 (Fondations multilingues & page menu touriste) — EXECUTING
Plan: 2 of 3

### Deployed autonomously 2026-07-14 (commit 64378b7, verified live on umai.turfu.in)

- EN/DE i18n leaks fixed (reservation microcopy + Infos FAQ ×3) ✓
- og-image.jpg 1200×630 on-brand created — 404→200 ✓ (fallback; EK may replace with a photo)
- DEBT-02 bundle-analyzer wired (ANALYZE=true) ✓ COMPLETE
- /galerie empty-state guard ✓
- C-2 (EN/DE hero) resolved as false alarm — hero correctly localized
- C-8 (commit 5162dd4): re-accentuated fr.json (188 accents) + de.json (ä/ö/ü/ß, "Straßburg") — site-wide FR/DE diacritics restored ✓
- Decisions from EK: canonical = apex umai-ramen.fr (www→apex 301); catchphrase localized EN/DE; og fallback approved

### Legal pages FILLED (commit 7a34316, verified live)

- Registry-verified MOKORITA SAS data (SIREN 892 691 619, capital 20 000 €, RCS Strasbourg, APE 5610A) via annuaire-entreprises.data.gouv.fr; directeur de publication Christopher Keopraseuth (DG & co-fondateur, per EK); hébergeur Hostinger; contact@umai-ramen.fr. FR/EN/DE. → CONTENT-04 COMPLETE.
- OPEN (minor confirms, non-blocking): EK-SARL treatment (affiliation vs distinct éditeur entity needing its own SIREN); confirm contact@umai-ramen.fr mailbox exists.

### Content populated autonomously 2026-07-14 (Sanity production, via write token)

- **Gallery**: was NOT empty (9 `gallery` docs — earlier "0" was a wrong-type query on `galleryImage`). Renders live ✓.
- **Notre Histoire**: 4 sections had no images → uploaded 4 Nis&For photos (umai_009 passion, umai_001 fait-maison, umai_013 intérieur, umai_011 équipe) + patched `page-notre-histoire`. (Page schema has NO heroImage field — the "missing hero" finding was a false positive.)
- **Menu photos**: 13→**14/17**. Attached umai_064 (crémeux matcha) to `item-panna-cotta`. Remaining 3 without photos (Edamame, Mochi glacé, Tiramisu Framboise-Litchi) — no accurate Nis&For match; left empty rather than mismatched. EK to supply if wanted.
- **EK SARL** added to directeur-de-publication line (commit 11a86ea).

### Menu FULLY REBUILT from eazee-link (2026-07-14, CONTENT-02 done, verified live)

- Source of truth = eazee-link current menu (sticker GIK39GHKQZ, API api-menu.vazeetap.com). Cross-checked vs summer-2026 PDF + relecture PDF.
- Old 17-item menu was heavily outdated (phantom dishes Tori Paitan/Shoyu/Shio Ramen/Panna Cotta; wrong prices ~everywhere; ~25 dishes missing).
- Rebuilt: **167 menuItems + 26 menuCategories** (food + desserts + menus + extras + full drinks), correct FR names/prices/descriptions, categories FR/EN/DE. Item names en/de = fr; item descriptions FR-only (localized() fallback) → EN/DE translations are the "edit later" part. Tags (veg/GF) heuristic — refine in Studio.
- Old items + cat-soba deleted. Panna-cotta photo asset now orphaned (harmless).

### Order popup shipped 2026-07-14 (commit 957e4d3, verified live)

- "Commander" opens a 3-choice modal: Livraison (Uber Eats) / À emporter (obypay) / Click & Collect (Flipdish). Components `src/components/order/{OrderModal,OrderButton}.tsx`; wired Header/MobileBar/Footer/MobileMenu; URLs from Sanity siteSettings (added `obypayUrl` field+value); i18n `orderModal` FR/EN/DE.
- **Hero CTA → modal DONE** (commit d85b741, verified live): HOME query fetches obypayUrl+clickCollectUrl; Hero takes `orderUrls` + renders `OrderButton` (outline-white). 0 direct uber-anchors on `/fr`. ✓

### Carte d'été corrigée depuis le texte de Loan — 2026-07-17 (commit 25468c7, live)

- `src/data/summerMenu2026.ts` corrigé d'après le retour de Loan (source de vérité) : **Ramen** « Shoyu Ramen »→**Tokyo** (+ intro huile de niboshi, Yuzu redécrit) ; **Tantan** descriptions complètes (lait soja, daikon, cacahuètes, 🌶️) + **mention végé RETIRÉE** du Tantan Ramen (erronée) + note piment ; **Mazesoba** intro + descs ; **Tsukemen** « Gyokai »→**Noukou Gyokai**, Miso/Curry corrigés, note Ⓥ perso. Modèle enrichi : `Dish.note` + `Section.footnote`. Prix inchangés (tous corrects). i18n `carteEte.vegOption` désormais inutilisé (inoffensif, dans le blob next-intl, non rendu).
- **PDF récap produit** pour Loan/maquettiste (charte Umaï, 1 page A4) — fichier éphémère dans scratchpad `UMAI_carte-ete_corrections_Loan.pdf`, régénérable via `scratchpad/correctif.html` + Chrome `--print-to-pdf`.
- ⚠️ **OUVERT** : (1) le **PDF imprimable** `public/carte-ete-umai-2026.pdf` a ENCORE l'ancien texte (Shoyu/Gyokai/descs courtes/végé) → à **re-exporter** côté maquette puis swap sur le site ; (2) EK à décider : **retirer le bouton « Télécharger le PDF »** de `/carte-ete` en attendant ? (non tranché) ; (3) descriptions carte été = FR only (EN/DE fallback).

### 🚀 GO-LIVE DONE — 2026-07-16: umai-ramen.fr cut over to the VPS (new site LIVE)

- **DNS (Gandi LiveDNS, EK executed)**: apex `@` + `www` A → `76.13.61.239` (TTL 300). Removed the 4 GitHub Pages A records + the www→github.io CNAME. **MX/SPF/SRV/webmail untouched** (email intact). NS unchanged (Gandi LiveDNS). Google/Cloudflare already resolve to the VPS within minutes.
- **VPS (me)**: base URL flipped `NEXT_PUBLIC_BASE_URL=https://umai-ramen.fr` in docker-compose.yml build-arg + .env.local, web rebuilt (canonical/sitemap/robots/OG now umai-ramen.fr). Caddy: added `umai-ramen.fr` (→web:3000) + `www.umai-ramen.fr` (301→apex) blocks, validated + reloaded; auto TLS (Let's Encrypt) obtained in ~8s. Host backups: `docker-compose.yml.bak-cutover`, `.env.local.bak-cutover`, `Caddyfile.bak-cutover`.
- **Verified live on umai-ramen.fr**: FR/EN/DE pages 200, www→apex 301, `/`→`/fr` 307, valid TLS, canonical/sitemap/robots = umai-ramen.fr, JSON-LD present, Commander/Réserver present, `/ig-studio` gated (307→login). CUTOVER-01..06 ✅.
- **Rollback** = revert Gandi apex+www A → `185.199.108–111.153` (+ www CNAME github.io); TTL 300 → fast. Host files restore from `*.bak-cutover`.
- **STILL PENDING (EK)**: Search Console — add umai-ramen.fr property + submit sitemap (CUTOVER-07). **Deferred by me** (do once settled, ~a day): 301 `umai.turfu.in → umai-ramen.fr` (keeping `/webhook/*` on turfu.in so git-push deploys keep working) — currently turfu.in stays as a live mirror/fallback. Non-blocking confirms still open: contact@umai-ramen.fr mailbox active?; EK-SARL entity; broth 6h vs 12h.
- **Deploy still = `git push origin v2-2026`** (webhook on umai.turfu.in/webhook → rebuild); base URL is now umai-ramen.fr so rebuilds stay correct.

### Session 2 — 2026-07-14 (post-/clear): Hero, EK's 3 content points, DEBT — ALL verified live on umai.turfu.in

- **Copy de-em-dashed + Loan = "elle"** (commit 174b5b6 + Sanity): EK found cascading em-dashes too AI-sounding. Rewrote all story prose with natural punctuation — **0 em-dashes left in `src/messages/*`** (histoireTeaser, carte-ete subtitle, EN FAQ, legal "co-founder, EK SARL"). Notre Histoire section bodies rewritten in Sanity to match. **Loan is now feminine** ("elle", "s'est formée"). (Only remaining "—" site-wide: Footer tagline "Ramen Noodle Bar — Strasbourg" — a design separator, left as-is; change on request.)
- **Notre Histoire = Loan's journey** (commit 9086122 + Sanity): rewrote the story to center **Loan** (founder) — Japan → Singapore, several chefs & ramen schools, transmitted technique, 100% house-made noodles — instead of a generic "our team trained in Japan". Section-1 heading → "Le voyage de Loan" / "Loan's journey" / "Loans Reise"; 4 section bodies rewritten FR/EN/DE in Sanity (page-notre-histoire); home `histoireTeaser` updated FR/EN/DE. **Copy is gender-neutral** (no elle/il, no gendered participles on Loan) since Loan's gender wasn't specified — EK can add pronouns. Live ✓.
- **Menu sticky-nav auto-scroll** (commit 9086122): the horizontal category bar (`MenuStickyNav`) now auto-centers the active tab as you scroll (was highlighting off-screen tabs, e.g. TSUKEMEN cut off). Uses `nav.scrollBy({left, smooth})` on activeSlug change (horizontal only, no page jump); refs on nav + buttons. Live ✓ (scroll-follow needs a device to feel).
- **Hero → order modal** (d85b741) ✓ [above].
- **Founder story** (Sanity, ISR): filled the 4 empty `page-notre-histoire` section bodies FR/EN/DE (were heading+image only, no body) — passion/formation au Japon, fait-maison + bouillons 6h, 100% local (poulet fermier d'Alsace), expérience/Tantan signature. Live ✓.
- **Tantan signature** (commit 6557338): new `SignatureSection` home block (editorial photo `public/signature-tantan.jpg` from umai_066 + live price 14,90 € from Sanity, `name.fr == "Tantan Ramen"`) after MenuPreview; enriched `histoireTeaser`. Menu photo: uploaded umai_022 → Tantan menuItem `item-e3480254`. Live ✓.
- **Summer menu promo** (6557338): new `SummerBanner` accent band after Hero. i18n `summer*`/`signature*` FR/EN/DE (home keys 19→27, parity ✓). Live ✓.
- **Carte d'été → HTML natif** (final, commits 3c36a3e + de36112): evolution of the summer-menu format. First: PDF→images + tap-zoom lightbox (688a825), then react-zoom-pan-pinch gesture viewer (573a128). EK then reflected that an image+PDF menu isn't ideal for a website → **pivoted to native HTML** (agreed: mobile reflow, SEO, selectable, i18n). `src/data/summerMenu2026.ts` (full content from PDF v4) + `SummerMenu.tsx` (brand-styled: emblem, serif titles, seigaiha accent divider, dotted price leaders, veg badge, 2-col magazine flow → 1-col mobile). PDF kept as download. **Removed** the image viewer + react-zoom-pan-pinch dep + the 2 page JPGs. Section titles/subtitles localized FR/EN/DE; item descs FR fallback (like /menu). Verified at 500px = perfect; the 390px "clip" I saw was a **headless-Chrome min-window artifact**, not a real overflow (added overflow-x-clip + shrink-safe rows as belt-and-suspenders). EK's "swipe between images" request is moot (no images now). Live ✓.
- **Notre Histoire teaser photo** (commit 114b5d4): home `HistoireTeaser` grey SVG placeholder → real photo `public/histoire-teaser.jpg` (umai_005, cook at noodle station). Live ✓. (EK: "et c'est bon je crois" — content pass complete.)
- **Menu-preview cards + gallery de-watermarked** (commit 1b125e9 + Sanity, per EK): (1) home "Notre Menu" 3 category cards were grey — HOMEPAGE query now `defined(image)` so each shows a real photo (Entrées→gyoza umai_059, Ramen Paitan→Tantan umai_022, Ramen Chintan→clear ramen umai_026); also attached umai_059→"Gyoza porc"(item-e3480244), umai_026→"Tokyo Ramen"(item-e3480256). (2) **Gallery had 9 watermarked `Umaï_présélection_*` proofs** → replaced all with clean delivered `ig-studio/photos/umai_*` (009/002/059/012/066/017/076/035/026), titles+alt updated FR/EN/DE. Live: /galerie 0 "présélection", 3 menu cards render `<img>`. Used real photos (EK OK'd OpenAI-gen as fallback — not needed). NB: `ig-studio/photos/umai_*` = the CLEAN delivered set (verified visually); the watermarked set was a separate earlier upload.
- **Dedicated summer menu page** (commit 69589d9, per EK "montre que le menu été spécifique, pas le complet"): new `/carte-ete` route (SSG FR/EN/DE) showing ONLY the summer carte — a faithful web rendering of EK's **final summer PDF** `UMAI_MENU_ETE2026 v4` (2 designed pages → `public/carte-ete-2026-{1,2}.jpg`, visual preserved pixel-for-pixel) + PDF download (`public/carte-ete-umai-2026.pdf`) + link to full /menu. `SummerBanner` CTA now → /carte-ete. i18n `carteEte`+`meta.carteEte` FR/EN/DE; route added to sitemap. Live ✓ (200×3, images+pdf served). NB: summer PDF/images are FR-only (EN/DE = FR menu image, page chrome localized) — EN/DE summer PDFs = optional later. NB2: banner link renders unprefixed `/carte-ete` → 307 to localized (same pattern as other internal `Button`s, works). NB3: `git config http.postBuffer 524288000` was needed to push the binary assets (HTTP 400 RPC otherwise).
- **DEBT-01** (commit 8166a38): Footer contact block wired to `NAP` constants in `src/lib/seo.ts` (address/postal/phone/maps) — single source of truth, matches JSON-LD. Live shows +33 9 52 34 34 38 / 5 Rue des Orphelins / 67000 Strasbourg. ✓
- **DEBT-03**: measured real first-load JS on live `/fr` = **~228 KB compressed** (14 chunks). Above 150 KB target but ≈ Next 16/React 19 framework floor; Studio + ig-studio route-isolated, motion via LazyMotion. Documented; no risky pre-go-live cuts. → treat DEBT-03 done (documented).
- **DEBT-04** (catch-all audit blockers): all 08-audit go-live blockers already cleared (legal, EN/DE i18n, og-image, gallery empty-state, canonical strategy) → done.
- ⚠️ **FLAG for EK (1-line confirm):** broth simmer time — EK's brief said "bouillons 6h"; old site/USP said "12 heures". I aligned everything to **6h** (`uspBouillonsDesc` + Notre Histoire body, FR/EN/DE). Correct either way in 30s if wrong.
- Signature query uses exact `==` (not full-text `match`) for build determinism. Note: React renders price as `14,90<!-- --> €` (comment splits number/€) — grep `"NN,NN €"` will miss it; grep the number alone.

### ▶ HANDOFF: full resume instructions in `.planning/RESUME-PROMPT.md`

Pending after /clear: (1) Hero→popup, (2) EK's 3 content points (story text, Tantan signature highlight, summer-menu promo), (3) DEBT-01/03/04, (4) menu EN/DE translations + tags + photos (edit-later), (5) CUTOVER on "go cutover".

### Still needs EK (validation/refinement only — non-blocking)

- Confirm contact@umai-ramen.fr mailbox active.
- EN/DE menu translations (names+descriptions) — currently FR fallback.
- Veg/gluten-free tags per item (set heuristically).
- Optional: dish photos (most items have none), photo-based og-image, EK-SARL entity treatment.

## Go-live gap headlines (2026-07-09 audit)

🔴 Blockers: legal pages unfilled `[PLACEHOLDER]` (FR/EN/DE); EN/DE FR-leak strings (reservation subtitle, Infos FAQ; hero to confirm); `/og-image.jpg` 404; Galerie empty (0 Sanity images); post-cutover turfu.in→prod canonical.
🟠 Major: 4 menu items missing photos; Notre Histoire hero; confirm summer-menu/prices; wire bundle-analyzer.
✅ Good: cutover is mechanically trivial (old site = one-pager, baseUrl = 1 env var + rebuild, /ig-studio auth host-agnostic); build healthy; JSON-LD + NAP + hreflang solid.

## Performance Metrics

**v2.2 velocity:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 12-01 | 13min | 3 | 16 |

**v2.1 velocity:** Not yet measured.

**v2.0 (IG Content Studio):** built + deployed on umai.turfu.in/ig-studio; not formally archived.

**v1.0 history (archived):**

- Total plans completed: 11 across 3 phases
- Average duration: ~9 min/plan
- Total execution time: ~98 min
- Phase breakdown: 01-foundation 65min, 02-content-pages 43min, 03-seo-compliance ~30min

| Phase 12 P03 | 29min | 3 tasks | 4 files |
| Phase 13 P01 | 17min | 3 tasks | 15 files |

## Accumulated Context

### Key Decisions (v2.2)

- LOCKED by EK (2026-11-22): IT/ZH are menu-only (+ QR page), every other `/it/*` and `/zh/*` redirects to `/en/*`; simplified Chinese only; Claude translates (native review optional later); mobile web page, no per-language PDF.
- Source of truth for the menu = latest Exaprint print in `.planning/sources/menu-2026/` (food 2026-11-10, drinks 2026-11-03).
- Roadmap = 4 phases, 22/22 requirements mapped: 12 Sync (MENU-01..06) → 13 Foundations & tourist page (I18N-01..05, UI-01..04) → 14 Translations (TRANS-01..03) → 15 QR & print supports (QR-01..04).
- Phase 13 may overlap Phase 12's wait on EK validation, but both touch `src/components/menu/{MenuItem,MenuCategory}.tsx` and the menu page: land Phase 12's schema/component changes first.
- Price-variant model (MENU-02) keeps quantity/unit structured so units can be translated through message files (I18N-03).
- Phase 15's real-phone scan test and the Exaprint order wait for Phase 14's translated content to be live.
- MENU-05 is mapped to Phase 12 (French carry-over); its translations land via the Phase 13 labels (I18N-03) and the Phase 14 content (TRANS-01).
- Deploys stay manual until the webhook is repaired (see "Webhook de deploy CASSÉ" below).
- **AUTONOMY GRANT (EK, 2026-11-23): « Avance en autonome jusqu'à livraison déployé »** — Claude drives Phases 12→15 through production deploy without blocking on EK. EK gates are replaced by documented defaults + post-hoc review: (a) Année Lumière → « Prix sur demande » (translatable) until EK gives 12cl/25cl/50cl prices; (b) Trio dégustation description → BAT text « Trois sakés sélectionnés par notre équipe. »; (c) obvious typos fixed on web (« Asashi » → « Asahi »); (d) discrepancy report applied, kept in the phase folder and handed to EK; (e) full JSON export of Sanity menu documents BEFORE any production write (rollback); hide (available=false), never delete.
- Phase 13 site-chrome default (decided under the autonomy grant): on `/it/menu` and `/zh/menu`, header/footer/cookie banner/order modal use minimal IT/ZH strings where they exist in the message files, EN fallback otherwise (to be finalized in Phase 13 context).
- Phase 15 default: table tent = A6 (105×148 mm) flat card, recto/verso, PDF with 3 mm bleed (EK can switch to folded later).
- Phase 12-01 (display rules, in the import-free `src/lib/menu.ts`, 29 node:test cases): `priceOnRequest` wins over any stored price; 2+ priced variants render as a list under the description; exactly one renders as a single price with its quantity before the amount (« 33cl 5,90 € »); variants without a numeric price are ignored.
- Phase 12-01: categories without visible items are dropped from the menu page, the sticky nav and the JSON-LD alike, all sharing the `groupBySection` order (Plats, Boissons, unsectioned). The home « Notre Menu » cards = first 3 categories by `order` with visible items (no photo = accent block with the category JP label); the signature price = visible « Tantan Ramen » only; formules hide with `available != false`.
- Phase 12-01: REQUIREMENTS.md MENU-01/02/03/05/06 are left Pending on purpose after 12-01 (capability delivered and render-tested, but the requirements describe the live menu): tick them after 12-03 proves the live outcome.
- Phase 12-03: publishing menu content = `sync-menu.mjs --apply`, then `node --env-file=.env.local scripts/menu-2026/revalidate.mjs` (signed revalidateTag for menuCategory/menuItem/menuExtra/menuFormule). Tagged Sanity fetches never expire on their own and no Sanity webhook reaches umai-ramen.fr today (waiting 4 min changed nothing). Phase 14 publishes the same way.
- Phase 12-03: live gate = `scripts/menu-2026/verify-live.mjs` (`--expect legacy` before a content write, `m26` after it; `--home` checks the 3 Sanity card photos + the Tantan price). Rollback points: VPS code `2523057`; Sanity `backup/menu-backup-20261123-201142.json` (`--rollback --dry-run` → restore=174 delete=97). MENU-01..06 ticked after the live proof.
- Phase 13-01: IT/ZH are menu-only in the proxy. Every non-menu `/it/*` and `/zh/*` answers 307 (not 308: reversible) to the same path under `/en`, query kept. next-intl's detection redirect (Accept-Language or `NEXT_LOCALE` = it/zh) is retargeted to `/en` by rewriting its Location, and the decision is taken on decoded path segments (`/z%68/infos` is `/zh/infos` for next-intl). `/menu` with those hints still goes to `/zh/menu` / `/it/menu`.
- Phase 13-01: `src/i18n/locales.ts` (import-free, erasable TS, 19 node:test cases) is the single source of truth: `LOCALES`, `FULL_SITE_LOCALES`, `MENU_ONLY_LOCALES`, `localesForPath`, `siteLocaleFor`, `htmlLang` (zh to zh-Hans), `ogLocale`, `menuOnlyRedirectPath`, `mergeMessages`. Later plans import from it, never a local list.
- Phase 13-01: IT/ZH message files hold only what they translate (common, nav, menu, consent, orderModal, footer, meta.menu); `request.ts` deep-merges `en.json` underneath, so a missing key falls back to English, never to a raw key. FR/EN/DE loading is unchanged. `scripts/i18n/check-messages.mjs` is the 5-locale contract (parity, ICU, no em-dash, golden units, FR-leak guard); `menu.eazeeLinkCta` is a documented dead key until 13-02 removes the CTA.
- Phase 13-01: layout `generateStaticParams` = fr/en/de (non-menu it/zh pages are not prerendered); `/it/menu` and `/zh/menu` render on demand until 13-02 adds them to the menu page's own static params. `alternateLinks` is off in routing: hreflang comes only from `buildAlternates` (IT/ZH for `/menu` only, x-default `/fr`), sitemap = 38 URLs. `scripts/i18n/verify-routing.mjs --base <url>` proves it on any host (local `ROUTING OK checks=84`; the live site still fails 33 checks until the 13-03 deploy).
- Phase 13-01: UI-04 headroom: Noto Sans JP weight 300 and DM Serif italic dropped (nothing renders them). Noto CSS chunk 188 KB / 249 `@font-face` to 94 KB / 125, font preloads 3 to 2, no visual change; `verify-live.mjs` still `VERIFY OK` on fr/en/de.

### Key Decisions (v2.1)

- Phases 09 and 10 are unblocked in parallel once Phase 08 produces the gap list (content audit → 09, blocking bugs → 10)
- Phase 11 is the go-live gate — requires 08 (cutover dossier), 09 (content complete), 10 (blocking debt cleared)
- Short maintenance window acceptable; rollback = revert DNS (apex A + www) to GitHub Pages IPs `185.199.10x.153`
- Sanity dataset: `c7twe801/production` — all content changes go directly to production dataset
- GitHub: `umairamenchef/umai-ramen-site`, branch `v2-2026`
- Target: week of 2026-07-11

### Key Decisions (v2.0)

- CLI first, web UI second — locked by owner (EK)
- Pilot ~10 photos before full 81-photo run — mandatory gate
- `claude-opus-4-8` for vision classification (quality), `claude-sonnet-4-6` for captions (cost)
- puppeteer-core + local Chrome render (no cloud render); sips for macOS resize
- Output tree: `ig-studio/out/{photo-id}/` — 3 PNGs + caption.txt
- Photo source: Google Drive `JPEG_72dpi` folder id `19JmEURV-XqcMm97jZwU7AV9uG7y6-t7M`
- Menu ground truth: Sanity project `c7twe801`, dataset `production`
- Brand tokens: ivoire `#F5F0E8`, vert `#77967A`; logo from `umai_logo_menu.svg` / `public/logo.svg`

### Key Decisions (v1.0 — carried)

Stack locked: Next.js 16.1.6, React 19.2, Sanity v5, next-intl v4.8.3, motion v12, Tailwind CSS 4.
Deployment: Docker standalone on VPS srv1417179 (valid 2027-02-23), multi-site Caddy, umai.turfu.in.

### Tech Debt (v1.0 — addressed in Phase 10)

- SEO-07: Footer NAP not wired to `seo.ts` constants → DEBT-01
- PERF-05: First-load JS ~220KB > 150KB target (irreducible framework floor) → DEBT-03
- bundle-analyzer: `@next/bundle-analyzer` not wired into `next.config.ts` → DEBT-02

### Pending Todos (owner-side)

- v2.2 (EK): validate the Phase 12 discrepancy report; supply the Année Lumière 12/25/50cl prices and the Trio dégustation description; confirm typos (« Asashi »); pick the table-tent format (A6 vs folded card) before Phase 15; optional native review of the Phase 14 sheet; optional: create a Sanity webhook to https://umai-ramen.fr/api/revalidate so Studio menu edits reach the site without running revalidate.mjs
- Photo assets from EK: progressively from 2026-07-09 (hero + gallery, from JPEG_72dpi Google Drive)
- Summer menu ground truth from Loan Nguyen — verify dishes/prices/tags against in-restaurant reality
- Notre Histoire text validation with Loan Nguyen
- EN/DE Sanity content translations
- DNS cutover decision: TTL lowering timing, maintenance window announcement

### ⚠️ Webhook de deploy CASSÉ — constaté 2026-09-02

`dig umai.turfu.in` ne résout plus (enregistrement DNS disparu). GitHub ne peut donc
plus joindre `https://umai.turfu.in/webhook/*` → **`git push origin v2-2026` ne déploie
plus rien**. Dernier deploy automatique réussi : 2026-07-16T16:37Z. Le VPS était resté
2 commits en arrière (25468c7) jusqu'au 2026-09-02.

**Deploy manuel en attendant** :

```
ssh umai-app 'cd /home/ek/apps/umai && git fetch origin v2-2026 && git reset --hard origin/v2-2026 && docker compose -p umai up -d --build web'
```

**À faire (EK)** : soit recréer le A record `umai.turfu.in → 76.13.61.239`, soit déplacer
le webhook sur `umai-ramen.fr` (ajouter un bloc `handle /webhook/*` → `deployer:9000`
dans le Caddyfile du VPS + changer l'URL du webhook côté GitHub, scope `admin:repo_hook`
requis). La 2e option est la bonne à terme : turfu.in n'est plus le domaine de prod.

**Build flake (constaté 2026-11-23, local + VPS)** : `next build` (Turbopack) échoue parfois avec `next/font/google queries have exactly one entry` quand Google Fonts sert Outfit en URLs `/l/font?kit=…&skey=…`. Relancer la même commande de deploy suffit ; `up -d --build` construit avant de remplacer le conteneur, donc l'ancien continue de servir. Correctif durable possible : passer les 3 polices en `next/font/local`.

**Contenu Sanity → site** : aucun webhook Sanity n'atteint umai-ramen.fr. Après une écriture du menu (sync ou Studio), lancer `node --env-file=.env.local scripts/menu-2026/revalidate.mjs`. Une autre option est de créer un webhook GROQ vers `https://umai-ramen.fr/api/revalidate` (secret = `SANITY_WEBHOOK_SECRET` du VPS, droits admin du projet nécessaires).

### Blockers/Concerns

- v2.2 / Phase 12: APPLIED and live-verified 2026-11-23 (12-03) with the autonomy-grant defaults (see Key Decisions v2.2); EK post-hoc review of `12-DISCREPANCY-REPORT.md` + Année Lumière prices still wanted.
- RESOLVED (13-01): language of the site chrome on `/it/menu` and `/zh/menu`: minimal IT/ZH strings where `it.json` / `zh.json` define them (nav, common, consent, order modal, footer, menu labels), English for everything else through the EN deep merge in `request.ts`. Plan 13-02 wires the header, footer and cookie banner links.
- Tooling: the v2.0 and v2.1 sections of ROADMAP.md are not collapsed in `<details>`, so `gsd-tools roadmap analyze` counts phases 4–15 as the current milestone (`next_phase` resolves to 06, `phase_count` 12). Explicit `/gsd:*-phase 12` commands are unaffected; run `/gsd:complete-milestone` for v2.0/v2.1 to clean this up.
- RESOLVED: Google Drive auth — photos are already local (no Drive fetch needed for ig-studio)
- PENDING: umai_037.jpg classified as ambiance — appears to be an udon dish (not on summer ramen menu). Owner should review during pilot sign-off.
- PENDING: Pilot sign-off — owner must review contact-sheet.html and run `npm run signoff` to unblock --all

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260902-lmz | Supprimer le Click & Collect Flipdish du site | 2026-09-02 | b7c2c10 | [260902-lmz-supprimer-le-click-collect-flipdish-du-s](./quick/260902-lmz-supprimer-le-click-collect-flipdish-du-s/) |

## Session Continuity

Last session: 2026-11-23T21:28:45.517Z
Stopped at: Completed 13-01-PLAN.md
Resume: Phase 12 complete and live. Phase 13 plan 13-01 done (locale rules module, IT/ZH menu-only routing + messages, hreflang/sitemap, routing + message verifiers; local only, nothing deployed). Next: 13-02 (tourist menu page: pill switcher, bilingual rows, zh font stack, Studio it/zh fields, chrome strings), then 13-03 (deploy + live proof, ticks I18N/UI requirements).

### Key Decisions Added (v2.0 execution)

- LOCKED: Photos already local (ig-studio/photos/umai_001..081.jpg) — no Drive/OAuth needed (INGEST-01 satisfied)
- LOCKED: Summer menu KB (data/summer-menu-2026.json) is classification ground truth
- LOCKED: Pilot uses even-spread indices (not first-N) to sample full photo range
- LOCKED: classifier.js safe fallback: parse errors → ambiance (0.0 conf), batch never crashes
- LOCKED: KB slugs use hardcoded name→slug map for stability (no fragile accent-strip for variant names)
