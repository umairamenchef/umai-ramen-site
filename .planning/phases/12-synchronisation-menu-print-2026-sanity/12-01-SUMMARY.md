---
phase: 12-synchronisation-menu-print-2026-sanity
plan: 01
subsystem: ui
tags: [sanity, groq, next-intl, json-ld, schema, node-test, tailwind, menu]

# Dependency graph
requires: []
provides:
  - "Sanity schema: priceVariant object type; menuItem prices[] / priceOnRequest / badges / subgroup (price now optional with custom validation); menuCategory nameJp / section / footnote; menuFormule available"
  - "src/lib/menu.ts: import-free menu contract (types) + tested display helpers (formatEuro, getPriceDisplay, variantQuantityText, buildOffers, groupBySection, withSubgroupHeadings, pickLocale)"
  - "GROQ: MENU_CATEGORIES_QUERY projects the new fields; MENU_FORMULES_QUERY hides available=false; HOMEPAGE_QUERY ignores categories without visible items and takes the signature price from the visible Tantan Ramen"
  - "Menu page renders variants, prix sur demande, badges, sub-groups, JP labels, footnotes, Plats/Boissons sections and page notes; JSON-LD has one Offer per variant and none for prix sur demande"
  - "menu.* message keys in fr/en/de (sections, priceOnRequest, badge, unit with ICU plural, intro, allergens, serviceIncluded)"
