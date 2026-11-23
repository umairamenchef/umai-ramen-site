---
phase: 13-fondations-multilingues-page-menu-touriste
plan: 01
subsystem: i18n
tags: [next-intl, proxy, routing, hreflang, sitemap, zh-Hans, italian, icu, node-test, next-font]

requires:
  - phase: 12-synchronisation-menu-print-2026-sanity
    provides: "menu.* message keys and the import-free src/lib/menu.ts pattern; verify-live.mjs as the 2026 menu regression gate; the two verifier findings (stale meta description, hard-coded V/SG pills)"
provides:
  - "src/i18n/locales.ts: import-free, tested single source of truth for which locale exists where (menu-only IT/ZH, proxy rule, lang/hreflang/OG mappings, EN-under-IT/ZH merge)"
  - "IT and ZH as menu-only routing locales: every non-menu /it/* and /zh/* answers 307 to the same path under /en, locale detection never lands on a non-menu IT/ZH page"
  - "src/messages/it.json and zh.json (EN deep-merged underneath at request time); menu.diet.*, menu.languageSwitcherLabel, menu.categoriesNavLabel and footer.* in all 5 locales; meta.menu.description no longer sells formules / set menus"
  - "<html lang> = zh-Hans for zh, hreflang it + zh-Hans and sitemap entries for /menu only (sitemap 38 URLs), next-intl Link hreflang header switched off"
  - "scripts/i18n/check-messages.mjs (message contract) and scripts/i18n/verify-routing.mjs (routing/SEO verifier for any base URL)"
  - "UI-04 headroom: unused Noto Sans JP weight 300 and DM Serif italic no longer requested (Noto CSS chunk -50%, one font preload fewer)"
affects: [13-02 tourist menu page, 13-03 deploy and live verification, 14-traductions, 15-qr-codes]

tech-stack:
  added: []
  patterns:
    - "Locale rules live in one import-free, erasable-TS module tested by node:test through Node 24 type stripping (same rule as src/lib/menu.ts)"
    - "Menu-only locales: pre-intl redirect in the proxy + post-intl rewrite of next-intl's detection Location; decision taken on decoded path segments"
    - "IT/ZH message files hold only what they translate; request.ts deep-merges the EN file underneath, so anything missing falls back to English, never to a raw key"
    - "Executable contracts for content: check-messages.mjs (files) and verify-routing.mjs (running site), both exit 0/1/2 and print one line per failure"

key-files:
  created:
    - src/i18n/locales.ts
    - src/i18n/locales.test.mjs
    - scripts/i18n/check-messages.mjs
    - scripts/i18n/verify-routing.mjs
    - src/messages/it.json
    - src/messages/zh.json
  modified:
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - src/proxy.ts
    - "src/app/(site)/[locale]/layout.tsx"
    - src/lib/seo.ts
    - src/app/sitemap.ts
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json

key-decisions:
  - "307 (not 308) for non-menu IT/ZH URLs: reversible while « IT/ZH for the rest of the site » is a deferred idea, and next-intl's own redirects are 307 too"
  - "Layout generateStaticParams = fr/en/de: non-menu it/zh pages are not prerendered (unreachable behind the proxy); /it/menu and /zh/menu render on demand and are ISR-cached until Plan 13-02 adds them to the menu page's own static params"
  - "alternateLinks: false in routing: pages emit their own hreflang through buildAlternates, otherwise next-intl's Link header would advertise /it/* and /zh/* for every page"
  - "The menu-only decision is taken on DECODED path segments (next-intl matches the decoded pathname), the redirect target keeps the rest of the path as received"
  - "next-intl's detection redirect is retargeted after the fact (Location rewrite) instead of changing detection: /menu with cookie zh or Accept-Language it still goes to /zh/menu and /it/menu"
  - "seo.ts keeps exporting DEFAULT_LOCALE, now as a re-export from locales.ts, so there is exactly one definition"

patterns-established:
  - "Plan 13-02 and later import locale facts from '@/i18n/locales' only (LOCALES, LOCALE_LABELS, htmlLang, ogLocale, siteLocaleFor, localesForPath), never a local list"
  - "Every new user-facing key goes through scripts/i18n/check-messages.mjs (5-locale parity, ICU, no em-dash, FR-leak guard)"

requirements-completed: [I18N-02, I18N-03, I18N-05, UI-04]  # capability delivered and verified locally; REQUIREMENTS.md intentionally left Pending until Plan 13-03 proves the live outcome (UI-04: performance headroom only, the rest lands in 13-02 and 13-03)

duration: 17min
completed: 2026-11-23
---

# Phase 13 Plan 01: Multilingual foundations (menu-only IT/ZH) Summary

