# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Visitors can reserve a table or order food in one click, while experiencing UMAI's artisanal brand identity through professional photography and refined Japanese-inspired design.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 3 (Foundation)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-22 — Completed 01-01 (Next.js scaffold + next-intl v4 trilingual routing)

Progress: [█░░░░░░░░░] 11%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 4 min
- Total execution time: 4 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1/3 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min)
- Trend: —

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

### Pending Todos

None yet.

### Blockers/Concerns

- Gusty Click & Collect URL pending from owner — use Sanity placeholder, non-blocking
- Final photo selection from Nis&For 29-photo preselection pending — use placeholders in build
- Noto Sans JP kanji subset must be identified before Phase 1-03 to keep font bundle lean
- Sanity Studio CORS production config — add to Phase 3-03 checklist

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 01-01-PLAN.md (Next.js scaffold + trilingual routing verified)
Resume file: None
