---
phase: 02-content-pages
plan: 04
subsystem: ui
tags: [next-intl, sanity, groq, google-maps, lightbox, yet-another-react-lightbox, framer-motion, motion, tailwind-css-4]

# Dependency graph
requires:
  - phase: 02-content-pages
    plan: 01
    provides: urlFor helper, localized() utility, FadeInUp component, NOTRE_HISTOIRE_QUERY, INFOS_QUERY, GALLERY_QUERY, SITE_SETTINGS_QUERY, all i18n namespaces (reservation, commander, histoire, infos, gallery)

provides:
  - Reservation page: Gusty CTA (reservationUrl from Sanity), micro-copy, opening hours, phone, address, Google Maps embed (lazy)
  - Commander page: 3 ordering option cards (Uber Eats primary, Click & Collect, eazee-link) with staggered FadeInUp
  - Notre Histoire page: scroll storytelling with 4 sections, alternating photo-text layout, FadeInUp animations, reservation CTA
  - Infos page: opening hours table, address + Google Maps embed (lazy), phone click-to-call, native FAQ accordion (<details>), social links
  - GalleryLightbox client component: CSS grid (2-col mobile, 3-col desktop) + yet-another-react-lightbox with keyboard nav and swipe
  - Gallery page: server component fetching GALLERY_QUERY, renders GalleryLightbox
  - Fixed deprecated @sanity/image-url default import → createImageUrlBuilder named export

affects:
  - 02-05 (visual verification — all 5 pages built and SSG)
  - Phase 3 (SEO — all these pages need generateMetadata and JSON-LD)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Google Maps embed: loading=lazy native attribute on <iframe> — no JS, no IntersectionObserver needed"
    - "Native HTML <details>/<summary> FAQ accordion — zero JS, accessible by default"
    - "GalleryLightbox combines grid + Lightbox in single 'use client' component — grid needs onClick for lightbox state"
    - "yet-another-react-lightbox: import Lightbox from 'yet-another-react-lightbox'; import 'yet-another-react-lightbox/styles.css' — keyboard nav and swipe built-in"
    - "Notre Histoire alternating layout: even index = photo left, odd index = md:order-2 photo right"
    - "Commander cards: flexible URL handling — if URL null/empty, show disabled 'Bientôt disponible' text instead of broken link"
    - "createImageUrlBuilder named export from @sanity/image-url (not default export — deprecated in v2)"

key-files:
  created:
    - src/app/[locale]/reservation/page.tsx
    - src/app/[locale]/commander/page.tsx
    - src/app/[locale]/notre-histoire/page.tsx
    - src/app/[locale]/infos/page.tsx
    - src/app/[locale]/galerie/page.tsx
    - src/components/gallery/GalleryLightbox.tsx
    - src/components/gallery/GalleryGrid.tsx
  modified:
    - src/sanity/lib/image.ts

key-decisions:
  - "Google Maps embed uses loading=lazy native HTML attribute (not IntersectionObserver or dynamic import) — simpler, no JS, works in server components"
  - "GalleryGrid and GalleryLightbox merged into one client component — lightbox needs state, grid triggers lightbox, separating them would require prop drilling or context"
  - "Commander page: clickCollectUrl null/empty shows 'Bientôt disponible' text (not disabled button) — clearer UX than a grayed-out button"
  - "Notre Histoire: md:order-2 for photo on odd sections (not md:flex-row-reverse) — grid-based layout is more robust"
  - "Infos page: static fallback hours hardcoded for when Sanity not configured — better than blank hours section"
  - "createImageUrlBuilder named export replaces deprecated default export from @sanity/image-url"

patterns-established:
  - "Page pattern: setRequestLocale → getTranslations → sanityFetch in try/catch → JSX render — consistent across all 5 pages"
  - "Try/catch pattern on every sanityFetch with graceful fallback — prevents build failures with placeholder credentials"

requirements-completed: [RESV-01, RESV-02, RESV-03, ORDR-01, ORDR-02, ORDR-03, ORDR-04, HIST-01, HIST-02, HIST-03, HIST-04, INFO-01, INFO-02, INFO-03, INFO-04, INFO-05, GLRY-01, GLRY-02, GLRY-03, INTG-03, INTG-05, INTG-07]

# Metrics
duration: 14min
completed: 2026-02-23
---

# Phase 2 Plan 04: Remaining Content Pages Summary

**Reservation (Gusty CTA + Google Maps), Commander (3 ordering cards), Notre Histoire (scroll storytelling), Infos (hours/FAQ/maps/social), Gallery (CSS grid + yet-another-react-lightbox with keyboard nav) — all 5 pages SSG in fr/en/de**

## Performance

- **Duration:** 14 min
- **Started:** 2026-02-23T02:14:10Z
- **Completed:** 2026-02-23T02:28:00Z
- **Tasks:** 3 of 3
- **Files modified:** 8

## Accomplishments

