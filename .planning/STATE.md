---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Production go-live & umai-ramen.fr cutover
status: in_progress
stopped_at: Roadmap v2.1 created — Phase 08 is next to plan
last_updated: "2026-07-08T00:00:00.000Z"
last_activity: 2026-07-08 — Roadmap v2.1 written (phases 08–11, 24 requirements mapped)
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

Phase: **08 — Audit go-live & gap analysis** (next to plan)
Plan: —
Status: Ready to plan Phase 08
Last activity: 2026-07-08 — Roadmap v2.1 created (ROADMAP.md phases 08–11 written)

Progress (v2.1): [░░░░░░░░░░] 0% (0/4 phases complete)

Next action: `/gsd:plan-phase 8`

## Performance Metrics

**v2.1 velocity:** Not yet measured.

**v2.0 (IG Content Studio):** built + deployed on umai.turfu.in/ig-studio; not formally archived.

**v1.0 history (archived):**

- Total plans completed: 11 across 3 phases
- Average duration: ~9 min/plan
- Total execution time: ~98 min
- Phase breakdown: 01-foundation 65min, 02-content-pages 43min, 03-seo-compliance ~30min

## Accumulated Context

### Key Decisions (v2.1)

- Phases 09 and 10 are unblocked in parallel once Phase 08 produces the gap list (content audit → 09, blocking bugs → 10)
- Phase 11 is the go-live gate — requires 08 (cutover dossier), 09 (content complete), 10 (blocking debt cleared)
- Short maintenance window acceptable; rollback = revert DNS (apex A + www) to GitHub Pages IPs `185.199.10x.153`
- Sanity dataset: `c7twe801/production` — all content changes go directly to production dataset
- GitHub: `umairamenchef/umai-ramen-site`, branch `v2-2026`
- Target: week of 2026-07-11

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

### Tech Debt (v1.0 — addressed in Phase 10)

- SEO-07: Footer NAP not wired to `seo.ts` constants → DEBT-01
- PERF-05: First-load JS ~220KB > 150KB target (irreducible framework floor) → DEBT-03
- bundle-analyzer: `@next/bundle-analyzer` not wired into `next.config.ts` → DEBT-02

### Pending Todos (owner-side)

- Photo assets from EK: progressively from 2026-07-09 (hero + gallery, from JPEG_72dpi Google Drive)
- Summer menu ground truth from Loan Nguyen — verify dishes/prices/tags against in-restaurant reality
- Notre Histoire text validation with Loan Nguyen
- EN/DE Sanity content translations
- DNS cutover decision: TTL lowering timing, maintenance window announcement

### Blockers/Concerns

- RESOLVED: Google Drive auth — photos are already local (no Drive fetch needed for ig-studio)
- PENDING: umai_037.jpg classified as ambiance — appears to be an udon dish (not on summer ramen menu). Owner should review during pilot sign-off.
- PENDING: Pilot sign-off — owner must review contact-sheet.html and run `npm run signoff` to unblock --all

## Session Continuity

Last session: 2026-07-08
Stopped at: Roadmap v2.1 written (phases 08–11). REQUIREMENTS.md traceability updated. STATE.md updated.
Resume: Run `/gsd:plan-phase 8` to create the execution plan for Phase 08 (Audit go-live & gap analysis).

### Key Decisions Added (v2.0 execution)

- LOCKED: Photos already local (ig-studio/photos/umai_001..081.jpg) — no Drive/OAuth needed (INGEST-01 satisfied)
- LOCKED: Summer menu KB (data/summer-menu-2026.json) is classification ground truth
- LOCKED: Pilot uses even-spread indices (not first-N) to sample full photo range
- LOCKED: classifier.js safe fallback: parse errors → ambiance (0.0 conf), batch never crashes
- LOCKED: KB slugs use hardcoded name→slug map for stability (no fragile accent-strip for variant names)
