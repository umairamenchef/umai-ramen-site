---
phase: 02-content-pages
plan: 01
subsystem: ui
tags: [sanity, groq, next-intl, i18n, motion, tailwind-css-4, image-url, lightbox]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Layout shell (Header, Footer, MobileBar, MotionProvider), Button component, Sanity client + schemas, GROQ query infrastructure

provides:
  - urlFor helper (Sanity CDN URL builder with WebP auto-conversion)
  - localized() utility (locale-aware Sanity field extractor for localeString/localeText)
  - FadeInUp component (scroll animation wrapper using m.div from motion/react + whileInView)
  - outline-white Button variant (for hero overlay CTAs)
  - scroll-padding-top: 132px in globals.css (accounts for sticky header + sub-nav)
  - next.config.ts qualities: [75, 85] for hero image quality support
  - menuExtra Sanity schema (MENU-04 extras grid)
  - menuFormule Sanity schema (MENU-05 formules with includedItems)
  - MENU_EXTRAS_QUERY, MENU_FORMULES_QUERY, HOMEPAGE_QUERY, NOTRE_HISTOIRE_QUERY, INFOS_QUERY GROQ queries
  - GALLERY_QUERY updated with image metadata dimensions (for lightbox aspect ratio)
  - SITE_SETTINGS_QUERY updated to include all required URL and contact fields
  - All 7 page i18n namespaces (home, menu, reservation, commander, histoire, infos, gallery) in fr/en/de
  - Layout components (Header, MobileBar, MobileMenu, Footer) all receive reservationUrl/uberEatsUrl from Sanity siteSettings via root layout
affects:
  - 02-02 (homepage — uses HOMEPAGE_QUERY, FadeInUp, urlFor, outline-white Button, reservationUrl/uberEatsUrl)
  - 02-03 (menu page — uses MENU_CATEGORIES_QUERY, MENU_EXTRAS_QUERY, MENU_FORMULES_QUERY, FadeInUp, localized)
  - 02-04 (remaining pages — uses all queries, FadeInUp, localized, i18n namespaces)
  - All future pages — layout components now Sanity-driven, no hardcoded URLs

# Tech tracking
tech-stack:
  added:
    - "@sanity/image-url@2.0.3 — Sanity CDN URL builder with WebP, resize, hotspot"
    - "yet-another-react-lightbox@3.29.1 — React 19 compatible lightbox for gallery page"
  patterns:
    - "urlFor(source).width(N).auto('format').url() — standard Sanity CDN URL pattern"
    - "localized(field, locale, fallback) — locale-aware field extraction from Sanity objects"
    - "FadeInUp wrapper with m.div from motion/react + whileInView + viewport.once — scroll animation"
    - "Layout props pattern: root layout fetches siteSettings, passes URLs as props to Header/Footer/MobileBar"
    - "sanityFetch in layout wrapped in try/catch — graceful fallback when Sanity credentials not configured"

key-files:
  created:
    - src/sanity/lib/image.ts
    - src/lib/localized.ts
    - src/components/ui/FadeInUp.tsx
    - src/sanity/schemaTypes/menuExtra.ts
    - src/sanity/schemaTypes/menuFormule.ts
  modified:
    - package.json
    - next.config.ts
    - src/components/ui/Button.tsx
    - src/app/globals.css
    - src/sanity/schemaTypes/index.ts
    - src/sanity/structure.ts
    - src/sanity/lib/queries.ts
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json
    - src/app/[locale]/layout.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/MobileBar.tsx
    - src/components/layout/MobileMenu.tsx
    - src/components/layout/Footer.tsx

key-decisions:
  - "SanityImageSource type imported from '@sanity/image-url' directly (not '@sanity/image-url/lib/types/types' which doesn't exist in v2)"
  - "sanityFetch in root layout wrapped in try/catch — prevents build failure when Sanity credentials are placeholder values"
  - "menuFormule includedItems uses array of string (not localeString) — simpler editorial model; items are typically format-specific (e.g. '1 Gyoza + 1 Ramen')"
  - "SITE_SETTINGS_QUERY updated to remove catchphrase/accentColor — those fields now separated into HOMEPAGE_QUERY for homepage use"

