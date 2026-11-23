# Phase 12: Synchronisation menu print 2026 → Sanity - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning
**Mode:** Autonomous (EK, 2026-11-23: « Avance en autonome jusqu'à livraison déployé ») — decisions below were taken by Claude with EK's prior locks; no discuss session.

<domain>
## Phase Boundary

Make the live FR web menu (`umai-ramen.fr/fr/menu`, Sanity production dataset) a faithful mirror of the **2026 printed menu** — food spread + drinks recto/verso — including multi-price variants, service notes/markers, sub-groups, and the "price on request" case. Includes the schema + component changes needed to *store and render* that content in French. Translations (EN/DE/IT/ZH content), IT/ZH locales, the bilingual tourist rendering and the language switcher are **Phase 13/14**, not here — but every new text must be stored in a translatable field (`localeString`/`localeText`) or as an enum/key that Phase 13 can translate through message files.

</domain>

<decisions>
## Implementation Decisions

### Source of truth & transcription
- Source = `.planning/sources/menu-2026/plats-ouvert-360x250mm-print-2026-11-10.pdf` (food) + `boissons-180x250mm-print-2026-11-03.pdf` (drinks, 2 pages). Extracted text layers `*-print.txt` help, but **the PDFs must be read visually** (render pages to PNG at ≥150 dpi and look): the text layer detaches prices from items (gyoza/takoyaki rows), and the vegetarian marker on Tantan Ramen + Edamame icons are graphics.
- Produce a structured, reviewable transcription first: `scripts/menu-2026/menu-2026.json` (categories in print order → items in print order, FR texts verbatim, variants, notes, markers). This JSON is the single input of the sync script and will be extended with `en/de/it/zh` in Phase 14.
- Keep print wording verbatim (accents, capitalisation as printed in running text; headings in title case rather than ALL CAPS — the UI uppercases via CSS). Normalise only: decimal comma prices are stored as numbers; degree values kept in text as printed but with a consistent FR decimal comma (`15,5°`, `4,5°`).

### EK-gated values (defaults under the autonomy grant — list them in the report for EK post-hoc review)
- **Année Lumière millésime 2023 — Domaine Le Clos des Lumières** (vins rouges): print shows `12cl ?? | 25cl ?? | 50cl ??` → publish the item with `priceOnRequest: true` (renders « Prix sur demande », translatable key) and NO variants. Never publish `??`.
- **Trio dégustation 3 × 6cl — 18,00** (sakés): print description is `????????` → use the BAT text « Trois sakés sélectionnés par notre équipe. »
- **« Asashi Super Dry »** (bières bouteille) → « Asahi Super Dry ». Other spelling oddities: keep as printed unless clearly a typo; list every correction in the report.

### Data model (schema changes, backward compatible)
- `menuItem`:
  - `price` becomes **optional** (keep it; set it to the lowest/first price for backward compatibility + JSON-LD). Validation: an item must have `price`, or `prices[]`, or `priceOnRequest`.
  - NEW `prices`: array of `priceVariant` objects `{ quantity?: number, unit?: 'pcs' | 'cl' | 'l' | 'scoop', label?: localeString (only for odd cases like « 3 × 6cl »), price: number }`. Units are rendered through message-file keys (Phase 13 translates them); `cl`/`l` render as-is.
  - NEW `priceOnRequest`: boolean (« Prix sur demande »).
  - NEW `badges`: array of enum strings — at least `bestseller` (« Notre best-seller »), `vegetarianOption` (« Version végétarienne disponible »). Rendered via message keys.
  - NEW `subgroup`: localeString (e.g. « Pressions » / « Bouteilles », « Whiskies » / « Rhums », « Vins blancs » / « Vins rouges », « Cafés » / « Thés verts japonais » / « Infusions »). Rendered as a small sub-heading when it changes between consecutive items of a category.
  - Existing `isVegetarian` / `isGlutenFree` / `nameJp` / `available` / `order` kept. `nameJp` carries the print's Japanese label where the print shows one at item level (唐揚げ, 餃子, たこ焼き, 枝豆).
- `menuCategory`:
  - NEW `nameJp` (string, decorative label as printed: 前菜, 担々麺, ラーメン, まぜそば, うどん, お子様メニュー, 追加トッピング, デザート, ドリンク, スプリッツァー, ハイボール, カクテル, ノンアルコールカクテル, アイスティー, ソフトドリンク, ミネラルウォーター, 日本酒, ウイスキー＆ラム, ワイン, コーヒー・お茶 …).
  - NEW `section`: enum `food` | `drinks` (page groups categories under « Plats » / « Boissons » headings; nav can group too).
  - Existing `description` (localeText) carries category notes: « Nos spécialités à base de sésame blanc. », « Nouilles en bouillon. », « Nouilles à mélanger, sans bouillon. », « Le midi seulement » (Udon), « Pour les enfants de moins de 10 ans. » (Menu enfant), « Complétez votre bol avec nos extras. », « Service de 10cl, sauf trio. », serving sizes (« 25cl », « 30cl », « 20cl », « 4cl ») where the print puts them on the heading.
  - NEW `footnote` (localeText, optional) for text printed after the items: Menu enfant « Inclus : un sirop à l'eau et une boule de glace au choix. »
- `menuFormule`: add `available` (boolean, default true) + filter `available != false` in `MENU_FORMULES_QUERY`; set both existing formules to `available: false` (they are not on the 2026 print). `menuExtra`: existing docs set `available: false`; Extras become a regular `menuCategory` (« Extras », section food) so they get variants and translations like everything else.
- Page-level notes (« Dégustez nos ramens artisanaux faits maison, du bouillon aux nouilles de blé (poulet alsacien et farine du moulin de Sarralbe). », « Une liste des allergènes est disponible sur demande. », « Prix service compris ») → message-file keys in `src/messages/*.json` (`menu.*`), FR now; Phase 13 adds IT/ZH, Phase 14 checks EN/DE.

### Category structure (print order)
- **Food:** Entrées (Karaage, Gyozas [« Garniture au choix : poulet, porc ou légumes. »], Takoyaki, Edamame) → Tantan Umaï (Tantan Ramen [bestseller, vegetarianOption if the print's icon says so — verify visually], Yasai Ramen, Tantan Mazesoba, Tantan Tsukemen) → Ramen → Mazesoba → Udon (le midi seulement) → Menu enfant (Little Tokyo, Mini Ramen — each 9,90) → Extras → Desserts.
- **Drinks:** Bières (subgroups Pressions / Bouteilles) → Spritz → Highball → Cocktails signature → Cocktails sans alcool → Thés glacés → Softs → Eaux minérales → Sakés japonais → Whiskies & Rhums (subgroups) → Vins (subgroups Vins blancs / Vins rouges) → Cafés & Thés (subgroups Cafés / Thés verts japonais / Infusions). Follow the print's actual reading order if it differs.
- Multi-price examples: Karaage 3 pcs 5,50 / 6 pcs 9,90 / 9 pcs 13,90; Gyozas & Takoyaki 3/6/9 pcs 4,90 / 8,90 / 12,50; Asahi 25cl 4,90 / 50cl 7,50; Riesling 12cl 5,50 / 75cl 24,00; Chashu de porc 2 pcs 3,90; Chashu de poulet 3 pcs 3,50; Trio dégustation label « 3 × 6cl » 18,00.

### Sanity write strategy (production dataset `c7twe801/production`, token `SANITY_TOKEN` in `.env.local`)
- **Backup first:** export every `menuItem`, `menuCategory`, `menuExtra`, `menuFormule` document to `.planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-<timestamp>.json` before any write. Write a `rollback` mode in the script (restore `available` flags from backup + delete `m26-*` docs).
- **New documents with deterministic IDs** prefixed `m26-` (`m26-cat-entrees`, `m26-item-karaage`, …) via `createOrReplace` in one transaction → the script is idempotent and re-runnable (Phase 14 re-runs it with translations).
- **Old documents are never deleted:** every pre-existing `menuItem`/`menuExtra`/`menuFormule` not in the 2026 set → `available: false`. Old categories end up with no visible items and disappear from the page automatically (page already filters empty categories). Do not reuse old docs (their en/de copies are stale eazee-link texts).
- **Discrepancy report** `12-DISCREPANCY-REPORT.md` (in the phase folder, FR): table of added / removed(hidden) / price changes / text changes vs the current Sanity menu, plus the « EK to confirm » list (Année Lumière prices, Trio text, typo fixes, any judgement calls). Applied without blocking (autonomy grant), handed to EK in the final report.
- Script lives in `scripts/menu-2026/` (`.mjs`, uses `@sanity/client` already available through `next-sanity`), with `--dry-run` (prints the transaction + report) and `--apply`.

### Deploy ordering (live site must never look broken)
1. Ship the schema + rendering changes first (backward compatible: old docs keep rendering) → build locally (`npm run build`, includes typegen) → commit → push `origin v2-2026` → manual deploy on the VPS (`ssh umai-app 'cd /home/ek/apps/umai && git fetch origin v2-2026 && git reset --hard origin/v2-2026 && docker compose -p umai up -d --build web'`) → verify `https://umai-ramen.fr/fr/menu` still renders the old menu.
2. Then run the sync script `--apply` → ISR (60 s) picks it up → verify the live `/fr/menu` against the print (every category, item, price; no `??`).

### Rendering (FR, minimal — the tourist bilingual layout is Phase 13)
- `MenuItem` renders variants as « 3 pcs 5,50 € · 6 pcs 9,90 € · 9 pcs 13,90 € » (wrap nicely on 375px), « Prix sur demande » when `priceOnRequest`, badges as small pills, `nameJp` as today.
- `MenuCategory` renders `nameJp`, description, subgroup sub-headings, footnote. Page groups by `section` with « Plats » / « Boissons » headings (message keys) and adds the page-level notes at the bottom.
- JSON-LD: one `Offer` per variant (or `AggregateOffer` low/high) — no offer for price-on-request items.
- Remove the eazee-link CTA from the bottom of the menu page? **No — leave it for Phase 13** (decided there together with the tourist page).

### Claude's Discretion
- Exact field names/titles in Studio (FR titles, consistent with existing schemas), plan split, script structure, sticky-nav grouping details, how the price variants wrap visually.

</decisions>

<specifics>
## Specific Ideas

- The print's food spread also carries a decorative 担々麺 vertical label on the Tantan block and the « ~Notre best-seller~ » tag — the badge is the data, decoration is optional.
- Edamame shows two dietary icons (vegetarian/vegan) — set `isVegetarian: true`; do not invent a vegan flag.
- Gyozas: single item « Gyozas — Raviolis grillés » with the filling choice in the description (the old eazee data had one item per filling — those get hidden).
- « Lisbeth bleu, verte, rouge 50cl 3,50 » is one item.
- « Coca-Cola / Coca-Cola Zéro 33cl 3,50 » is one item.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Menu source
- `.planning/sources/menu-2026/plats-ouvert-360x250mm-print-2026-11-10.pdf` — food spread (page 1 = inside spread, page 2 = cover)
- `.planning/sources/menu-2026/boissons-180x250mm-print-2026-11-03.pdf` — drinks recto/verso
- `.planning/sources/menu-2026/*-print.txt` — extracted text layers (aid only)

### Code
- `src/sanity/schemaTypes/{menuItem,menuCategory,menuExtra,menuFormule,localeString,localeText}.ts`
- `src/sanity/lib/queries.ts` — MENU_* queries
- `src/app/(site)/[locale]/menu/page.tsx`, `src/components/menu/*` — rendering + JSON-LD
- `src/lib/localized.ts` — locale fallback helper
- `src/messages/{fr,en,de}.json` — `menu.*` namespace
- `.planning/STATE.md` — deploy procedure (webhook broken → manual SSH deploy), autonomy grant decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `localized(field, locale)` falls back to FR → new docs can ship FR-only now.
- `MenuStickyNav`, `SectionHeader`, `DietaryBadge` components.
- ISR 60 s + Sanity tags on `sanityFetch` → content writes show up within a minute without redeploy.

### Established Patterns
- Field-level i18n objects `{fr, en, de}`; Studio titles in French; `available` boolean to hide without deleting; `order` number for sorting.
- Typegen runs on `prebuild` (`sanity schema extract` + `sanity typegen generate`) — schema changes must keep the build green.

### Integration Points
- Current production menu = 167 `menuItem` + 26 `menuCategory` + 5 `menuExtra` + 2 `menuFormule`, rebuilt from eazee-link 2026-07-14 (outdated vs the print).
- Deploy = manual SSH (see STATE « Webhook de deploy CASSÉ »).

</code_context>

<deferred>
## Deferred Ideas

- Retiring/updating the eazee-link digital menu (outdated prices) — EK decision, out of v2.2 scope.
- Photos for new items — not on the print; existing images on hidden items are not migrated.

</deferred>

---

*Phase: 12-synchronisation-menu-print-2026-sanity*
*Context gathered: 2026-11-23 (autonomous)*
