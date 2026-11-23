---
phase: 12-synchronisation-menu-print-2026-sanity
verified: 2026-11-23T20:35:26Z
status: passed
score: 24/24 must-haves verified (5 ROADMAP success criteria + 19 PLAN truths)
---

# Phase 12: Synchronisation menu print 2026 → Sanity — Verification Report

**Phase Goal:** The live FR menu is a faithful, EK-validated mirror of the 2026 printed menu — every dish, drink, dessert, kids menu and extra with the exact names, descriptions, prices and order — and no placeholder or typo from the print reaches production. (Under EK's 2026-11-23 autonomy grant « Avance en autonome jusqu'à livraison déployé », "EK-validated" = discrepancy report applied with documented defaults + post-hoc EK review: ROADMAP Phase 12 success criteria 3 and 5, STATE Key Decisions v2.2.)
**Verified:** 2026-11-23T20:35:26Z
**Status:** passed
**Re-verification:** No — initial verification

## How this was verified (independence)

SUMMARY claims were not trusted. Evidence comes from five independent sources:

1. **The print itself.** Both PDFs were rendered to PNG (mutool, 150 and 600 dpi) and read visually. The verifier made its own hand transcription (8 food categories / 30 items + 12 drink categories / 47 items = **20 categories / 77 items**, 87 price tokens), not derived from `menu-2026.json`.
2. **The live site** `https://umai-ramen.fr` (read-only GETs only): `/fr|en|de/menu`, `/fr|en|de` homes and 7 other routes (13 routes checked in total), raw HTML, JSON-LD, plus 375 px mobile screenshots through headless Chrome with **JavaScript disabled** (so only GETs of HTML/CSS/images, no beacons or POSTs).
3. **Sanity production**, public read-only GROQ (no token, no write): documents compared field by field with `menu-2026.json`.
4. **The code** in the repo (HEAD `fbb724b` = `origin/v2-2026`; no change under `src/`, `scripts/`, `package*.json`, `next.config.ts` since the deployed commit `34748ef`).
5. **The permitted helpers**: `validate-menu.mjs --crosscheck`, `verify-live.mjs`, `node --test`.

Deliberately NOT run (per instructions): `sync-menu.mjs` in any mode (even `--dry-run` rewrites `12-DISCREPANCY-REPORT.md`), `--apply`, `--rollback`, `revalidate.mjs`, deploy, any Sanity write.

## Goal Achievement

