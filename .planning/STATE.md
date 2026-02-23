# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Visitors can reserve a table or order food in one click, while experiencing UMAI's artisanal brand identity through professional photography and refined Japanese-inspired design.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 3 (Foundation)
Plan: 3 of 3 in current phase
Status: Complete
Last activity: 2026-02-23 — Completed 01-03 (Design system, layout components, visual verification approved)

Progress: [███░░░░░░░] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 21.7 min
- Total execution time: 65 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 65 min | 21.7 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (5 min), 01-03 (56 min)
- Trend: 01-03 longer due to visual verification checkpoint

| Phase 01-foundation P02 | 5 | 2 tasks | 16 files |

*Updated after each plan completion*
| Phase 01-foundation P03 | 56 | 3 tasks | 17 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

- Gusty Click & Collect URL pending from owner — use Sanity placeholder, non-blocking
- Final photo selection from Nis&For 29-photo preselection pending — use placeholders in build
- Sanity Studio CORS production config — add to Phase 3-03 checklist
- TypeGen requires real Sanity project credentials before `npm run typegen` can run

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 01-03-PLAN.md (Design system, layout components, visual verification approved)
Resume file: None
