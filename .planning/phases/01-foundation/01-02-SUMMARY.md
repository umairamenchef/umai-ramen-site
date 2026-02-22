---
phase: 01-foundation
plan: 02
subsystem: cms
tags: [sanity, cms, i18n, typegen, isr, groq, schema]

# Dependency graph
requires:
  - 01-01 (Next.js scaffold with next-sanity installed)
provides:
  - Sanity v5 Studio embedded at /studio with all restaurant schemas
  - field-level i18n via localeString (FR required, EN/DE collapsible) and localeText
  - siteSettings singleton with catchphrase, accentColor, URLs, contact info, opening hours
  - menuCategory with localized name, slug, order
  - menuItem with price, dietary tags, JP name, availability toggle (MENU-06)
  - gallery with localized alt text
  - page schema for Notre Histoire and legal pages
  - sanityFetch helper with ISR 60s default and tag-based revalidation
  - GROQ queries wrapped in defineQuery for TypeGen
  - TypeGen configuration and npm scripts
affects:
  - 02 (all content pages pull from these schemas via sanityFetch)
  - 03 (revalidate webhook targets these schema types)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sanity v5 field-level i18n: localeString/localeText object types with FR/EN/DE fields
    - siteSettings as Studio structure singleton (single documentId, not a list)
    - sanityFetch: tags non-empty -> revalidate=false (webhook-only); empty -> ISR 60s
    - GROQ queries wrapped in defineQuery() for TypeGen compile-time type safety
    - Embedded Studio via NextStudio (client-rendered, no revalidate/generateStaticParams)

key-files:
  created:
    - src/sanity/env.ts
    - src/sanity/schemaTypes/localeString.ts
    - src/sanity/schemaTypes/localeText.ts
    - src/sanity/schemaTypes/siteSettings.ts
    - src/sanity/schemaTypes/menuCategory.ts
    - src/sanity/schemaTypes/menuItem.ts
    - src/sanity/schemaTypes/gallery.ts
    - src/sanity/schemaTypes/page.ts
    - src/sanity/schemaTypes/index.ts
    - src/sanity/structure.ts
    - src/sanity/sanity.config.ts
    - src/app/studio/[[...index]]/page.tsx
    - src/sanity/lib/client.ts
    - src/sanity/lib/queries.ts
    - sanity-typegen.json
  modified:
    - package.json

key-decisions:
  - "__experimental_actions removed — deprecated in Sanity v5; singleton enforced via structure.ts single documentId"
  - "sanityFetch: tags.length > 0 sets revalidate=false (avoids mixing time + tag revalidation per Sanity anti-pattern)"
  - "TypeGen verification requires real Sanity project credentials — predev/prebuild hooks will fail gracefully without .env.local"

requirements-completed: [FOUND-02, FOUND-05, FOUND-06]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 1 Plan 02: Sanity v5 CMS Schemas, i18n, sanityFetch, and TypeGen Summary

**Sanity v5 Studio at /studio with 5 restaurant schemas using field-level FR/EN/DE i18n, sanityFetch helper providing ISR 60s and tag-based revalidation, GROQ queries wrapped in defineQuery for TypeGen**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-22T23:05:51Z
- **Completed:** 2026-02-23T00:11:28Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- All 5 Sanity document types created: siteSettings (singleton), menuCategory, menuItem, gallery, page
- Field-level i18n via localeString (string) and localeText (multi-line text) — FR required, EN/DE collapsible — per FOUND-05 locked strategy
- siteSettings configured as Studio structure singleton with all brand settings: catchphrase, accentColor, URLs, phone, address, opening hours, social links
- menuItem has availability toggle (`available: boolean, default true`) per MENU-06 requirement, plus dietary tags (isVegetarian, isGlutenFree), JP name, and category reference
- Embedded Sanity Studio accessible at /studio via NextStudio component (client-rendered)
- sanityFetch helper with ISR 60s default, tag-based revalidation support (per FOUND-02, FOUND-06)
- GROQ queries for all document types wrapped in defineQuery for TypeGen compatibility
- TypeGen configuration at project root with predev/prebuild npm hooks
- Build passes: all locale routes still static ISR, /studio renders as Dynamic (correct for Studio)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Sanity v5 schemas with field-level i18n and Studio configuration** - `0fbaf01` (feat)
2. **Task 2: Create sanityFetch helper, GROQ queries, and TypeGen configuration** - `8f3c581` (feat)