### Observable Truths — ROADMAP success criteria (the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/fr/menu` shows every dish, drink, dessert, kids menu and extra of the 2026 print with the same FR names, descriptions, prices and category order, and nothing that is not on the print; dropped items hidden (availability off) but still in Studio | ✓ VERIFIED | **Live vs my own print transcription**, own checker (cursor walk for order + per-item price block): FR, EN and DE each → `items checked=77 expected price tokens=87 page price tokens=87`, `INDEPENDENT CHECK OK` (names exact and case-sensitive, order, every price bound to its own item, no extra price). **Fidelity of text:** 201 JSON strings checked case-sensitively against the PDF text layers; the only 27 that differ are the documented normalisations (ALL-CAPS print headings stored in normal case, Asahi/4,5°/15,5° fixes, Trio BAT text, merged Gyozas description, footnote typography) — all in the report's corrections table. **Sanity:** 97 `m26-` docs (20 categories + 77 items, all `available:true`) equal `menu-2026.json` field by field (name, description, nameJp, subgroup, badges, price(s), order, category ref, section, footnote); 0 stray m26 docs. **Dropped items:** 167 legacy `menuItem` + 5 `menuExtra` + 2 `menuFormule` all hidden (0 still available, 0 formule visible), all 174 still present; 26 legacy categories untouched; 0 drafts. 165 legacy-only names checked: 0 appear on the live page in FR, EN or DE. |
| 2 | Multi-price items show every variant, correctly labelled (3/6/9 pcs, 25cl/50cl, …) | ✓ VERIFIED | Live FR: Karaage, Gyozas, Takoyaki « 3 pcs … · 6 pcs … · 9 pcs … » (DE shows « 3 Stk. »); Asahi / Yuzu / Saké « 25cl … · 50cl … »; Riesling and Chardonnay « 12cl 5,50 € · 75cl 24,00 € »; Chashu « 2 pcs 3,90 € » / « 3 pcs 3,50 € »; Trio « 3 × 6cl 18,00 € »; lone-variant drinks « 33cl 5,90 € », « 30cl 7,50 € ». JSON-LD: 87 Offers, one per variant, named « 3 pcs », « 25cl », …. 375 px screenshots: variants on one line, `scrollWidth == clientWidth == 375` (no horizontal overflow). « 1/2 boules » is not on the print: `scoop` unit exists in schema enum, `menu.unit.scoop` plural keys in fr/en/de and unit tests, unused — not a gap (ROADMAP note). |
| 3 | Discrepancy report produced and kept in the phase folder; full export of the Sanity menu documents taken before any production write; applied with documented defaults and handed to EK for post-hoc review | ✓ VERIFIED | `12-DISCREPANCY-REPORT.md` (651 lines, status APPLIQUÉ): Résumé, **Ajoutés** (23), **Prix modifiés**, **Textes modifiés**, **Masqués** (174 rows = exactly the 174 legacy ids of the backup; 68 « remplacé par » + 106 « retiré »), Photos, Corrections (13), **À confirmer par EK** (15 points + 7 slug notes), Rollback, Vérification en ligne. Backups: 2 files, each 200 docs (167 item / 26 category / 5 extra / 2 formule), 0 `m26-`, 0 drafts, all 167 items `available:true` at export, no secret inside. The `--apply` one is `exportedAt 2026-11-23T20:11:42.646Z`; the m26 docs carry `_createdAt 20:11:42Z`; code commit `34748ef` is 20:04:46Z and the report records `LIVE GUARD: ok` (code-enforced precondition). `runApply` order verified in code: live guard → fetch → `writeBackup` → one transaction of `createOrReplace` + `patch` only (`.delete(` exists only in `runRollback`) → post-apply checks. Hand-off: `12-03-SUMMARY` « Remise à EK (FR) », STATE.md EK to-dos. |
| 4 | Print service notes and markers appear on the live menu in French and are stored so they can be translated | ✓ VERIFIED | Live FR: « Le midi seulement » (Udon), « Pour les enfants de moins de 10 ans. » + footnote « Inclus : un sirop à l'eau et une boule de glace au choix. », « Notre best-seller » pill on Tantan Ramen only, « Complétez votre bol avec nos extras. », « Prix service compris » + page notes at the bottom. Storage: category `description` / `footnote` are `localeText` (fr/en/de); badges are enum values rendered through `menu.badge.*`, units through `menu.unit.*`, « Prix sur demande » through `menu.priceOnRequest` — keys present in fr, en and de (Phase 13 adds it/zh). « Version végétarienne disponible »: not on the print; `vegetarianOption` enum + messages exist, no item carries it (ROADMAP note). |
| 5 | No `??`/`????` visible anywhere; Année Lumière « Prix sur demande »; Trio uses the BAT description; « Asashi » → « Asahi »; all listed for EK | ✓ VERIFIED | Raw HTML (including attributes, JSON-LD and RSC payload) of `/fr|en|de/menu` and `/fr|en|de`: **0** `??`, **0** `Asashi`; 0 raw `menu.*` keys, 0 `{count}` ICU leftovers, 0 `undefined/NaN/null`. Année Lumière: « Prix sur demande » / « Price on request » / « Preis auf Anfrage », no number, no JSON-LD Offer, doc has `priceOnRequest:true` and no price. Trio: « Trois sakés sélectionnés par notre équipe. », label « 3 × 6cl », 18,00 €. « Asahi Super Dry ~ 5° » live. All three listed in the report (corrections table + « À confirmer par EK » #1–#3). |

### Observable Truths — PLAN must_haves

| Plan | # | Truth (short) | Status | Evidence |
|------|---|---------------|--------|----------|
| 12-01 | 1 | Studio editors can set variants, prix sur demande, badges, subgroup; category JP label/section/footnote; formule availability | ✓ | `sanity schema extract --enforce-required-fields` (output to scratchpad) lists `prices`, `priceOnRequest`, `badges`, `subgroup`, `menuCategory.nameJp/section/footnote`, `menuFormule.available`, `priceVariant`; `menuItem.price` optional |
| 12-01 | 2 | Item valid with price OR variants OR prix sur demande, invalid with none | ✓ | Custom rule in `menuItem.ts` lines 54–64 (code inspection; not executable here without Studio) |
| 12-01 | 3 | Page renders variants, prix sur demande, badge pills, subgroup headings, JP labels, descriptions, footnotes, Plats/Boissons grouping, bottom page notes | ✓ | Live HTML + 375 px screenshots (variants, V/SG and best-seller pills, « Au choix » / « Whiskies » / « Vins rouges » headings, footnote, 料理/ドリンク section headers, notes) |
| 12-01 | 4 | With legacy data the old menu still rendered (backward compatible) | ✓ | Not re-observable after the sync. Code paths unit-tested (29/29: plain `price`, unsectioned bucket, no-variants); the apply run's `LIVE GUARD: ok` and the report's « Vérification en ligne » corroborate the legacy-then-new deploy order |
| 12-01 | 5 | Hidden formules not rendered; home cards only from categories with visible items; signature price from visible Tantan Ramen | ✓ | Live: no formules block; home cards = Entrées / Tantan Umaï / Ramen with 3 cdn.sanity.io photos; signature « Voir la carte 15,90 € »; exactly 1 visible « Tantan Ramen » (`m26-item-tantan-ramen`, price 15.9) |
| 12-01 | 6 | JSON-LD lists only visible categories, one Offer per variant, none for prix sur demande | ✓ | Live JSON-LD (FR/EN/DE): 20 sections, 77 items, 87 Offers, only « Année Lumière millésime 2023 » without Offer; 0 `??` in it |
| 12-02 | 1 | JSON holds 20 categories / 77 items in print order, verbatim FR, structured variants, JP labels, descriptions, footnote, subgroups, badges | ✓ | My independent transcription matches it; Sanity == JSON |
| 12-02 | 2 | No `??` / Asashi / dotted degree under `categories`, none of `??` in whole file; Année Lumière priceOnRequest; Trio label + BAT text | ✓ | Whole file: 0 `??`; `categories`: 0 `??`, 0 `Asashi`, 0 `d.d°`; « Asashi » appears once, only in `corrections` |
| 12-02 | 3 | Distinct prices in JSON == print text layers (34) | ✓ | `CROSSCHECK OK distinct=34` |
| 12-02 | 4 | Every name/description/JP/subgroup/footnote found in the text layers except 5 allowlisted corrections | ✓ | `TEXT CROSSCHECK OK checks=201 allowlisted=5`; stricter case-sensitive re-check by the verifier → only the documented normalisations differ |
| 12-02 | 5 | `--dry-run` validates, reads read-only, prints plan, writes the report, no Sanity write | ✓ | `runDryRun` contains no `commit` / `createOrReplace` / `patch` / `delete`; only local `writeFileSync` (report, optional `--dump`). Not executed (it rewrites the report) |
| 12-02 | 6 | `--backup-only`, `--apply` (guard, backup first, single transaction, post-checks), `--rollback` (restore flags from backup, delete m26) | ✓ | Code read in full: `runBackupOnly`, `runApply`, `runRollback` (project/dataset guard, restore of `available`, items-then-categories deletion, external-reference guard, `-pre-rollback` safety backup). The `--rollback --dry-run` proof is historical (SUMMARY: `restore=174 delete=97`); not re-run per instructions |
| 12-02 | 7 | The 3 home-card photos are carried over at run time and never overwritten | ✓ | Sanity: `m26-item-gyozas` / `-tantan-ramen` / `-tokyo-ramen` carry the same asset refs as `item-e3480244` / `-e3480254` / `-e3480256`, which keep theirs (copy, not move); only these 3 m26 docs have an image |
| 12-03 | 1 | Phase 12 code live (VPS HEAD = local HEAD); legacy verified before any content write | ✓ | Live behaviour is the Phase 12 code; no code diff between `34748ef` and HEAD; the apply refuses to run unless live `/fr/menu` contains « Prix service compris » and the report records `LIVE GUARD: ok`. The pre-write legacy gate itself is a process claim (SUMMARY/report), corroborated by commit/backup/write timeline |
| 12-03 | 2 | Full export of every menuItem/menuCategory/menuExtra/menuFormule written to `backup/` immediately before the write | ✓ | See SC 3 (200 docs, 0 m26, exportedAt 20:11:42.646Z vs write 20:11:42Z) |
| 12-03 | 3 | `/fr/menu` shows every category/item in print order, prices bound, Prix sur demande, best-seller, notes, no `??`/Asashi | ✓ | See SC 1, 2, 4, 5 |
| 12-03 | 4 | Legacy dishes / Extras grid / formules gone from menu and home, legacy docs still exist with `available=false` | ✓ | Sanity counts above; 0 legacy name on live page; no ExtrasGrid / formules markup |
| 12-03 | 5 | `/en/menu` and `/de/menu` render the new menu (FR fallback) with localized UI labels; home shows new first categories and 15,90 € | ✓ | « Food » / « Drinks » / « Our best-seller » / « Price on request » (EN), « Speisen » / « Getränke » / « Unser Bestseller » / « Preis auf Anfrage » / « 3 Stk. » (DE); EN/DE homes verified by `verify-live --home` |
| 12-03 | 6 | Home cards keep 3 cdn.sanity.io photos; `/fr/menu` renders no Sanity image | ✓ | Home: the 3 migrated asset ids are in the HTML; `/fr/menu` HTML: 0 `cdn.sanity.io` |
| 12-03 | 7 | Report marked applied, records live verification, documents rollback, handed to EK | ✓ | Report lines 3, 608–651; `12-03-SUMMARY` « Remise à EK » |

**Score:** 24/24 truths verified (5 + 19)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/schemaTypes/priceVariant.ts` | object type `{quantity, unit, label, price}` | ✓ VERIFIED | 51 lines, real validation (`required().positive()`), registered in `schemaTypes/index.ts` |
| `src/sanity/schemaTypes/menuItem.ts` | optional price + `prices[]` + `priceOnRequest` + `badges` + `subgroup`, custom validation | ✓ VERIFIED | 177 lines |
| `src/sanity/schemaTypes/menuCategory.ts` | `nameJp` + `section` + `footnote` | ✓ VERIFIED | 74 lines |
| `src/sanity/schemaTypes/menuFormule.ts` | `available` | ✓ VERIFIED | 37 lines, « ⛔ Masqué » preview |
| `src/lib/menu.ts` | types + 8 pure helpers | ✓ VERIFIED | 197 lines, all 8 exports present, zero runtime imports |
| `src/lib/menu.test.mjs` | node:test suite | ✓ VERIFIED | 280 lines, 29/29 pass |
| `src/sanity/lib/queries.ts` | projections for new fields, filtered formules, hardened home query | ✓ VERIFIED | `prices[]{…}`, `available != false` on formules, visible-Tantan signature |
| `src/components/menu/MenuItem.tsx` | variants / prix sur demande / badges | ✓ VERIFIED | 95 lines, uses `getPriceDisplay`, `useTranslations('menu')` |
| `src/components/menu/MenuCategory.tsx` | JP label, subgroup headings, footnote | ✓ VERIFIED | 51 lines, `withSubgroupHeadings` |
| `src/app/(site)/[locale]/menu/page.tsx` | sections, notes, JSON-LD per variant | ✓ VERIFIED | 210 lines, `groupBySection`, `buildOffers` |
| `scripts/menu-2026/menu-2026.json` | print transcription | ✓ VERIFIED | 825 lines, 20/77, `trio-degustation` present |
| `scripts/menu-2026/menu-schema.mjs` | `validateMenu`, `allPrices`, `LOCALES`, `EXPECTED_CATEGORY_KEYS` | ✓ VERIFIED | 386 lines, 4 exports |
| `scripts/menu-2026/validate-menu.mjs` | CLI `--crosscheck` + `TEXT_ALLOWLIST` | ✓ VERIFIED | 165 lines; run: OK |
| `scripts/menu-2026/sync-menu.mjs` | `--dry-run/--backup-only/--apply/--rollback` | ✓ VERIFIED | 744 lines; real logic (read, not executed) |
| `scripts/menu-2026/verify-live.mjs` | live/HTML verifier with `--expect` | ✓ VERIFIED | 499 lines; run on live: OK |
| `scripts/menu-2026/revalidate.mjs` | signed POST per Sanity type | ✓ VERIFIED | 136 lines; HMAC-SHA256 `t=…,v1=…` like `@sanity/webhook`, secret never printed (read, not executed) |
| `12-DISCREPANCY-REPORT.md` | report with `## À confirmer par EK`, `APPLIQUÉ` | ✓ VERIFIED | both strings present |
| `backup/menu-backup-20261123-194217.json`, `…-201142.json` | pre-write exports | ✓ VERIFIED | 200 docs each, valid JSON |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `MenuItem.tsx` | `src/lib/menu.ts` | `from '@/lib/menu'` | ✓ WIRED | imports `getPriceDisplay`, `formatEuro`, `variantQuantityText` and uses them |
| `MenuItem.tsx` | `messages/*.json` `menu.unit/badge/priceOnRequest` | `useTranslations('menu')` | ✓ WIRED | no raw key on any locale |
| `menu/page.tsx` | `buildOffers` | JSON-LD | ✓ WIRED | live JSON-LD shows per-variant Offers |
| `queries.ts` | menuItem schema fields | GROQ projection `prices[]{ _key, quantity, unit, label, price }` | ✓ WIRED | live data renders variants |
| `queries.ts` HOMEPAGE_QUERY | visible Tantan Ramen | `name.fr == "Tantan Ramen" && available == true` | ✓ WIRED | home shows 15,90 € |
| `sync-menu.mjs` | `menu-2026.json` | `validateMenu(` before any read/write | ✓ WIRED | |
| `sync-menu.mjs` | Sanity `c7twe801/production` | transaction (`createOrReplace` + `available: false`) | ✓ WIRED | production state matches the plan exactly |
| `sync-menu.mjs` | `backup/` | `menu-backup-` JSON before apply/rollback | ✓ WIRED | 2 files present |
| `sync-menu.mjs` | legacy docs via `imageFrom` | run-time lookup, copy only if none | ✓ WIRED | 3 photos copied |
| `revalidate.mjs` | `/api/revalidate` → `revalidateTag(_type)` | HMAC-SHA256 header | ✓ WIRED | route reads `parseBody` + `revalidateTag(body._type, { expire: 0 })` |
| `verify-live.mjs` | `menu-2026.json` + messages | expected names/prices/notes | ✓ WIRED | |
| `sync-menu.mjs --apply` | production | single transaction after backup + guard | ✓ WIRED | report: `transaction PS4gSiVcUV6cnzSF8ooJME` |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|----------|---------------|--------|--------------------|--------|
| `menu/page.tsx` → `MenuCategory` → `MenuItem` | `categories[].items[]` | `MENU_CATEGORIES_QUERY` on Sanity production (77 m26 items, 20 categories) | Yes — 309 `verify-live` checks per locale + independent 77/87 check | ✓ FLOWING |
| `menu/page.tsx` JSON-LD | `offers` | `buildOffers(item)` from the same items | Yes — 87 Offers on the live page | ✓ FLOWING |
| `MenuItem` labels | `badge.*`, `unit.*`, `priceOnRequest` | `src/messages/{fr,en,de}.json` | Yes — rendered strings, no raw keys | ✓ FLOWING |
| `MenuPreview` (home) | `menuCategories[].image`, `signature.price` | `HOMEPAGE_QUERY` | Yes — 3 Sanity CDN photos, 15,90 € | ✓ FLOWING |
| Sanity m26 docs | all fields | `menu-2026.json` via `sync-menu.mjs` | Yes — field-by-field equality | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Transcription is valid and matches the PDF text layers | `node scripts/menu-2026/validate-menu.mjs --crosscheck` | `MENU JSON OK categories=20 items=77 variants=32 distinctPrices=34` / `CROSSCHECK OK distinct=34` / `TEXT CROSSCHECK OK checks=201 allowlisted=5` | ✓ PASS |
| Display helpers | `node --test src/lib/menu.test.mjs` | 29 tests, 0 fail | ✓ PASS |
| Live menu FR/EN/DE vs transcription | `verify-live.mjs --locale {fr,en,de} --expect m26` | `VERIFY OK … checks=309` ×3 | ✓ PASS |
| Live homes | `verify-live.mjs --locale {fr,en,de} --expect m26 --home` | `VERIFY OK … home checks=8 / 10 / 10` | ✓ PASS |
| Live menu vs verifier's own print transcription | own checker, 3 locales | `items checked=77 … price tokens=87`, `INDEPENDENT CHECK OK` ×3 | ✓ PASS |
| Sanity production vs JSON | own comparer on public read | `SANITY m26 == JSON: OK` (20 cat, 77 items, 97 docs) | ✓ PASS |
| Production hide-not-delete | public GROQ counts | 244 menuItem (167 + 77), 46 menuCategory (26 + 20), 5 menuExtra, 2 menuFormule; legacy still available: 0; formules visible: 0; drafts: 0 | ✓ PASS |
| Type safety | `npx tsc --noEmit --incremental false` | exit 0 | ✓ PASS |
| Schema compiles with new fields | `sanity schema extract --enforce-required-fields` | OK, fields present | ✓ PASS |
| 375 px layout | headless Chrome screenshots (JS off), 12 segments, 15 690 px page | no overflow; variants, pills, subgroups, Trio, Prix sur demande, footnote, notes all legible | ✓ PASS |
| Print icon reading (Edamame) | 600 dpi crop | filled leaf = vegetarian, crossed wheat ear = gluten-free → V + SG is faithful | ✓ PASS |
| No regression elsewhere | GET `/fr /en /de` menu+home, `/fr/commander`, `/fr/notre-histoire`, `/fr/infos`, `/fr/galerie`, `/studio`, `/sitemap.xml`, `/robots.txt` | all HTTP 200 | ✓ PASS |
| No secret in tracked files | `.env.local` values grepped in tracked files (values not printed) | SANITY_TOKEN, SANITY_WEBHOOK_SECRET, DEPLOY_WEBHOOK_SECRET, IG_STUDIO_PASSWORD absent; only the public `NEXT_PUBLIC_BASE_URL` matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| MENU-01 | 12-01, 12-02, 12-03 | Every dish/drink/dessert/kids/extra of the 2026 print exists in Sanity with exact FR name, description, price(s), category, printed order | ✓ SATISFIED | Sanity `m26-` docs == JSON == print (77 items, order values 10…n per category, categories 10…200); live page identical |
| MENU-02 | 12-01, 12-02, 12-03 | Multi-price items display every variant correctly | ✓ SATISFIED | SC 2; `scoop` (« 1/2 boules ») supported, unused — not on the print |
| MENU-03 | 12-01, 12-02, 12-03 | Items no longer on the print hidden (availability off), not deleted | ✓ SATISFIED | 174 legacy docs `available:false`, 174 present, 0 deleted |
| MENU-04 | 12-02, 12-03 | EK validates the discrepancy report before publishing (autonomy grant: applied with documented defaults, EK review post-hoc) | ✓ SATISFIED under the grant | Report complete and applied with listed defaults; EK's actual review is outstanding by design (see follow-ups) |
| MENU-05 | 12-01, 12-02, 12-03 | Service notes and markers carried over and translatable | ✓ SATISFIED | SC 4; « Version végétarienne disponible » supported, unused — not on the print |
| MENU-06 | 12-01, 12-02, 12-03 | Placeholders resolved, no `??` on the web, typos corrected | ✓ SATISFIED | SC 5 |

**Cross-reference:** PLAN frontmatter declares 12-01 → MENU-01/02/03/05/06; 12-02 and 12-03 → MENU-01..06. The union covers all six IDs, each defined in `REQUIREMENTS.md` (lines 19–24; traceability rows 80–85, `[x]` / « Complete »). **Orphaned requirements: none** (no other ID maps to Phase 12).

### Anti-Patterns Found

No TODO / FIXME / placeholder / « coming soon » markers, no empty implementations, no console-only handlers in any Phase 12 file. No blocker and no warning. Informational notes only:

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/messages/{fr,en,de}.json` | 215 | `meta.menu.description` still says « extras et formules » / « set menus » / « Menüs »; the 2026 menu has no formules | ℹ️ Info | SEO snippet only, outside MENU-01..06; fix when meta copy is revisited (Phase 13/14) |
| `src/components/menu/DietaryBadge.tsx` | 11, 18 | badges hard-coded « V » / « SG » for every locale (EN reader sees « SG ») | ℹ️ Info | Pre-existing; Phase 13 UI-label work |
| `src/app/(site)/[locale]/menu/page.tsx` | 204 | « Consulter la carte complète » CTA to the eazee-link digital menu (outdated prices) still at the bottom | ℹ️ Info | Deliberately left for Phase 13 (12-CONTEXT « Deferred ») |
| `src/sanity/lib/client.ts` | 25 | `revalidate: tags.length ? false : revalidate`: tagged Sanity data never expires on its own; no Sanity webhook targets umai-ramen.fr | ℹ️ Info | A Studio edit (e.g. Année Lumière prices) stays invisible until `revalidate.mjs` is run, a webhook is created, or the container restarts. Known and documented (12-03-SUMMARY « Deferred Issues », STATE) |
| `scripts/menu-2026/sync-menu.mjs` | 314, 567 | `DRIFT` lines are printed but do not abort: a re-run `--apply` overwrites Studio text/price edits on existing `m26-` docs (photos are kept) | ℹ️ Info | Phase 14 re-run: fold any EK Studio edits into `menu-2026.json` first. The hand-written « Vérification en ligne » section of the report is also erased by any re-run (documented in the report) |

### Human Verification (post-hoc, non-blocking)

Status is `passed` and not `human_needed` because every phase truth was verified programmatically or from screenshots, and the autonomy grant defines EK's review as post-hoc, not as a gate. These follow-ups are already tracked in STATE.md; they are listed so none is lost.

#### 1. EK post-hoc review of `12-DISCREPANCY-REPORT.md`

**Test:** read « À confirmer par EK » (15 points + 7 slug notes) and the corrections table.
**Expected:** EK accepts or amends the defaults. Worth a look beyond the list: The Chita 9,00 € (legacy 14,60 €, −5,60 €) and Chardonnay 75cl 24,00 € (legacy 33,80 €) are the largest drops; both are the printed values (confirmed visually), but the old eazee prices were far higher; the « V » marker on Yasai Ramen / Miso végétarien (carried over from the legacy flags, no icon on the print; report point 7); the Menu enfant 9,90 € shown on both choices (point 10).
**Why human:** business sign-off on content decisions (EK's explicit post-hoc review).

#### 2. Supply the Année Lumière 12cl / 25cl / 50cl prices

**Test:** give EK's prices. **Expected:** replace « Prix sur demande » with 3 variants (update `menu-2026.json` before any future sync, or edit in Studio, then run `revalidate.mjs`). **Why human:** input only EK has; the documented default is the intended state meanwhile.

#### 3. Optional real-device glance

**Test:** open `https://umai-ramen.fr/fr/menu` on a phone (iOS Safari / Android Chrome). **Expected:** the 375 px layout seen in headless Chrome (variants on one line, pills, no horizontal scroll). **Why human:** real-device rendering and subjective look (Phase 13 redesigns the tourist layout anyway).

### Gaps Summary

No gaps. The live French menu at `https://umai-ramen.fr/fr/menu` is a faithful mirror of the 2026 print: 20 categories, 77 items, 87 price tokens, in print order, each price bound to its own item, with the print's notes and markers, « Prix sur demande » for Année Lumière, the BAT description for the Trio, « Asahi » corrected, and no `??` anywhere in FR, EN or DE. Production Sanity holds exactly the transcribed documents (field-by-field equal), the 174 superseded documents are hidden and preserved, the pre-write backups exist and are intact, and the report, rollback path and EK hand-off are all in place. EN/DE show the same French content with localized UI labels until Phase 14, as planned.

---

_Verified: 2026-11-23T20:35:26Z_
_Verifier: Claude (gsd-verifier)_