affects: [12-02 sync script, 12-03 deploy + apply, 13 tourist menu page, 14 translations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure display logic lives in src/lib/menu.ts with zero runtime imports, tested by node:test through Node 24 native type stripping (src/lib/menu.test.mjs)"
    - "Units and badges are structured enum values rendered through message keys (menu.unit.*, menu.badge.*) so Phase 13/14 translate them without touching content"
    - "Sticky nav, page sections and JSON-LD all consume the same groupBySection() order"

key-files:
  created:
    - src/sanity/schemaTypes/priceVariant.ts
    - src/lib/menu.ts
    - src/lib/menu.test.mjs
  modified:
    - src/sanity/schemaTypes/menuItem.ts
    - src/sanity/schemaTypes/menuCategory.ts
    - src/sanity/schemaTypes/menuFormule.ts
    - src/sanity/schemaTypes/index.ts
    - src/sanity/lib/queries.ts
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json
    - src/components/menu/MenuItem.tsx
    - src/components/menu/MenuCategory.tsx
    - "src/app/(site)/[locale]/menu/page.tsx"
    - src/components/home/MenuPreview.tsx
    - "src/app/(site)/[locale]/page.tsx"

key-decisions:
  - "getPriceDisplay ignores price variants without a numeric price, so a malformed document can never crash the page or print a raw null/NaN"
  - "Exactly one priced variant renders as a single price that keeps its quantity text immediately before the amount (« 33cl 5,90 € »); two or more render as a variants list under the description"
  - "priceOnRequest wins over any stored price or variants (Année Lumière case)"
  - "Categories without visible items are dropped from the page, the sticky nav and the JSON-LD alike (previously JSON-LD listed every category)"
  - "EN/DE get proper menu strings now (Food/Drinks, Speisen/Getränke, ...) so /en and /de never show raw keys; IT/ZH come in Phase 13, EN/DE re-check in Phase 14"
  - "REQUIREMENTS.md checkboxes for MENU-01/02/03/05/06 are intentionally NOT ticked here: they describe live-site outcomes that only Plan 03 (deploy + sync + live verify) can prove"

patterns-established:
  - "Display contract first: schema + src/lib/menu.ts types define the document shape the sync script (Plan 02) must write"
  - "Backward compatibility by relaxation: new fields optional, price validation relaxed to « price OR variants OR prix sur demande », existing docs stay valid"

requirements-completed: [MENU-01, MENU-02, MENU-03, MENU-05, MENU-06]

# Metrics
duration: 13min
completed: 2026-11-23
---

# Phase 12 Plan 01: Schema + FR rendering layer Summary

**Backward-compatible Sanity schema and FR rendering for the 2026 print menu: price variants (3/6/9 pcs, 25cl/50cl, « 3 × 6cl »), « Prix sur demande », badges, sub-groups, Plats/Boissons sections, JP labels, footnotes and page notes, backed by a 29-test import-free helper module and hardened home queries.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-11-23T19:22:41Z
- **Completed:** 2026-11-23T19:35:17Z (code); metadata commit follows
- **Tasks:** 3 (Task 2 as TDD: RED + GREEN commits)
- **Files modified:** 16 (3 created, 13 modified)

## Accomplishments

- Studio editors can now store everything the 2026 print needs: several price variants per item (quantity + unit, or a free label), « Prix sur demande », the two badges, sub-groups, a category JP label / section / footnote, and a formule availability switch. A menu item validates with a single price, with variants, or with « Prix sur demande » and fails with none of the three. Existing documents (167 items, 26 categories, 5 extras, 2 formules) stay valid.
- The menu page renders all of it in FR, EN and DE. With today's legacy data it renders exactly as before apart from the new page notes (verified on the real `next build` output).
- JSON-LD is now correct for variants: one `Offer` per variant (named « 3 pcs », « 25cl », ...), a single `Offer` object for a plain price, and no `Offer` for « Prix sur demande » items; only visible categories are listed.
- The home « Notre Menu » cards and the Tantan signature price can no longer be hijacked by hidden legacy documents (this is what makes Plan 03's sync safe for the home page).

## Task Commits

Each task was committed atomically (path-limited commits, `--no-verify`, parallel executor 12-02 active):

1. **Task 1: Extend the Sanity schema** - `de19c2f` (feat)
2. **Task 2: Menu data layer, queries and message keys** (TDD)
   - RED: `7ad942f` (test) - 29-case node:test suite, fails with module-not-found before `menu.ts` exists
   - GREEN: `9f3b707` (feat) - `src/lib/menu.ts`, queries, fr/en/de message keys; 29/29 pass
3. **Task 3: Render variants, badges, sub-groups, sections and page notes; harden home cards** - `4f77dfc` (feat)

**Plan metadata:** added by the final docs commit (SUMMARY + STATE + ROADMAP).

## Files Created/Modified

- `src/sanity/schemaTypes/priceVariant.ts` - object type `{quantity, unit (pcs/cl/l/scoop), label (localeString), price}`
- `src/sanity/schemaTypes/menuItem.ts` - `price` optional with custom validation; `prices[]`, `priceOnRequest`, `subgroup`, `badges`; preview shows variants / « Prix sur demande »
- `src/sanity/schemaTypes/menuCategory.ts` - `nameJp`, `section` (food/drinks), `footnote`
- `src/sanity/schemaTypes/menuFormule.ts` - `available` (default true) and « ⛔ Masqué » preview
- `src/sanity/schemaTypes/index.ts` - registers `priceVariant`
- `src/lib/menu.ts` - menu contract (types) and pure helpers, no imports
- `src/lib/menu.test.mjs` - 29 node:test cases
- `src/sanity/lib/queries.ts` - new projections, formule filter, hardened home query
- `src/messages/{fr,en,de}.json` - `menu.sectionFood/sectionDrinks/priceOnRequest/badge/unit/intro/allergens/serviceIncluded`
- `src/components/menu/MenuItem.tsx` - takes the whole item; variants list, single price with quantity, prix sur demande, badge pills
- `src/components/menu/MenuCategory.tsx` - JP label, sub-group headings, footnote
- `src/app/(site)/[locale]/menu/page.tsx` - section grouping, shared order for nav/page/JSON-LD, offers per variant, page notes before the eazee-link CTA (CTA kept)
- `src/components/home/MenuPreview.tsx` - on-brand accent fallback with the category JP label for cards without a photo
- `src/app/(site)/[locale]/page.tsx` - `nameJp` added to the homepage data type

## Decisions Made

See `key-decisions` above. Additional rationale:

- **Variants list sits under the description, single price stays right-aligned.** That is the plan's layout; separators live inside each `<li>` so a wrapped line can start with « · » on very narrow screens. Visual polish for the tourist layout belongs to Phase 13.
- **Test file stays `.mjs`** (not `.mts`) so `tsc` (which includes `**/*.mts`) never sees the `.ts` import extension. Node prints a harmless `MODULE_TYPELESS_PACKAGE_JSON` warning because `package.json` has no `"type"`; it was deliberately not changed (it would flip the whole project to ESM).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Malformed price variants must not crash the menu page**
- **Found during:** Task 2 (designing `getPriceDisplay`)
- **Issue:** `formatEuro(variant.price)` throws on a variant stored without a numeric `price` (`null.toFixed`), which would take the whole `/menu` route down; the plan's rule set did not cover this and « no code path can print `??` » (MENU-06) implies never printing a raw null/NaN either. Variants are written by an API script (Plan 02), so Studio's `required()` cannot be relied on.
- **Fix:** `getPriceDisplay` filters out variants without a numeric `price` before deciding between variants / single / none; `buildOffers` inherits it. One extra test case (two assertions) covers it.
- **Files modified:** `src/lib/menu.ts`, `src/lib/menu.test.mjs`
- **Verification:** `node --test src/lib/menu.test.mjs` 29/29
- **Committed in:** `9f3b707` (the malformed-variant test was already part of the RED commit `7ad942f`)

**2. [Rule 2 - Missing critical functionality] No empty footnote paragraph / no empty quantity span**
- **Found during:** Task 3
- **Issue:** a category whose `footnote` object exists but has no FR text, or a lone variant with no quantity/unit/label, would render an empty italic `<p>` or an empty span plus a stray space.
- **Fix:** `MenuCategory` computes the footnote text first and renders it only when non-empty; `MenuItem` renders the quantity span only when the text is non-empty.
- **Files modified:** `src/components/menu/MenuCategory.tsx`, `src/components/menu/MenuItem.tsx`
- **Committed in:** `4f77dfc`

---

**Total deviations:** 2 auto-fixed (both Rule 2, small defensive guards inside the plan's intent)
**Impact on plan:** No scope creep; the guards only prevent crashes or empty markup.

## Verification Evidence

- `node --test src/lib/menu.test.mjs`: 29 tests, 0 failures (RED run failed with `ERR_MODULE_NOT_FOUND` first)
- `npx tsc --noEmit`: exit 0 (after each task)
- Schema check (plan command, output redirected to the session scratchpad): `SCHEMA OK` (all new fields present, `menuItem.price` optional, `menuItem.name` still required); no `extract.json` / `types.ts` generated in the repo
- `rm -rf .next/cache/fetch-cache && npx next build`: success; prerendered HTML check printed `LOCAL RENDER OK (legacy data)` (legacy « Ramen Paitan » still on /fr/menu, home still shows 14,90 and « Ramen Paitan », new notes present in FR/EN/DE, no raw `menu.*` key, no `??`, no empty JSON-LD MenuSection)
- Beyond the plan: read-only GROQ check of the three modified queries against the public production dataset (returns today's legacy data: 26 categories / 167 items, same 3 home categories, signature 14,9). No write of any kind.
- Beyond the plan: rendered the real `MenuPage` with a rich fixture (variants, single variant, label variant, scoops, prix sur demande, both badges, sub-groups, JP labels, footnote, both sections, an unsectioned category and an empty one) in FR/EN/DE through a scratchpad-only esbuild harness with strict missing-message handling: 27/27 assertions passed, including the exact « 3 pcs 5,50 € · 6 pcs 9,90 € · 9 pcs 13,90 € » text, « 33cl 5,90 € », « Prix sur demande » (once, no number), nav order == page order == JSON-LD order, and per-variant JSON-LD offers. The harness lives only in the session scratchpad and is not committed.
- `git log --stat` for this plan's commits touches exactly the 16 `files_modified`; none of `docker-compose.yml`, `Dockerfile`, `Caddyfile`, `deploy/`, `.claude/`, `extract.json`, `types.ts` were staged.

## Issues Encountered

- The plan's acceptance grep for the home query (`grep -n 'count(\*\[_type == "menuItem" && references(^._id) ...'`) returns nothing with macOS BSD grep because it treats the `^` after `(` as an anchor in basic regex. The line is present (matches with `grep -F` and `grep -E`, line 62 of `queries.ts`). Not a code issue.
- First harness run threw next-intl's `ENVIRONMENT_FALLBACK` (no `timeZone` configured, pre-existing and unrelated) because my strict `onError` rethrew everything; next-intl's client wrapper masks that as « context not found ». Fixed in the harness only.
- The pre-existing `next build` warning about multiple lockfiles (workspace root inference) is unchanged and out of scope.

## User Setup Required

None - no external service configuration required.

## Notes for Plan 03 (deploy) and Plan 02 (sync)

- **Build command:** `rm -rf .next/cache/fetch-cache && npx next build` (never `npm run build`; purge the data cache before any content-checked build). My last local build left fresh entries built from the legacy data in `.next/cache/fetch-cache`, so purge again before the post-sync build.
- **Schema check command** (from the plan guardrails; set `TMPDIR` to somewhere writable you do not mind): `cd src/sanity && NEXT_PUBLIC_SANITY_PROJECT_ID=c7twe801 NEXT_PUBLIC_SANITY_DATASET=production npx sanity schema extract --enforce-required-fields --path="$TMPDIR/umai-extract.json"`.
- **Document shape the renderer expects** (types in `src/lib/menu.ts`):
  - `prices[]` entries need a numeric `price`; `unit` in `pcs|cl|l|scoop`; `label` (localeString) only for odd formats (« 3 × 6cl »). Two or more variants render as a list under the description; **exactly one** renders as a single price with its quantity text before the amount (« 33cl 5,90 € »).
  - `priceOnRequest: true` wins over any stored `price`/`prices`; store no variants for Année Lumière.
  - `price` should hold the single price or the lowest variant price (Studio preview and legacy readers). The home signature reads `price` of the visible `name.fr == "Tantan Ramen"`: exactly one visible Tantan Ramen must exist after the sync and it must carry `price`.
  - `badges` values must be `bestseller` or `vegetarianOption` (any other value would print a raw message key).
  - `subgroup` headings appear where the text changes between consecutive items: keep each sub-group contiguous in `order`.
  - Categories: `section` in `food|drinks` (missing = unlabelled group at the end), optional `nameJp`, `description`, `footnote`. Categories without visible items vanish from page, nav and JSON-LD.
  - Home « Notre Menu » shows the first 3 categories **by `order`** that have visible items, each with the first visible item photo. Give Entrées, Tantan Umaï and Ramen the lowest `order` values and migrate their 3 photos (Plan 02 decision), otherwise the card falls back to the green JP-label block.
  - Formules: set `available: false` to hide (missing field stays visible). Extras: `MENU_EXTRAS_QUERY` unchanged, hide with `available: false`.
- **DOM contract for the live check:** the quantity text is immediately before the price in the DOM (`<span>33cl</span> 5,90 €`, variants `<span>3 pcs</span> <span>5,50 €</span>`); prices use a non-breaking space before « € » and React SSR may insert `<!-- -->` between adjacent text nodes, so strip comments and normalize NBSP before text matching.
- **Cache refresh:** `sanityFetch` passes `revalidate: false` whenever tags are given, so Sanity data in the Next data cache only refreshes through the signed `/api/revalidate` webhook (or a rebuild). Plan 03 already plans « signed revalidate »; do not rely on the 60 s ISR to pick up the sync.
- **Studio:** the Studio is embedded at `/studio` in this app, so the new fields reach editors with the same deploy; no separate `sanity deploy`.

## Known Stubs

None. (The `MenuPreview` accent block is the intentional fallback for a visible category without a photo, not a placeholder awaiting data.)

## Next Phase Readiness

- Plan 02 can write documents in the shape above; Plan 03 can deploy this code first and confirm the legacy menu still renders, then apply the sync.
- Phase 13 builds on `MenuItem` / `MenuCategory` / `src/lib/menu.ts` (units and badges already go through message keys).
- Requirements MENU-01/02/03/05/06: capability delivered and unit/render-tested; REQUIREMENTS.md left at Pending on purpose until Plan 03 proves the live outcome.

---
*Phase: 12-synchronisation-menu-print-2026-sanity*
*Completed: 2026-11-23*

## Self-Check: PASSED

- Created files present: `src/sanity/schemaTypes/priceVariant.ts`, `src/lib/menu.ts`, `src/lib/menu.test.mjs`, this SUMMARY
- Commits present: `de19c2f`, `7ad942f`, `9f3b707`, `4f77dfc`
- Final re-run after all commits: `node --test` 29/29, `npx tsc --noEmit` exit 0
