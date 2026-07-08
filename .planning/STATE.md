---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Production go-live & umai-ramen.fr cutover
status: in_progress
stopped_at: Milestone v2.1 opened — defining requirements
last_updated: "2026-07-08T00:00:00.000Z"
last_activity: 2026-07-08 — Milestone v2.1 started (questioning done, writing artifacts)
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-08 after v2.1 milestone opening)

**Core value (v2.1):** Publish the new Next.js site on umai-ramen.fr (today the old GitHub Pages site) with complete production content and a controlled, low-risk domain/DNS cutover.
**Current focus:** v2.1 — go-live audit → content/debt → cutover. Target week of 2026-07-11.

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-07-08 — Milestone v2.1 started

Progress (v2.1): [░░░░░░░░░░] 0% (requirements being defined)

## Performance Metrics

**v2.1 velocity:** Not yet measured.

**v2.0 (IG Content Studio):** built + deployed on umai.turfu.in/ig-studio; not formally archived.

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

- RESOLVED: Google Drive auth — photos are already local (no Drive fetch needed)
- PENDING: umai_037.jpg classified as ambiance — appears to be an udon dish (not on summer ramen menu). Owner should review during pilot sign-off.
- PENDING: Pilot sign-off — owner must review contact-sheet.html and run `npm run signoff` to unblock --all

## Session Continuity

Last session: 2026-06-29T14:14:51.468Z
Stopped at: Completed 07-ig-studio-ui-05-PLAN.md
Resume: Owner reviews ig-studio/contact-sheet.html, applies corrections (override:true), runs `npm run signoff`, then confirms "approved" to continue Phase 04 → 04-02 Task 2 sign-off → Phase 05 compositing

### Key Decisions Added (v2.0 execution)

- LOCKED: Photos already local (ig-studio/photos/umai_001..081.jpg) — no Drive/OAuth needed (INGEST-01 satisfied)
- LOCKED: Summer menu KB (data/summer-menu-2026.json) is classification ground truth
- LOCKED: Pilot uses even-spread indices (not first-N) to sample full photo range
- LOCKED: classifier.js safe fallback: parse errors → ambiance (0.0 conf), batch never crashes
- LOCKED: KB slugs use hardcoded name→slug map for stability (no fragile accent-strip for variant names)
