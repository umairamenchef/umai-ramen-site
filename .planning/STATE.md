# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Visitors can reserve a table or order food in one click, while experiencing UMAI's artisanal brand identity through professional photography and refined Japanese-inspired design.
**Current focus:** Phase 2 — Content Pages

## Current Position

Phase: 2 of 3 (Content Pages)
Plan: 4 of 5 in current phase (02-04 complete)
Status: In Progress
Last activity: 2026-02-23 — Completed 02-04 (Remaining content pages — Reservation, Commander, Notre Histoire, Infos, Gallery with lightbox)

Progress: [████████░░] 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 16 min
- Total execution time: 97 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 65 min | 21.7 min |
| 02-content-pages | 4/5 | 42 min | 10.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (5 min), 01-03 (56 min), 02-01 (7 min), 02-02 (10 min)
- Trend: 02-02 fast — all components server-side, TypeScript passed first try

| Phase 01-foundation P02 | 5 | 2 tasks | 16 files |

*Updated after each plan completion*
| Phase 01-foundation P03 | 56 | 3 tasks | 17 files |
| Phase 02-content-pages P01 | 7 | 3 tasks | 15 files |
| Phase 02-content-pages P02 | 10 | 2 tasks | 7 files |
| Phase 02-content-pages P03 | 11 | 2 tasks | 7 files |
| Phase 02-content-pages P04 | 14 | 3 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Stack locked — Next.js 16.1.6, React 19.2, Sanity v5, next-intl v4.8.3, motion v12, Tailwind CSS 4
- [Init]: i18n strategy — field-level localeString in Sanity (NOT @sanity/document-internationalization)
- [Init]: Middleware renamed to proxy.ts in Next.js 16 (not middleware.ts)
- [Init]: Animation package is `motion` (import from `motion/react`), NOT `framer-motion`
- [Init]: Tailwind configured via `@theme {}` in CSS, NOT tailwind.config.js
- [01-01]: proxy.ts exports `const proxy` (not default) per Next.js 16 breaking change
- [01-01]: localePrefix: always forces explicit /fr, /en, /de prefixes (/ redirects 307 to /fr)
- [01-01]: Root layout returns children only — locale layout owns html/body with lang attribute
- [01-01]: revalidate=60 on locale layout establishes ISR 60s baseline (FOUND-04)
- [Phase 01-02]: __experimental_actions removed — deprecated in Sanity v5; singleton enforced via structure.ts single documentId
- [Phase 01-02]: sanityFetch: tags.length > 0 sets revalidate=false (avoids mixing time + tag revalidation)
- [Phase 01-02]: TypeGen verification requires real Sanity credentials — predev/prebuild will fail gracefully without .env.local
- [Phase 01-foundation]: m from motion/react not motion/react-m — named m namespace exports animated HTML elements
- [Phase 01-foundation]: @theme inline block in Tailwind 4 prevents purging font utilities set by next/font at runtime
- [01-03]: LazyMotion domAnimation reduces motion bundle from ~34kb to ~4.6kb — all animated components must use m.* from motion/react-m
- [01-03]: Noto Sans JP preload:false — decorative-only font, lazy-load to protect LCP
- [01-03]: LanguageSwitcher shown on both desktop and mobile (was originally only on mobile, fixed during visual review)
- [Phase 02-content-pages]: SanityImageSource type imported from '@sanity/image-url' directly (v2 package root, not lib/types/types)
- [Phase 02-content-pages]: sanityFetch in root layout wrapped in try/catch — graceful fallback to '#' when Sanity credentials not configured
- [Phase 02-content-pages]: menuFormule.includedItems uses array of string (not localeString) — formule contents are format-specific, not translated
- [Phase 02-content-pages]: next/image uses loading=eager (not priority) for Hero — priority is deprecated in Next.js 16
- [Phase 02-content-pages]: NEXT_TURBOPACK_USE_WORKER=0 required for next build in WSL2 — Turbopack worker race condition on tmp buildManifest file creation
- [Phase 02-content-pages]: Menu page wraps all sanityFetch calls in try/catch — consistent with layout.tsx pattern from 02-01; prevents build failure with placeholder credentials
- [Phase 02-content-pages]: visibleCategories filters empty categories before passing to MenuStickyNav — sticky nav never shows empty category buttons
- [Phase 02-04]: Google Maps embed uses native HTML loading=lazy on iframe — simpler than JS-based lazy loading, works in server components
- [Phase 02-04]: GalleryGrid and GalleryLightbox merged into single client component — lightbox state (open/index) must be co-located with grid click handlers
- [Phase 02-04]: Commander clickCollectUrl null/empty shows 'Bientot disponible' text — clearer UX than disabled button while URL pending from owner
- [Phase 02-04]: createImageUrlBuilder named export replaces deprecated default export from @sanity/image-url

### Pending Todos

None yet.

### Blockers/Concerns

- Gusty Click & Collect URL pending from owner — use Sanity placeholder, non-blocking
- Final photo selection from Nis&For 29-photo preselection pending — use placeholders in build
- Sanity Studio CORS production config — add to Phase 3-03 checklist
- TypeGen requires real Sanity project credentials before `npm run typegen` can run

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 02-04-PLAN.md (Remaining content pages — Reservation, Commander, Notre Histoire, Infos, Gallery with lightbox)
Resume file: None
