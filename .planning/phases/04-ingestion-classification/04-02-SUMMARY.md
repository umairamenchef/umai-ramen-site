---
phase: 04-ingestion-classification
plan: "02"
subsystem: ig-studio/contact-sheet
tags: [html, review-ui, pilot-gate]
dependency_graph:
  requires: [04-01]
  provides: [ig-studio/src/contact-sheet.js, ig-studio/scripts/_verify-contact-sheet.mjs]
  affects: [05-compositing, 06-captions]
tech_stack:
  added: []
  patterns: [self-contained HTML, inline CSS+JS, confidence-sorted review UI]
key_files:
  created:
    - ig-studio/src/contact-sheet.js
    - ig-studio/scripts/_verify-contact-sheet.mjs
  modified: []
decisions:
  - "Confidence sort default: ASC (worst-first) to prioritize review effort on low-confidence photos"
  - "Inline CSS+JS: zero build step — opens directly from local filesystem"
  - "Override badge in French (CORRIGÉ) for audience alignment"
metrics:
  duration: "~15min"
  completed: "2026-06-29"
  tasks: 1 of 2 (Task 2 is human checkpoint — pending owner review)
  files: 2
requirements:
  - INGEST-07
  - INGEST-08 (partial — gate mechanism in 04-01; sign-off pending owner)
---

# Phase 04 Plan 02: HTML Contact Sheet + Pilot Sign-Off — Summary

**One-liner:** Self-contained HTML contact sheet generator from classification.json, confidence-sorted with colored badges and client-side re-sort, pending owner pilot sign-off.

## What Was Built

### Task 1 — HTML contact-sheet generator
- `src/contact-sheet.js`: reads `classification.json`, emits `contact-sheet.html`
- One card per photo: `img src="photos/<file>"` (relative path, works when opened from ig-studio/)
- Visual confidence badges: red (<0.5), amber (0.5-0.7), green (>=0.7) — low-confidence cards sort first
- Override indicator: yellow "CORRIGÉ" badge on entries with `override: true`
- Client-side sort: confidence asc/desc + dishSlug A-Z (inline JS, no dependencies)
- `scripts/_verify-contact-sheet.mjs`: fixture test with 10 assertions — all pass
- Script `npm run contact-sheet` in package.json (added in 04-01 scaffold)

## Pilot Classification Results (from 04-01 live run)

Contact sheet generated for all 10 pilot entries:
- 0 red (conf < 0.5) — no very low confidence entries
- 3 amber (conf 0.5–0.7) — umai_010.jpg, umai_037.jpg, umai_045.jpg
- 7 green (conf >= 0.7) — high-confidence classifications

## Commits

| Task | Hash | Message |
|------|------|---------|
| T1 | 9b2863d | feat(04-02): HTML contact-sheet generator from classification.json (INGEST-07) |

## Task 2 — PENDING OWNER REVIEW

Task 2 is a `checkpoint:human-verify` gate. The automation is complete:
- `classification.json` exists with 10 pilot entries
- `contact-sheet.html` generated and ready to open

**Owner action required:**
1. Open `ig-studio/contact-sheet.html` in a browser
2. Review each of the ~10 cards (amber cards first — pay attention to umai_037.jpg which was flagged as ambiance/udon — possibly a mis-classified dish)
3. Fix wrong labels: edit `classification.json`, set `"override": true`, re-run `npm run contact-sheet`
4. When satisfied: `npm run signoff` (creates `.pilot-signoff`)
5. Then `npm run classify -- --all` will be unblocked for the 81-photo run

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- contact-sheet.js: FOUND
- _verify-contact-sheet.mjs: FOUND
- Commit 9b2863d: FOUND
- Verify script: 10/10 checks pass