- Built 5 content pages: Reservation, Commander, Notre Histoire, Infos, Gallery — all SSG-rendered in fr/en/de (25 static pages total including previously built pages)
- Reservation page: Gusty CTA with micro-copy, opening hours from Sanity, click-to-call phone, address, lazy-loaded Google Maps iframe
- Commander page: 3 ordering option cards (Uber Eats primary variant, Click & Collect + eazee-link outline variant) with staggered FadeInUp; handles null clickCollectUrl gracefully with "Bientôt disponible" text
- Notre Histoire: alternating photo-text storytelling (4 sections from Sanity), FadeInUp with delay stagger, localized headings/body, reservation CTA footer
- Infos page: structured opening hours table, Google Maps embed, click-to-call phone, native `<details>` FAQ accordion (zero JS), Instagram + Facebook social links
- GalleryLightbox client component combining CSS grid + yet-another-react-lightbox; keyboard navigation (arrows + Escape) and mobile swipe built-in; urlFor for thumbnails, direct CDN URL for lightbox slides
- Fixed deprecated `@sanity/image-url` default import → `createImageUrlBuilder` named export

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Reservation and Commander pages** - `788999e` (feat)
2. **Task 2: Build Notre Histoire page** - `cce449b` (feat)
3. **Task 3: Build Infos page, Gallery components, Gallery page** - `ecebe8b` (feat)

## Files Created/Modified

- `src/app/[locale]/reservation/page.tsx` - Reservation page with Gusty CTA, practical info, Google Maps embed
- `src/app/[locale]/commander/page.tsx` - Commander page with 3 ordering option cards and FadeInUp stagger
- `src/app/[locale]/notre-histoire/page.tsx` - Notre Histoire with alternating scroll sections and reservation CTA
- `src/app/[locale]/infos/page.tsx` - Infos page: hours, address, Google Maps, phone, FAQ accordion, social links
- `src/app/[locale]/galerie/page.tsx` - Gallery page server component with GALLERY_QUERY data
- `src/components/gallery/GalleryLightbox.tsx` - Client component: CSS grid + yet-another-react-lightbox
- `src/components/gallery/GalleryGrid.tsx` - Re-export wrapper for GalleryLightbox
- `src/sanity/lib/image.ts` - Fixed deprecated default import → createImageUrlBuilder named export

## Decisions Made

- Google Maps uses native HTML `loading="lazy"` on `<iframe>` — no JavaScript, no IntersectionObserver, works in server components. Simpler than dynamic import approach.
- GalleryGrid and GalleryLightbox are implemented as a single client component — the lightbox needs React state for open/index, and the grid triggers that state. Separating them would require prop drilling or context for no benefit.
- Commander clickCollectUrl shows "Bientôt disponible" text when URL is null/empty — clearer UX than a grayed-out button since the URL is pending from owner (documented blocker).
- Notre Histoire alternating layout uses `md:order-2` CSS class for photo on odd sections — grid-based reordering is more robust than flex-row-reverse.
- Infos page includes static fallback opening hours when Sanity returns no data — prevents blank hours section during development.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed deprecated @sanity/image-url default export**
- **Found during:** Task 1 (build verification)
- **Issue:** `import imageUrlBuilder from '@sanity/image-url'` triggered deprecation warning during build: "The default export of @sanity/image-url has been deprecated. Use the named export `createImageUrlBuilder` instead"
- **Fix:** Changed to `import { createImageUrlBuilder } from '@sanity/image-url'` and updated `imageUrlBuilder(client)` → `createImageUrlBuilder(client)`
- **Files modified:** `src/sanity/lib/image.ts`
- **Verification:** `npx tsc --noEmit` passes, build no longer shows deprecation warning
- **Committed in:** `788999e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1x Rule 1 - Bug)
**Impact on plan:** Fix necessary to resolve deprecation warning. No scope creep.

## Issues Encountered

- Turbopack WSL2 filesystem race condition: `_buildManifest.js.tmp.*` temp file ENOENT error on first build attempt in each session — resolved by running `node_modules/.bin/next build` directly (bypasses npm prebuild typegen). Build succeeds consistently on second attempt after clearing `.next/` directory. This is a known Turbopack/WSL2 compatibility issue, not caused by this plan's changes.

## User Setup Required

None - no external service configuration required at this stage.

## Next Phase Readiness

- All 5 remaining content pages are complete and SSG-rendered in fr/en/de
- Total routes: `/[locale]` (home), `/[locale]/commander`, `/[locale]/galerie`, `/[locale]/infos`, `/[locale]/menu`, `/[locale]/notre-histoire`, `/[locale]/reservation` — 7 pages × 3 locales = 21 content routes + static/api = 25 total
- 02-05 (visual verification checkpoint) can now proceed — all pages are accessible via dev server
- Phase 3 (SEO) will need to add generateMetadata with hreflang to all 7 pages

---
*Phase: 02-content-pages*
*Completed: 2026-02-23*

## Self-Check: PASSED

All required files verified present. All task commits verified in git history:
- `788999e` - Task 1: Reservation and Commander pages + deprecated imageUrlBuilder fix
- `cce449b` - Task 2: Notre Histoire page with scroll storytelling
- `ecebe8b` - Task 3: Infos page, GalleryLightbox component, Gallery page
