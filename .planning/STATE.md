# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Visitors can reserve a table or order food in one click, while experiencing UMAI's artisanal brand identity through professional photography and refined Japanese-inspired design.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 3 (Foundation)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-23 — Completed 01-02 (Sanity v5 schemas, i18n, sanityFetch, TypeGen)

Progress: [██░░░░░░░░] 22%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 4.5 min
- Total execution time: 9 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/3 | 9 min | 4.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (5 min)
- Trend: stable

| Phase 01-foundation P02 | 5 | 2 tasks | 16 files |

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- Gusty Click & Collect URL pending from owner — use Sanity placeholder, non-blocking
- Final photo selection from Nis&For 29-photo preselection pending — use placeholders in build
- Sanity Studio CORS production config — add to Phase 3-03 checklist
- TypeGen requires real Sanity project credentials before `npm run typegen` can run

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 01-02-PLAN.md (Sanity v5 schemas, i18n, sanityFetch, TypeGen)
Resume file: None