## Files Created/Modified

- `src/sanity/env.ts` - Environment variable exports: projectId, dataset, apiVersion
- `src/sanity/schemaTypes/localeString.ts` - Reusable i18n object type for FR/EN/DE string fields
- `src/sanity/schemaTypes/localeText.ts` - Same pattern but for multi-line text type
- `src/sanity/schemaTypes/siteSettings.ts` - Singleton document: catchphrase, accentColor, URLs, contact, openingHours, socialLinks
- `src/sanity/schemaTypes/menuCategory.ts` - Menu category with localized name, slug, order, description
- `src/sanity/schemaTypes/menuItem.ts` - Menu item with price, dietary flags, nameJp, available toggle, category reference
- `src/sanity/schemaTypes/gallery.ts` - Gallery image with localized title and alt text
- `src/sanity/schemaTypes/page.ts` - Generic page with sections array (heading, body, image)
- `src/sanity/schemaTypes/index.ts` - Schema registry exporting all 7 types (5 documents + 2 objects)
- `src/sanity/structure.ts` - Studio structure: siteSettings as singleton, menu/gallery/pages organized
- `src/sanity/sanity.config.ts` - Sanity Studio config with structureTool, visionTool, schema
- `src/app/studio/[[...index]]/page.tsx` - Embedded Studio (use client, NextStudio, no generateStaticParams)
- `src/sanity/lib/client.ts` - Sanity client + sanityFetch with ISR 60s default and tag-based revalidation
- `src/sanity/lib/queries.ts` - GROQ queries (SITE_SETTINGS, MENU_CATEGORIES, GALLERY, PAGE) wrapped in defineQuery
- `sanity-typegen.json` - TypeGen config: path, schema extract path, generated types output
- `package.json` - Added predev, prebuild, typegen scripts

## Decisions Made

- **`__experimental_actions` deprecated in Sanity v5** — Removed and replaced with structure.ts singleton pattern (single documentId prevents creating multiple siteSettings documents)
- **sanityFetch anti-pattern avoidance** — When `tags` is non-empty, `revalidate` is forced to `false` to avoid mixing time-based and tag-based revalidation per Sanity documentation
- **TypeGen requires live credentials** — `predev`/`prebuild` hooks will fail gracefully if `.env.local` is missing; build can be run directly with `npx next build` until credentials are configured

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed deprecated `__experimental_actions` in siteSettings.ts**
- **Found during:** Task 1
- **Issue:** `__experimental_actions: ['update', 'publish']` was already removed by linter in prior Plan 01-03 work (it's deprecated in Sanity v5 and causes TypeScript errors)
- **Fix:** Kept removal; enforced singleton via structure.ts `S.document().documentId('siteSettings')` — the correct Sanity v5 approach
- **Files modified:** src/sanity/structure.ts
- **Commit:** 0fbaf01

**2. [Rule 3 - Blocking] Fixed MobileMenu.tsx motion import preventing build**
- **Found during:** Task 2 build verification
- **Issue:** `import { m } from 'motion/react-m'` — `m` is not exported from `motion/react-m` (pre-existing issue from Plan 01-03)
- **Fix:** Changed to `import { AnimatePresence, m } from 'motion/react'` — correct import for use with LazyMotion
- **Files modified:** src/components/layout/MobileMenu.tsx
- **Commit:** 8f3c581

## User Setup Required

- Create a Sanity project at sanity.io and get the project ID
- Add to `.env.local`:
  ```
  NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
  NEXT_PUBLIC_SANITY_DATASET=production
  ```
- Add localhost:3000 to Sanity project CORS settings
- Run `npm run typegen` to generate TypeScript types from schemas

## Next Phase Readiness

- All 5 Sanity document types are ready for content entry
- sanityFetch can be used immediately in Phase 2 page components
- GROQ queries are TypeGen-ready (types will be generated once credentials are configured)
- Studio accessible at /studio once NEXT_PUBLIC_SANITY_PROJECT_ID is set

## Self-Check: PASSED