patterns-established:
  - "Layout URL injection: root locale layout fetches siteSettings, passes reservationUrl/uberEatsUrl as props to all layout components — single fetch point, no prop drilling through pages"
  - "FadeInUp pattern: use m from motion/react (not motion/react-m namespace) with whileInView + viewport.once — established in Phase 1 and confirmed here"
  - "Query naming convention: PAGE_QUERY for generic page, NOTRE_HISTOIRE_QUERY for specific page, INFOS_QUERY for settings-only pages"

requirements-completed: [MENU-04, MENU-05, MENU-06, INTG-01, INTG-02]

# Metrics
duration: 7min
completed: 2026-02-23
---

# Phase 2 Plan 01: Shared Infrastructure Summary

**@sanity/image-url + yet-another-react-lightbox installed; urlFor/localized/FadeInUp helpers created; menuExtra + menuFormule schemas registered; 8 GROQ queries added; all 7 i18n namespaces in 3 locales; Header/MobileBar/MobileMenu/Footer wired to Sanity siteSettings URLs (no more hardcoded Gusty/UberEats constants)**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-23T01:03:04Z
- **Completed:** 2026-02-23T01:10:06Z
- **Tasks:** 3 of 3
- **Files modified:** 15

## Accomplishments

- Installed `@sanity/image-url` and `yet-another-react-lightbox`; created urlFor helper for Sanity CDN URLs with WebP auto-conversion
- Created `localized()` utility for locale-aware Sanity field extraction and `FadeInUp` scroll animation wrapper
- Added `outline-white` Button variant, `scroll-padding-top` CSS rule, and `qualities: [75, 85]` to next.config.ts
- Created menuExtra and menuFormule Sanity schemas (MENU-04, MENU-05); registered in Studio and added to structure
- Extended queries.ts with MENU_EXTRAS_QUERY, MENU_FORMULES_QUERY, HOMEPAGE_QUERY, NOTRE_HISTOIRE_QUERY, INFOS_QUERY; updated GALLERY_QUERY with image metadata dimensions
- Added all 7 page namespaces (home, menu, reservation, commander, histoire, infos, gallery) to fr.json, en.json, de.json
- Removed all hardcoded Gusty/Uber Eats URLs from Header, MobileBar, MobileMenu, Footer — all CTA URLs now come from Sanity siteSettings via root layout (INTG-01, INTG-02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, create urlFor/localized/FadeInUp helpers, add outline-white Button variant** - `ebfea8d` (feat)
2. **Task 2: Create menuExtra/menuFormule schemas, extend GROQ queries, add all i18n namespaces** - `32e7f97` (feat)
3. **Task 3: Wire Sanity siteSettings URLs into Header, MobileBar, MobileMenu, Footer** - `c9bbfc3` (feat)

## Files Created/Modified

- `src/sanity/lib/image.ts` - urlFor Sanity CDN URL builder using @sanity/image-url
- `src/lib/localized.ts` - locale-aware field extractor for Sanity localeString/localeText objects
- `src/components/ui/FadeInUp.tsx` - scroll animation wrapper using m.div from motion/react
- `src/sanity/schemaTypes/menuExtra.ts` - Extras schema (name, price, order, available) for MENU-04
- `src/sanity/schemaTypes/menuFormule.ts` - Formules schema (name, price, description, includedItems, order) for MENU-05
- `src/components/ui/Button.tsx` - Added outline-white variant (bg-transparent, border-white, text-white)
- `src/app/globals.css` - Added scroll-padding-top: 132px to @layer base for sticky sub-nav offset
- `next.config.ts` - Added qualities: [75, 85] to images config
- `package.json` - Added @sanity/image-url and yet-another-react-lightbox
- `src/sanity/schemaTypes/index.ts` - Registered menuExtra and menuFormule
- `src/sanity/structure.ts` - Grouped Menu Categories/Items/Extras/Formules under single Menu list item
- `src/sanity/lib/queries.ts` - Added MENU_EXTRAS_QUERY, MENU_FORMULES_QUERY, HOMEPAGE_QUERY, NOTRE_HISTOIRE_QUERY, INFOS_QUERY; updated GALLERY_QUERY and SITE_SETTINGS_QUERY
- `src/messages/fr.json` - Added 7 page namespaces with French primary text
- `src/messages/en.json` - Added 7 page namespaces with English translations
- `src/messages/de.json` - Added 7 page namespaces with German translations
- `src/app/[locale]/layout.tsx` - Added sanityFetch for SITE_SETTINGS_QUERY; passes reservationUrl/uberEatsUrl to layout components
- `src/components/layout/Header.tsx` - Props-based reservationUrl/uberEatsUrl; passes to MobileMenu
- `src/components/layout/MobileBar.tsx` - Props-based reservationUrl/uberEatsUrl
- `src/components/layout/MobileMenu.tsx` - Props-based reservationUrl/uberEatsUrl
- `src/components/layout/Footer.tsx` - Props-based reservationUrl/uberEatsUrl

## Decisions Made

- `SanityImageSource` type imported from `@sanity/image-url` directly — the path `@sanity/image-url/lib/types/types` does not exist in v2.x; type is exported at package root
- `sanityFetch` in root layout wrapped in try/catch to prevent build failure when Sanity credentials are placeholder values (`your-project-id`) — non-blocking, falls back to `'#'` URLs
- `menuFormule.includedItems` uses `array of string` (not `localeString`) — simpler editorial model; formule contents are typically fixed format strings like "1 Gyoza + 1 Ramen", not translated text

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wrong SanityImageSource import path**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** Plan specified `import type { SanityImageSource } from '@sanity/image-url/lib/types/types'` but this path doesn't exist in @sanity/image-url v2.x — TypeScript error: Cannot find module
- **Fix:** Changed import to `from '@sanity/image-url'` — the type is exported at package root in v2
- **Files modified:** `src/sanity/lib/image.ts`
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** `ebfea8d` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added try/catch around sanityFetch in layout**
- **Found during:** Task 3 (build verification)
- **Issue:** Adding `sanityFetch` to root layout caused build failure: "Dataset not found for project ID your-project-id" — build-time prerendering attempts Sanity fetch with placeholder credentials
- **Fix:** Wrapped sanityFetch in try/catch with fallback `'#'` URLs — build succeeds, ISR will fetch real values at runtime when credentials are configured
- **Files modified:** `src/app/[locale]/layout.tsx`
- **Verification:** `npx next build` succeeds with all locale routes as SSG ●
- **Committed in:** `c9bbfc3` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1x Rule 1 - Bug, 1x Rule 2 - Missing Critical)
**Impact on plan:** Both fixes necessary for correctness and build success. No scope creep.

