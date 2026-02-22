---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [next.js, next-intl, typescript, tailwind-css-4, i18n, isr, sanity]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with TypeScript, App Router, src/ directory
  - Trilingual locale routing via next-intl v4 (fr/en/de, fr as default)
  - src/proxy.ts locale middleware (Next.js 16 renamed from middleware.ts)
  - ISR baseline with revalidate 60s on all locale layouts
  - Webhook stub at /api/revalidate returning 501 (full impl in Phase 3)
  - Translation dictionaries for fr, en, de
  - Sanity image CDN configured in next.config.ts
affects:
  - 01-02 (sanity schema)
  - 01-03 (design system)
  - 02 (all content phases)
  - 03 (CMS integration, revalidate endpoint)

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - react@19.2.3
    - next-intl@4.8.3
    - next-sanity@12.1.0
    - sanity@5.11.0
    - "@sanity/vision@5.11.0"
    - motion@12.34.3
    - tailwindcss@4
    - "@tailwindcss/postcss@4"
  patterns:
    - Tailwind 4 CSS-first config via @import "tailwindcss" (no tailwind.config.js)
    - Next.js 16 proxy.ts middleware with named export const proxy
    - next-intl v4 async params pattern (await params in async server components)
    - setRequestLocale called before any next-intl API (static rendering requirement)
    - generateStaticParams returns all locales for ISR static prerendering
    - Root layout returns children only (locale layout handles html/body with lang attr)

key-files:
  created:
    - src/proxy.ts
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - src/i18n/navigation.ts
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/app/api/revalidate/route.ts
    - .env.example
  modified:
    - next.config.ts
    - src/app/globals.css
    - src/app/layout.tsx
    - package.json

key-decisions:
  - "proxy.ts not middleware.ts — Next.js 16 breaking change, export named proxy not default"
  - "localePrefix: always ensures all locales have explicit URL prefix (/ redirects to /fr)"
  - "revalidate=60 on locale layout establishes ISR baseline; matches requirement FOUND-04"
  - "Root layout returns children only — locale layout owns html/body for correct lang attribute"

patterns-established:
  - "Locale layout pattern: async params + setRequestLocale + generateStaticParams + ISR revalidate"
  - "Translation namespace pattern: common (UI) and page-specific (home, menu, etc.)"
  - "next-intl navigation wrappers via src/i18n/navigation.ts for typed locale-aware routing"

requirements-completed: [FOUND-01, FOUND-03, FOUND-04, FOUND-07]

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 1 Plan 01: Next.js 16 Scaffold with Trilingual next-intl v4 Routing Summary

**Next.js 16 project with App Router, Tailwind CSS 4, and next-intl v4 routing serving /fr, /en, /de as ISR static pages with proxy.ts middleware**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-22T22:57:50Z
- **Completed:** 2026-02-22T23:02:21Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Next.js 16 project scaffolded with TypeScript, App Router, Tailwind CSS 4, and all required dependencies (next-sanity, sanity, next-intl, motion)
- Trilingual locale routing configured: /fr (default), /en, /de — all prerendered as static ISR pages with 60s revalidation
- proxy.ts locale middleware established (Next.js 16 breaking change: renamed from middleware.ts, named export)
- Webhook stub at /api/revalidate returns 501 with stub message (full HMAC + revalidateTag in Phase 3)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Next.js 16 project scaffold with Tailwind CSS 4 and all dependencies** - `ff9ecfc` (chore)
2. **Task 2: Configure next-intl v4 trilingual routing with proxy.ts and locale layouts** - `4508d8f` (feat)

## Files Created/Modified

- `src/proxy.ts` - Locale middleware with createMiddleware(routing), exports const proxy (Next.js 16)
- `src/i18n/routing.ts` - defineRouting with fr/en/de locales, defaultLocale fr, localePrefix always
- `src/i18n/request.ts` - getRequestConfig loading locale-specific message JSON
- `src/i18n/navigation.ts` - Typed Link, redirect, usePathname, useRouter, getPathname wrappers
- `src/messages/fr.json` - French translations (common, home namespaces)
- `src/messages/en.json` - English translations (common, home namespaces)
- `src/messages/de.json` - German translations (common, home namespaces)
- `src/app/[locale]/layout.tsx` - Locale layout with async params, setRequestLocale, generateStaticParams, revalidate=60
- `src/app/[locale]/page.tsx` - Placeholder homepage with useTranslations('home')
- `src/app/api/revalidate/route.ts` - POST stub returning 501 (FOUND-07 placeholder)
- `next.config.ts` - withNextIntl plugin + Sanity CDN image remotePatterns
- `src/app/globals.css` - Minimal @import "tailwindcss" only (design tokens in Plan 01-03)
- `src/app/layout.tsx` - Minimal root layout returning children (no html/body)
- `.env.example` - Sanity env var placeholders (NEXT_PUBLIC_SANITY_PROJECT_ID, DATASET, REVALIDATE_SECRET)

## Decisions Made

- Used temporary directory for `create-next-app` then rsync to project directory (existing planning files caused conflict with create-next-app)
- Confirmed proxy.ts exports `const proxy` (not `default`) per Next.js 16 middleware rename
- Updated .gitignore to allow `.env.example` while keeping `.env.local` and `.env*.local` ignored

## Deviations from Plan

None — plan executed exactly as written. The only minor variance: locale routes show as `●` (SSG with generateStaticParams) rather than `○` (purely static) in build output, which is correct behavior for ISR pages using `generateStaticParams` + `revalidate`. This is expected and matches the plan's intent.

## Issues Encountered

- `create-next-app` refused to run in the project directory due to existing files (.planning/, photos/, etc.). Resolved by scaffolding to /tmp/umai-scaffold and rsyncing files back. No data loss.

## User Setup Required

None - no external service configuration required at this stage. Sanity project ID will be needed in Plan 01-02.

## Next Phase Readiness

- Next.js 16 scaffold is fully buildable (`next build` passes with zero errors)
- All three locale routes (/fr, /en, /de) serve correct translated content with proper lang attributes
- ISR foundation established at 60s revalidation on all locale pages
- Sanity image CDN and next-intl plugin configured in next.config.ts
- Ready for Plan 01-02: Sanity schema and studio configuration

## Self-Check: PASSED

All required files exist, all commits verified, all key code patterns confirmed.

---
*Phase: 01-foundation*
*Completed: 2026-02-22*
