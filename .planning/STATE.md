# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-29 after v2.0 milestone opening)

**Core value (v2.0):** From ~81 professional photos → batch-generate Instagram-ready posts with correct dish labels, Umaï branding, and FR captions; human override step for classification corrections.
**Current focus:** v2.0 Phase 04 — Ingestion & Classification (Pilot)

## Current Position

Phase: 04 — Ingestion & Classification (Pilot)
Plan: —  (plans not yet created — run `/gsd:plan-phase` to produce 04-01 plan)
Status: v2.0 milestone opened — Phase 04 ready to plan
Last activity: 2026-06-29 — v2.0 milestone opened (REQUIREMENTS.md + ROADMAP.md phases 04-07 authored)

Progress (v2.0): [░░░░░░░░░░] 0% (0/4 phases complete)

## Performance Metrics

**v2.0 velocity:** Not yet measured — Phase 04 not started.

**v1.0 history (archived):**
- Total plans completed: 11 across 3 phases
- Average duration: ~9 min/plan
- Total execution time: ~98 min
- Phase breakdown: 01-foundation 65min, 02-content-pages 43min, 03-seo-compliance ~30min

## Accumulated Context

### Key Decisions (v2.0)

- CLI first, web UI second — locked by owner (EK)
- Pilot ~10 photos before full 81-photo run — mandatory gate
- `claude-opus-4-8` for vision classification (quality), `claude-sonnet-4-6` for captions (cost)
- puppeteer-core + local Chrome render (no cloud render); sips for macOS resize
- Output tree: `ig-studio/out/{photo-id}/` — 3 PNGs + caption.txt
- Photo source: Google Drive `JPEG_72dpi` folder id `19JmEURV-XqcMm97jZwU7AV9uG7y6-t7M`
- Menu ground truth: Sanity project `c7twe801`, dataset `production`
- Brand tokens: ivoire `#F5F0E8`, vert `#77967A`; logo from `umai_logo_menu.svg` / `public/logo.svg`

### Key Decisions (v1.0 — carried)

Stack locked: Next.js 16.1.6, React 19.2, Sanity v5, next-intl v4.8.3, motion v12, Tailwind CSS 4.
Deployment: Docker standalone on VPS srv1417179 (valid 2027-02-23), multi-site Caddy, umai.turfu.in.

### Tech Debt (v1.0 — parked, not blocking v2.0)

- SEO-07: Footer NAP not wired to `seo.ts` constants
- PERF-05: First-load JS ~220KB > 150KB target (irreducible framework floor)
- bundle-analyzer: `@next/bundle-analyzer` not wired into `next.config.ts`

### Pending Todos (owner-side)

- Gusty Click & Collect URL — Sanity placeholder in place
- Final photo selection from Nis&For 29-photo preselection (for Sanity gallery)
- "Notre Histoire" text validation with Loan Nguyen
- EN/DE Sanity content translations
- DNS cutover: umai-ramen.fr → VPS
- Google Drive access credentials for ig-studio photo fetch (service account or OAuth)

### Blockers/Concerns

- Google Drive auth: ig-studio fetch requires Drive API credentials (service account JSON or OAuth token) — confirm method before Phase 04 execution.

## Session Continuity

Last session: 2026-06-29
Stopped at: v2.0 milestone opened — planning artifacts authored, no code written
Resume: run `/gsd:plan-phase` on Phase 04 to produce execution plans