**IT and ZH exist for the menu only: one tested locale-rules module drives a proxy that 307s every other /it/* and /zh/* to /en (detection and percent-encoded prefixes included), IT/ZH message files sit on an English base, `<html lang="zh-Hans">`, hreflang and sitemap list the two menu URLs alone, and two unused font requests are gone.**

## Performance

- **Duration:** about 17 min
- **Started:** 2026-11-23T21:11:16Z
- **Completed:** 2026-11-23T21:28Z (code); metadata commit follows
- **Tasks:** 3 (Task 1 as TDD: RED + GREEN, plus checker commit)
- **Files:** 15 (6 created, 9 modified)

## Accomplishments

- `/it/menu` and `/zh/menu` return 200 with `<html lang="it">` / `<html lang="zh-Hans">` on a purged production build. Every other `/it/*` and `/zh/*` URL answers 307 to the same path under `/en` with the query kept; `/`, `/infos` with Accept-Language zh/it or `NEXT_LOCALE=zh|it` end on `/en` in one redirect; `/menu` with those hints goes to `/zh/menu` or `/it/menu`; `/fr`, `/en`, `/de` behave as before.
- The IT/ZH message files carry the menu labels, nav, common, consent, order modal, footer and `meta.menu`; the rest falls back to English by deep merge (proof: the EN-only `gallery.subtitle` string is in the `/zh/menu` payload, zero raw `menu.*` keys).
- Both Phase 12 verifier findings are closed in the messages: `meta.menu.description` no longer mentions formules / set menus in any of the 5 locales, and the dietary pill labels exist in 5 locales as `menu.diet.*` (Plan 13-02 wires the component).
- hreflang carries `it` and `zh-Hans` on the menu page only (x-default stays `/fr/menu`), `sitemap.xml` has 38 URLs whose only IT/ZH entries are `/it/menu` and `/zh/menu`, and next-intl's `Link` hreflang header is gone from every response.
- UI-04 headroom: Noto Sans JP weight 300 and DM Serif italic are no longer requested (measurements below), with no visual change.

## Task Commits

1. **Task 1: Locale rules module (TDD) + message-contract checker**
   - RED: `a9f9dd5` (test) - 17 tests, fails with `ERR_MODULE_NOT_FOUND`
   - GREEN: `7f6d9f5` (feat) - `src/i18n/locales.ts`, import-free
   - Checker: `9e4ee73` (feat) - `scripts/i18n/check-messages.mjs`, RED by design (`MISSING FILE` for it/zh) until Task 2
2. **Task 2: IT/ZH message files, new fr/en/de keys, EN-merged loader** - `e28bd0d` (feat)
3. **Task 3: Activate it/zh (routing, proxy, layout, seo, sitemap, font trims, routing verifier)** - `588162b` (feat)
   - Deviation fix found while verifying Task 3: `66587be` (fix) - percent-encoded locale prefixes (see Deviations)

**Plan metadata:** added by the final docs commit (SUMMARY + STATE + ROADMAP).

## API of `src/i18n/locales.ts` (Plan 13-02 imports it)

No runtime imports, erasable TypeScript only.

```ts
export const LOCALES = ['fr', 'en', 'de', 'it', 'zh'] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE = 'fr';
export const FULL_SITE_LOCALES = ['fr', 'en', 'de'] as const;
export const MENU_ONLY_LOCALES = ['it', 'zh'] as const;
export const MENU_FALLBACK_LOCALE = 'en';
export const LOCALE_LABELS: Record<AppLocale, string>;  // FR EN DE IT 中文
export const LOCALE_NAMES: Record<AppLocale, string>;   // Français English Deutsch Italiano 中文（简体）
export function isAppLocale(value: string): value is AppLocale;
export function isMenuOnlyLocale(value: string): boolean;
export function isMenuPath(path: string): boolean;                       // '/menu' or '/menu/*' (path without locale)
export function localesForPath(path: string): readonly AppLocale[];      // menu: all 5, else fr/en/de
export function siteLocaleFor(locale: string): string;                   // it/zh -> 'en', else unchanged (links to non-menu pages)
export function htmlLang(locale: string): string;                        // 'zh' -> 'zh-Hans'
export function ogLocale(locale: string): string;                        // fr_FR en_US de_DE it_IT zh_CN, unknown -> fr_FR
export function menuOnlyRedirectPath(pathname: string): string | null;   // the proxy rule
export type MessageTree = { [key: string]: string | MessageTree };
export function mergeMessages(base: MessageTree, override: MessageTree): MessageTree;
```

## Message keys added

- **fr / en / de:**
  - `menu.languageSwitcherLabel` (Langue du menu / Menu language / Sprache der Speisekarte)
  - `menu.categoriesNavLabel` (Catégories du menu / Menu categories / Kategorien der Speisekarte)
  - `menu.diet.{vegetarian, vegetarianLabel, glutenFree, glutenFreeLabel}`: fr V / Végétarien / SG / Sans gluten, en V / Vegetarian / GF / Gluten-free, de V / Vegetarisch / GF / Glutenfrei
  - `footer.{contact, navigation, followUs, legalNotice, privacy, cookies, terms, rights}` (fr identical to today's hard-coded footer, so `/fr` does not change)
  - `meta.menu.description` rewritten without « extras et formules » / « set menus » / « Menüs » (Phase 12 verifier finding)
  - en only: `consent.moreInfo` « Learn more » to « Cookie policy » (Lighthouse SEO link-text audit)
- **it / zh:** exactly `common, consent, footer, menu, meta, nav, orderModal` (meta holds only `menu`), same `menu.diet.*` (it V / SG, zh 素 / 无麸质), `menu.unit.pcs` « {count} pz » / « {count}个 », `menu.unit.scoop` plural « pallina / palline » / « {count}球 ».
- **Dead key:** `menu.eazeeLinkCta` stays in fr/en/de until Plan 13-02 removes the CTA from the page; it is excluded from the contract (`DEAD_KEYS`) and deliberately not in it/zh.
- **Contract:** `node scripts/i18n/check-messages.mjs` prints `MESSAGES OK checks=1627` (parity, ICU, no em-dash, golden units « 3 pz » « 2 palline » « 3个 » « 2球 », FR-leak guard, golden diet labels).

## Font trims (UI-04 headroom), measured on the purged production build

| Measure | Before (build of 12-03) | After |
|---------|-------------------------|-------|
| Noto Sans JP CSS chunk | 188,005 B raw (66 KB gzip live) / 249 `@font-face` (2 weights x 124 slices + fallback) | 94,206 B raw / 32,289 B gzip / 125 `@font-face` (weight 400 x 124 + fallback) |
| DM Serif Display faces | 2 normal + 2 italic + fallback | 2 normal + fallback (second CSS chunk 14 to 12 `@font-face`) |
| `<link rel="preload" as="font">` in `fr/menu.html` | 3 | 2 (DM Serif italic no longer preloaded) |

Noto Sans JP, its `preload: false` strategy and every rendered label are unchanged; only weight 300 (never used: no `font-light` in `src/**`) and the DM Serif italic (every `italic` sits on `font-body`) went away.

## Verification output

- `node --test src/i18n/locales.test.mjs`: 19 tests, 0 fail (RED commit precedes GREEN); `node --test src/lib/menu.test.mjs`: 29/29; `npx tsc --noEmit`: exit 0
- `rm -rf .next/cache/fetch-cache && npx next build`: success first try (about 57 s); no `.next/server/app/{it,zh}.html` nor `it|zh/infos.html` after the build (the `it/` and `zh/` folders that appear later hold only `menu.*`, written by on-demand ISR when the menu pages are requested)
- `node scripts/i18n/verify-routing.mjs --base http://localhost:3100` (`next start`): **`ROUTING OK base=http://localhost:3100 checks=84`**
- `node scripts/menu-2026/verify-live.mjs --target .next/server/app/{fr,en,de}/menu.html --locale {fr,en,de}`: `VERIFY OK ... checks=309` three times (2026 menu intact)
- Content on the local server: `/zh/menu` has « 菜单 » and the EN-only « Discover the ambience and dishes of UMAI Ramen » (EN merge proof), `/it/menu` has « Il nostro menù », zero raw `menu.title|subtitle|intro|allergens` keys on both
- Negative control against the live site (still the old code, read-only GETs): `ROUTING FAILED failures=33`, as expected: `/it` goes to `/fr/it`, `/it/menu` and `/zh/menu` answer 307, next-intl's hreflang `Link` header is on every page, the sitemap has 36 URLs. `/`, `/ig-studio` and the de/en detection cases already pass. Plan 13-03 should see this flip to `ROUTING OK` after the deploy.

## Decisions Made

See `key-decisions` above. One extra note: `check-messages.mjs` also requires the new Phase 13 keys in **fr** (not only in the 4 translated locales), so a forgotten fr key cannot hide behind « derived from fr ».

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The menu-only rule could be bypassed with a percent-encoded locale prefix**
- **Found during:** Task 3 verification (edge-case probe of the running server)
- **Issue:** next-intl matches the locale prefix on the **decoded** pathname, but `menuOnlyRedirectPath` looked at the raw one: `/z%68/infos` and `/%69t/infos` returned 200 and were served as non-menu `/zh` and `/it` pages, breaking « every other /it/* or /zh/* redirects to /en ».
- **Fix:** the decision now uses the decoded first segment and the decoded remainder (`decodeURI` that never throws on a bad escape); the returned path keeps the rest exactly as received. Two new test cases (RED first, then green) and two encoded cases in the `verify-routing.mjs` matrix (`/z%68/infos` and `/%69t` to `/en/...`). `/%7A%68/menu` and `/zh/%6Denu` still serve the menu.
- **Files modified:** `src/i18n/locales.ts`, `src/i18n/locales.test.mjs`, `scripts/i18n/verify-routing.mjs`
- **Verification:** 19/19 unit tests; rebuilt, `ROUTING OK checks=84`; `curl /z%68/infos` gives 307 to `/en/infos`
- **Committed in:** `66587be` (locale module and tests) and `588162b` (verifier matrix)

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** stays inside the plan's intent (I18N-02 invariant); no scope creep, no new dependency.

## Issues Encountered

- The acceptance grep `grep -nE "\benum\b|\bnamespace\b" src/i18n/locales.ts` must print nothing, but the first draft of the header comment named those words; the comment was reworded.
- The two-hop cases are Next's own: `/it/` and `//zh/infos` get a 308 trailing-slash / slash normalisation before the proxy, then our 307. Query strings survive (`/zh/notre-histoire?ref=qr`); `_rsc` is stripped by Next before the proxy sees it.
- The local `.env.local` bakes `NEXT_PUBLIC_BASE_URL=https://umai.turfu.in` into alternates and sitemap of the local build; the verifier compares pathnames only, and the VPS build uses `https://umai-ramen.fr`.
- The pre-existing multiple-lockfile build warning is unchanged and out of scope.

## User Setup Required

None - no external service configuration required.

## Notes for Plan 13-02 (intermediate state, nothing deployed)

- `LanguageSwitcher` still iterates `routing.locales`, so until 13-02 Task 3 the header renders two buttons labelled « Switch to undefined » (it, zh). Not touched here on purpose (13-02 owns the file and uses `FULL_SITE_LOCALES`).
- The menu page still derives `og:locale` with a fr/en/else-`de_DE` ternary: `/it/menu` and `/zh/menu` currently emit `og:locale="de_DE"` until 13-02 switches it to `ogLocale()`. `DietaryBadge` still hard-codes V / SG, `Footer` still hard-codes French, and the eazee-link CTA is still on the page.
- `/it/menu` and `/zh/menu` render on demand (cached by ISR); 13-02 should add them to the menu page's own `generateStaticParams` so the build prerenders them.
- next-intl sets `NEXT_LOCALE=zh|it` when a tourist opens `/zh/menu` or `/it/menu`; any later detection on `/` or `/infos` ends on `/en` because of the Location rewrite, so chrome links from IT/ZH pages to non-menu pages should still use `siteLocaleFor()` to avoid the extra hop.
- The i18n scripts need Node 24 (`import.meta.dirname`, native type stripping); `src/**` stays Node 20 safe.

## Known Stubs

None.

## Next Phase Readiness

- Plan 13-02 can build the pill switcher, the bilingual item row, the zh font stack, the Studio fields and the chrome strings on these contracts; Plan 13-03 can deploy and run `verify-routing.mjs --base https://umai-ramen.fr` (expect the flip from 33 failures to `ROUTING OK`) plus Lighthouse on the five locales.
- Requirements I18N-02, I18N-03, I18N-05 and UI-04 (headroom share): capability delivered and checked locally; REQUIREMENTS.md left Pending on purpose until Plan 13-03 proves the live outcome.

---
*Phase: 13-fondations-multilingues-page-menu-touriste*
*Completed: 2026-11-23*

## Self-Check: PASSED

- Created files present: `src/i18n/locales.ts`, `src/i18n/locales.test.mjs`, `scripts/i18n/check-messages.mjs`, `scripts/i18n/verify-routing.mjs`, `src/messages/it.json`, `src/messages/zh.json`, this SUMMARY
- Commits present: `a9f9dd5`, `7f6d9f5`, `9e4ee73`, `e28bd0d`, `66587be`, `588162b`
- Final re-run after all commits: `node --test src/i18n/locales.test.mjs` 19/19, `check-messages.mjs` `MESSAGES OK checks=1627`, `npx tsc --noEmit` exit 0
- No commit of this plan touches `docker-compose.yml`, `Dockerfile`, `Caddyfile`, `deploy/`, `.claude/`, `.planning/config.json` or the phase 04/05/14 docs
