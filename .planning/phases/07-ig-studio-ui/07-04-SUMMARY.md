---
phase: 07-ig-studio-ui
plan: "04"
subsystem: ig-studio
tags: [server-actions, spawn, live-preview, photo-editor, classification, captions]
dependency_graph:
  requires: [07-02, 07-03]
  provides: [per-photo-editor, spawn-helper, server-actions, preview-route]
  affects: [classification.json, captions.json]
tech_stack:
  added: []
  patterns:
    - child_process.spawn with cwd=ig-studio for Node script isolation
    - server actions with requireStudioAuth guard + revalidatePath
    - debounced live preview via fetch + object URL lifecycle management
    - override-wins read-modify-write pattern on classification.json
key_files:
  created:
    - src/lib/ig-studio/run.ts
    - src/lib/ig-studio/actions.ts
    - src/app/api/ig-studio/preview/route.ts
    - src/app/(ig-studio)/ig-studio/[id]/page.tsx
    - src/app/(ig-studio)/ig-studio/[id]/PhotoEditor.tsx
  modified:
    - ig-studio/.gitignore
decisions:
  - Spawn node scripts with process.env forwarded (not a clean env) so Next.js env vars like IG_STUDIO_PASSWORD are available in the subprocess context where needed
  - caption.js uses --env-file=.env as a node flag (before the script name) — this is the correct Node.js CLI syntax, not an app argument
  - Live preview uses object URL lifecycle (revoke-before-replace) to avoid browser memory leaks across debounce cycles
  - isDirty flag warns Loan to save before regenerating since regeneratePhoto reads classification.json (the saved state)
  - captions.json added to ig-studio/.gitignore (local working artifact, not committed)
metrics:
  duration: "~35 min"
  completed: "2026-06-29"
  tasks_completed: 3
  files_created: 5
  files_modified: 1
---

# Phase 07 Plan 04: Per-Photo Editor — Summary

Per-photo IG Studio editor with spawn helper, server actions, live-preview route, and full PhotoEditor client component wiring classification override + caption + regenerate.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Spawn helper (run.ts) + server actions (actions.ts) + gitignore update | 4939697 |
| 2 | Live preview API route POST /api/ig-studio/preview | 5d45f9b |
| 3 | Editor server component + PhotoEditor client component | 3565e7b |

## What Was Built

**run.ts** — generic `runIgStudio(args, opts)` that spawns `node <args>` with `cwd=ig-studio/`, captures stdout/stderr, kills on 60s timeout, resolves with `{ code, stdout, stderr }`.

**actions.ts** — four auth-gated server actions:
- `saveOverride`: read-modify-write on `classification.json` (override-wins, preserves AI confidence/reasoning, sorts by file)
- `saveCaption`: writes to `captions.json` keyed by photo id
- `generateCaptionAction`: writes in-flight entry to tmpdir, shells `node --env-file=.env src/caption.js`, returns draft text (no auto-save)
- `regeneratePhoto`: shells `node src/compose.js --photo <id>`, parses last JSON line, returns result

**preview/route.ts** — POST handler that writes entry to tmpdir, runs `compose --preview --format feed --out <tmp.png>`, streams the PNG with `Cache-Control: no-store`, cleans up both temp files in `finally`.

**[id]/page.tsx** — server component: `await requireStudioAuth()` (→ redirect login on throw), `await params`, `notFound()` on invalid id, loads entry + caption + menuOptions, renders `<PhotoEditor>`.

**[id]/PhotoEditor.tsx** — client component:
- Grouped `<select>` from menu-options groups → autofills dishName/price/baseline; Ambiance slug forces `overlayMode='photo-only'` and hides chip fields
- Overlay segmented control (packshot / photo-only), disabled for Ambiance
- Caption `<textarea>` + "Générer caption (IA)" button (useTransition → generateCaptionAction → sets field) + "Enregistrer caption" button
- Live preview: 400ms debounced fetch to `/api/ig-studio/preview`, object URL lifecycle management (revoke-before-replace)
- Save button → `saveOverride` (sets override:true in classification.json)
- Regenerate button → `regeneratePhoto` + dirty-state warning if unsaved changes
- Végé badge, signature badge, AI suggestion read-only hint panel

## Verification Results

- TypeScript: clean on all new files (single pre-existing error in photo/route.ts Buffer type, out of scope)
- Editor page `/ig-studio/umai_057`: 200 when authed, 307→login when not authed
- HTML contains: `/api/ig-studio/photo/umai_057` img, `dish-select`, `optgroup` elements, `Tantan Um` dish name
- captions.json added to ig-studio/.gitignore

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired from real sources (classification.json, captions.json, menu-options.json). Preview hits the real compose pipeline.

## Self-Check: PASSED

- src/lib/ig-studio/run.ts ✓
- src/lib/ig-studio/actions.ts ✓
- src/app/api/ig-studio/preview/route.ts ✓
- src/app/(ig-studio)/ig-studio/[id]/page.tsx ✓
- src/app/(ig-studio)/ig-studio/[id]/PhotoEditor.tsx ✓
- Commits: 4939697, 5d45f9b, 3565e7b ✓