## Issues Encountered

- `@sanity/image-url` v2.x changed the location of `SanityImageSource` type — it is now exported from package root, not from `lib/types/types`
- Build failure when `sanityFetch` added to root layout with placeholder Sanity credentials — resolved with try/catch error handling

## User Setup Required

None - no external service configuration required at this stage. Real Sanity credentials needed in `.env.local` for data fetching to work (already noted as non-blocking blocker in STATE.md).

## Next Phase Readiness

- All shared infrastructure ready: urlFor, localized, FadeInUp, outline-white Button, all GROQ queries, all i18n namespaces
- menuExtra and menuFormule schemas are registered — Studio needs real Sanity credentials to show them
- Layout is fully Sanity-driven for CTAs — no hardcoded URLs anywhere in layout components
- Plan 02-02 (homepage), 02-03 (menu page), and 02-04 (remaining pages) can now build on top of this shared infrastructure without conflicts

---
*Phase: 02-content-pages*
*Completed: 2026-02-23*

## Self-Check: PASSED

All required files verified present. All task commits verified in git history:
- `ebfea8d` - Task 1: Install deps, urlFor/localized/FadeInUp helpers, outline-white Button
- `32e7f97` - Task 2: menuExtra/menuFormule schemas, GROQ queries, i18n namespaces
- `c9bbfc3` - Task 3: Sanity siteSettings URLs wired into layout components
