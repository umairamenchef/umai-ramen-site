---
phase: 02-content-pages
plan: 02
subsystem: ui
tags: [next-image, next-intl, tailwind-css-4, sanity, motion, groq, homepage, isr]

# Dependency graph
requires:
  - phase: 02-content-pages/02-01
    provides: urlFor helper, localized() utility, FadeInUp component, outline-white Button variant, HOMEPAGE_QUERY, all i18n namespaces, Sanity siteSettings URL injection

provides:
  - Hero component (fullscreen hero with next/image fill, loading=eager, catchphrase h1, primary/outline-white CTA buttons)
  - MenuPreview component (3 category photo cards with urlFor CDN URLs, links to /menu)
  - UspSection component (3 dotted-border proof blocks with inline SVG icons and FadeInUp scroll animations)
  - HistoireTeaser component (horizontal split placeholder + text + CTA to /notre-histoire, FadeInUp)
  - GalleryPreview component (2x3 photo grid with urlFor CDN URLs, max 6 photos, link to /galerie)
  - SocialSection component (Instagram SVG icon, handle, hashtag)
  - Complete homepage at /[locale]/ (fr/en/de) fetching HOMEPAGE_QUERY from Sanity with try/catch fallback
affects:
  - 02-03 (menu page — shares urlFor/localized patterns established here)
  - 02-04 (remaining pages — same GROQ fetch + try/catch pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Homepage assembly pattern: async server component fetches all data upfront, passes translated strings as props to child components — keeps Hero/MenuPreview/UspSection etc. as server components"
    - "Sanity data fallback: try/catch around sanityFetch in page.tsx — empty arrays for collections, fallback strings for catchphrase/URLs"
    - "Turbopack WSL2 workaround: NEXT_TURBOPACK_USE_WORKER=0 env var disables the build worker that causes race conditions writing tmp files in WSL2"

key-files:
  created:
    - src/components/home/Hero.tsx
    - src/components/home/MenuPreview.tsx
    - src/components/home/UspSection.tsx
    - src/components/home/HistoireTeaser.tsx
    - src/components/home/GalleryPreview.tsx
    - src/components/home/SocialSection.tsx
  modified:
    - src/app/[locale]/page.tsx

key-decisions:
  - "next/image uses loading=eager (not priority) for Hero — priority is deprecated in Next.js 16"
  - "Homepage data typed inline in page.tsx with SanityImageSource cast via unknown — avoids complex generated type import when Sanity credentials not configured"
  - "UspSection receives full bg-umai-bg-alt section background — pulled outside max-width container in page.tsx for full-width color stripe effect"
  - "NEXT_TURBOPACK_USE_WORKER=0 required for next build to succeed in WSL2 — Turbopack worker creates tmp files in a directory path that doesn't exist yet (race condition)"

patterns-established:
  - "Server component data flow: page.tsx fetches all Sanity data + translations, passes as props to leaf components — zero client components on homepage"
  - "Inline type annotation for Sanity query results: typed directly in page.tsx rather than importing generated types — simpler when TypeGen requires real credentials"

requirements-completed: [HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, HOME-07, INTG-01, INTG-02, INTG-06]

# Metrics
duration: 10min
completed: 2026-02-23
---

# Phase 2 Plan 02: Homepage Summary

**Complete homepage at /fr, /en, /de with fullscreen hero (catchphrase + Reserve/Commander CTAs), 3 menu preview cards, 3 USP dotted-border blocks, Notre Histoire teaser, gallery grid, and Instagram social section — all driven by HOMEPAGE_QUERY Sanity data with i18n text**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-23T01:14:10Z
- **Completed:** 2026-02-23T01:24:52Z
- **Tasks:** 2 of 2
- **Files modified:** 7

## Accomplishments

- Built all 6 homepage section components (Hero, MenuPreview, UspSection, HistoireTeaser, GalleryPreview, SocialSection) as server components with typed props
- Assembled complete homepage at `src/app/[locale]/page.tsx` fetching HOMEPAGE_QUERY, extracting settings/menuCategories/galleryPreview, passing translated strings as props
- Build succeeds for all 3 locale routes (fr/en/de) as SSG with ISR 60s revalidation — all hero CTAs link externally with target=_blank

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Hero, MenuPreview, and UspSection components** - `0ca3913` (feat)
2. **Task 2: Build HistoireTeaser, GalleryPreview, SocialSection and assemble the homepage** - `0d2f6f3` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `src/components/home/Hero.tsx` - Fullscreen hero with next/image fill, loading=eager, overlay, catchphrase h1, primary/outline-white CTA buttons
- `src/components/home/MenuPreview.tsx` - 3 category cards with photo backgrounds via urlFor, SectionHeader, link to /menu
- `src/components/home/UspSection.tsx` - 3 dotted-border proof blocks (border-dashed border-umai-line) with inline SVG icons and FadeInUp stagger animations
- `src/components/home/HistoireTeaser.tsx` - Horizontal split with photo placeholder + text + Button variant=outline CTA to /notre-histoire, wrapped in FadeInUp
- `src/components/home/GalleryPreview.tsx` - 2x3 photo grid with urlFor CDN URLs (max 6), SectionHeader, Link to /galerie
- `src/components/home/SocialSection.tsx` - Centered section with Instagram SVG icon, @umai_ramen_strasbourg handle, hashtag from i18n
- `src/app/[locale]/page.tsx` - Complete homepage assembly: HOMEPAGE_QUERY fetch with try/catch fallback, getTranslations for home+common namespaces, all 6 sections rendered in order

## Decisions Made

- `loading="eager"` used on Hero Image instead of `priority` — `priority` is deprecated in Next.js 16; `loading="eager"` achieves same LCP optimization
- Inline TypeScript annotation for Sanity query result in page.tsx using `SanityImageSource` cast via `unknown` — avoids needing generated types that require real Sanity credentials to produce
- UspSection rendered outside the max-width container wrapper in page.tsx to allow full-width `bg-umai-bg-alt` background stripe — hero is also outside the wrapper for fullscreen effect
- `NEXT_TURBOPACK_USE_WORKER=0` env var discovered as required for Turbopack builds in WSL2 — without it, Turbopack spawns a worker that creates tmp files at a path that doesn't exist yet (race condition in directory creation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type incompatibility: Sanity query result `unknown` image not assignable to `SanityImageSource`**
- **Found during:** Task 2 (TypeScript verification after page.tsx assembly)
- **Issue:** Inline type annotation used `unknown` for image fields in homepageData type, but MenuPreview and GalleryPreview components expect `SanityImageSource` — TypeScript error TS2322
- **Fix:** Changed `image?: unknown` to `image?: SanityImageSource` in inline type annotation; added cast `result as unknown as typeof homepageData` to allow Sanity's inferred type through
- **Files modified:** `src/app/[locale]/page.tsx`
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** `0d2f6f3` (Task 2 commit)

**2. [Rule 3 - Blocking] Turbopack build fails in WSL2 with ENOENT on tmp buildManifest file**
- **Found during:** Task 2 (next build verification)
- **Issue:** `npx next build` fails with `ENOENT: no such file or directory, open '.next/static/{HASH}/_buildManifest.js.tmp.{random}'` — Turbopack worker creates tmp file path before the parent directory exists (race condition in WSL2 filesystem)
- **Fix:** Discovered `NEXT_TURBOPACK_USE_WORKER=0` env var disables the problematic worker, allowing build to complete successfully in same-process mode
- **Files modified:** None (environment variable workaround only)
- **Verification:** `NEXT_TURBOPACK_USE_WORKER=0 npx next build` succeeds — all routes (fr/en/de) built as SSG ● with ISR 60s
- **Committed in:** `0d2f6f3` (noted in commit message)

---

**Total deviations:** 2 auto-fixed (1x Rule 1 - Bug, 1x Rule 3 - Blocking)
**Impact on plan:** Both fixes necessary for TypeScript correctness and build success. No scope creep.

## Issues Encountered

- Turbopack build in WSL2 environment fails consistently with ENOENT race condition on tmp buildManifest files — resolved with `NEXT_TURBOPACK_USE_WORKER=0` environment variable. This should be documented for all future builds in this environment.
- `@sanity/image-url` deprecation warning for default export during build — does not affect runtime, warning comes from library internals not our code (image.ts correctly uses `createImageUrlBuilder` named export)

## User Setup Required

None - no external service configuration required at this stage. To see homepage with real data: configure Sanity credentials in `.env.local` (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`). Use `NEXT_TURBOPACK_USE_WORKER=0 npx next build` for production builds in WSL2.

## Next Phase Readiness

- Homepage fully assembled at /fr, /en, /de — all 6 sections render with Sanity data or graceful fallbacks
- All hero CTAs use external links correctly (target=_blank, rel=noopener noreferrer) via Button variant=outline-white
- Component patterns (server components, props-based translations, urlFor CDN URLs) ready for plan 02-03 (menu page)
- Plan 02-03 and 02-04 can reuse Hero/section layout patterns without conflicts

---
*Phase: 02-content-pages*
*Completed: 2026-02-23*

## Self-Check: PASSED

All required files verified present. All task commits verified in git history:
- `0ca3913` - Task 1: Hero, MenuPreview, and UspSection components
- `0d2f6f3` - Task 2: HistoireTeaser, GalleryPreview, SocialSection, homepage assembly
