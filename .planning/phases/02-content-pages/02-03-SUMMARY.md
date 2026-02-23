---
phase: 02-content-pages
plan: 03
subsystem: ui
tags: [sanity, groq, next-intl, intersection-observer, tailwind-css-4, menu, sticky-nav, dietary-badges]

# Dependency graph
requires:
  - phase: 02-content-pages/02-01
    provides: localized() utility, SectionHeader component, Button component, MENU_CATEGORIES_QUERY, MENU_EXTRAS_QUERY, MENU_FORMULES_QUERY, SITE_SETTINGS_QUERY, all i18n namespaces, menuExtra/menuFormule schemas

provides:
  - DietaryBadge component (vegetarian green pill, gluten-free amber pill)
  - MenuItem component (localized name, JP name, price in EUR, description, dietary badges)
  - MenuCategory component (section with ID for IntersectionObserver targeting)
  - MenuStickyNav component ('use client', IntersectionObserver active category tracking)
  - ExtrasGrid component (2-3 column compact grid with name+price)
  - FormulesSection component (dotted-border cards with name, price, description, included items)
  - /[locale]/menu page route (static, all 3 locales, parallel Sanity fetch with try/catch fallback)
affects:
  - 02-04 (remaining pages — menu infrastructure can be referenced for patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IntersectionObserver sticky nav pattern: 'use client' component, threshold [0, 0.25, 0.5, 0.75, 1], rootMargin '-20% 0px -60% 0px', sectionMap tracks highest intersectionRatio"
    - "Parallel Sanity fetch with try/catch: Promise.all for multiple queries wrapped in try/catch for graceful fallback without credentials"
    - "EUR price formatting: price.toFixed(2).replace('.', ',') + ' €' — French locale number format"
    - "MenuCategory renders null if category.items.length === 0 — no empty sections rendered"

key-files:
  created:
    - src/components/menu/DietaryBadge.tsx
    - src/components/menu/MenuItem.tsx
    - src/components/menu/MenuCategory.tsx
    - src/components/menu/MenuStickyNav.tsx
    - src/components/menu/ExtrasGrid.tsx
    - src/components/menu/FormulesSection.tsx
    - src/app/[locale]/menu/page.tsx
  modified: []

key-decisions:
  - "Menu page wraps all sanityFetch calls in try/catch — consistent with layout.tsx pattern from 02-01; prevents build failure with placeholder credentials"
  - "ExtrasGrid and FormulesSection receive title/includesLabel as props from i18n (not hardcoded) — all strings translatable"
  - "visibleCategories filters categories with items.length > 0 before passing to MenuStickyNav — nav never shows empty categories"

patterns-established:
  - "Menu component pattern: all components accept locale prop + localized() for Sanity text; no hardcoded French strings"
  - "Sanity fetch try/catch in pages: same pattern as layout.tsx — parallel Promise.all wrapped in try/catch, fallback to empty arrays/null"

requirements-completed: [MENU-01, MENU-02, MENU-03, MENU-07, INTG-04]

# Metrics
duration: 11min
completed: 2026-02-23
---

# Phase 2 Plan 03: Menu Page Summary

**Full /[locale]/menu page with IntersectionObserver sticky sub-nav, dietary badge pills, localized menu items, extras grid, formules dotted-border cards, and eazee-link CTA — all Sanity-driven with try/catch fallback**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-23T01:13:58Z
- **Completed:** 2026-02-23T01:25:15Z
- **Tasks:** 2 of 2
- **Files modified:** 7

## Accomplishments

- Built complete menu component system: DietaryBadge, MenuItem, MenuCategory, MenuStickyNav — all locale-aware via localized()
- Built ExtrasGrid (compact 2-3 column price cards) and FormulesSection (dotted-border cards with included items list)
- Assembled full /[locale]/menu page route with parallel Sanity fetch, sticky nav, category sections, extras, formules, and eazee-link CTA

## Task Commits

Each task was committed atomically:

1. **Task 1: Build MenuStickyNav, MenuItem, DietaryBadge, MenuCategory components** - `66b2b18` (feat)
2. **Task 2: Build ExtrasGrid, FormulesSection and assemble menu page** - `52ce6b8` (feat)

## Files Created/Modified

- `src/components/menu/DietaryBadge.tsx` - Pill badges: vegetarian (green bg-green-100/text-green-800) and gluten-free (amber)
- `src/components/menu/MenuItem.tsx` - Menu item row: localized name, JP name span, price right-aligned in EUR, dietary badges, description
- `src/components/menu/MenuCategory.tsx` - Section with `id="category-{slug}"` for IntersectionObserver; renders null if no items
- `src/components/menu/MenuStickyNav.tsx` - `'use client'` sticky nav with IntersectionObserver tracking highest-visibility section
- `src/components/menu/ExtrasGrid.tsx` - Grid of extras cards; only renders if extras array is non-empty
- `src/components/menu/FormulesSection.tsx` - Dotted-border formule cards with included items bullet list; only renders if non-empty
- `src/app/[locale]/menu/page.tsx` - Async server page: parallel sanityFetch (3 queries + siteSettings), renders all menu sections

## Decisions Made

- Menu page wraps all `sanityFetch` calls in try/catch (consistent with layout.tsx pattern from 02-01) — build succeeds with placeholder Sanity credentials
- `ExtrasGrid` and `FormulesSection` receive `title`/`includesLabel` as i18n props (not hardcoded) — all strings translatable in fr/en/de
- `visibleCategories` filters out categories with zero items before passing to `MenuStickyNav` — sticky nav never shows empty category buttons

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Multiple `npx next build` commands ran in background simultaneously (from terminal history), causing `ENOENT: _buildManifest.js.tmp` race condition errors. The builds themselves were successful — TypeScript compilation and menu page route generation confirmed working (`npx tsc --noEmit` passes; `.next/server/app/[locale]/menu/page.js` exists). This is an environmental issue, not a code issue.

## User Setup Required

None - no external service configuration required at this stage.

## Next Phase Readiness

- Complete menu component system ready: DietaryBadge, MenuItem, MenuCategory, MenuStickyNav, ExtrasGrid, FormulesSection
- /[locale]/menu page route is fully implemented and will display data once Sanity credentials are configured
- Pattern established: try/catch around sanityFetch in pages for dev-time resilience
- Plan 02-04 (remaining pages: reservation, commander, histoire, infos, gallery) can build on established patterns

---
*Phase: 02-content-pages*
*Completed: 2026-02-23*

## Self-Check: PASSED

All required files verified present. All task commits verified in git history:
- `66b2b18` - Task 1: MenuStickyNav, MenuItem, DietaryBadge, MenuCategory components
- `52ce6b8` - Task 2: ExtrasGrid, FormulesSection, and menu page assembly
