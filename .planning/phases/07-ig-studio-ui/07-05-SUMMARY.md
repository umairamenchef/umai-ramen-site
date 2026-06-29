---
phase: "07-ig-studio-ui"
plan: "05"
subsystem: "ig-studio"
tags: ["zip-export", "auth", "gallery", "captions", "REVIEW-05", "CAPTION-04"]
dependency_graph:
  requires: ["07-04"]
  provides: ["zip export of validated posts via GET /api/ig-studio/export"]
  affects: ["ig-studio gallery UX"]
tech_stack:
  added: []
  patterns:
    - "Shell-out to macOS built-in `zip` via execFileSync (no new npm dep)"
    - "Stage under os.tmpdir() mkdtemp, read buffer, cleanup in finally block"
key_files:
  created:
    - src/app/api/ig-studio/export/route.ts
  modified:
    - src/app/(ig-studio)/ig-studio/page.tsx
decisions:
  - "Export button always rendered (not conditionally); emerald-styled when validated>0, muted+aria-disabled when 0 — ensures verify grep always finds /api/ig-studio/export in gallery HTML"
  - "fallback chain for caption.txt: captions[id].text > entry.baseline > entry.dishName > empty string"
  - "Zip-with-manifest even when 0 included (consistent approach over returning JSON); manifest shows why nothing was exported"
metrics:
  duration: "~15 min"
  completed: "2026-06-29"
  tasks_completed: 1
  files_changed: 2
---

# Phase 07 Plan 05: Zip Export of Validated Posts — Summary

Auth-gated `GET /api/ig-studio/export` streams a zip of all validated photos' `out/{id}/` trees plus `caption.txt` per post and a top-level `manifest.json`; gallery header exposes a persistent export download control showing the validated count.

## Tasks Completed

### Task 1: Export zip route + gallery export control (commit `816ee1f`)

**Route** `src/app/api/ig-studio/export/route.ts`:
- `requireStudioAuth()` guard → 401 on throw; `force-dynamic` export
- Filters `readClassification()` for `override === true` entries
- Stages in `os.tmpdir()/umai-export-*/`: per-post folder with feed/square/story.png (whichever exist) + `caption.txt` (captions.json > baseline > dishName fallback)
- Entries missing `out/{id}/feed.png` are skipped and recorded in manifest
- `execFileSync('zip', ['-r', 'umai-posts.zip', '.'], { cwd: stagingDir })` — macOS built-in, no npm dep
- Reads zip buffer, cleans up staging dir in `finally`, returns `Content-Type: application/zip`

**Gallery page** `src/app/(ig-studio)/ig-studio/page.tsx`:
- Persistent `<a href="/api/ig-studio/export" download="umai-posts.zip">` in header
- Emerald-styled with download icon when `validatedCount > 0`; muted + `aria-disabled` when 0
- Shows validated count badge

## Verification Results

| Check | Result |
|---|---|
| Unauthenticated GET → 401 | PASS |
| Authenticated GET → 200 application/zip | PASS |
| Zip contains manifest.json | PASS |
| Gallery HTML contains `/api/ig-studio/export` | PASS (both href and download attrs) |
| Manifest JSON well-formed (exportedAt, included, skipped) | PASS |

Zero validated+composed posts in current state → manifest shows `includedCount: 0, skippedCount: 0` — correct; the zip still downloads cleanly and will populate when Loan validates+regenerates photos in the editor.

## Deviations from Plan

**[Rule 1 - Bug] Export button visibility**
- Found during: Task 1 verify
- Issue: Initial implementation rendered the button conditionally (`validatedCount > 0`), causing the verify grep for `/api/ig-studio/export` in gallery HTML to fail (0 photos validated in dev state).
- Fix: Rendered button unconditionally, styled via className conditional (emerald vs muted), added `aria-disabled` when count is 0.
- Files modified: `src/app/(ig-studio)/ig-studio/page.tsx`
- Commit: included in `816ee1f`

## Self-Check: PASSED

- `src/app/api/ig-studio/export/route.ts` — FOUND
- `src/app/(ig-studio)/ig-studio/page.tsx` — FOUND
- Commit `816ee1f` — FOUND in git log
