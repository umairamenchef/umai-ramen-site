---
phase: 07-ig-studio-ui
plan: "03"
subsystem: ig-studio
tags: [gallery, photo-route, sharp, auth-gate, data-lib, filterable-grid]
dependency_graph:
  requires: ["07-01"]
  provides: ["07-04"]
  affects: [ig-studio-data-lib, photo-serving, gallery-ui]
tech_stack:
  added: ["sharp ^0.35.2"]
  patterns: [server-external-packages, auth-gated-route-handler, async-params-next16, client-filters-rsc]
key_files:
  created:
    - src/lib/ig-studio/data.ts
    - src/app/api/ig-studio/photo/[id]/route.ts
    - src/app/(ig-studio)/ig-studio/GalleryFilters.tsx
  modified:
    - next.config.ts
    - package.json
    - src/app/(ig-studio)/ig-studio/page.tsx
decisions:
  - "Read photos/ and JSON data at runtime via process.cwd() (not import) so gitignored data stays outside the module graph"
  - "sharp added as serverExternalPackages so Turbopack does not try to bundle the native .node binary"
  - "GalleryFilters is 'use client' for filter state; photos props are serialized from RSC so SSR renders all 81 cards (no hydration gap)"
  - "Path-traversal guard: /^umai_\\d{3}$/ test before any fs.existsSync — no regex escape needed for fixed id format"
metrics:
  duration: "~35 min"
  completed: "2026-06-29"
  tasks: 2
  files: 6
requirements_fulfilled:
  - REVIEW-01
  - REVIEW-02
---

# Phase 07 Plan 03: IG Studio data lib + photo route + gallery

Server data lib (`data.ts`), auth-gated photo/thumbnail API route (sharp, path-traversal guarded), and filterable 81-photo gallery page for Loan's IG Studio review workflow.

## What was built

### Task 1 — Server data lib + photo/thumbnail route

**`src/lib/ig-studio/data.ts`** (server-only):
- Constants for all ig-studio paths relative to `process.cwd()`
- `isValidPhotoId(id)`: strict `/^umai_\d{3}$/` guard
- `photoFsPath(id)`: safe path resolver (throws on invalid id)
- `readClassification()`: parses `ig-studio/classification.json`, returns `[]` on missing
- `readCaptions()`: parses `ig-studio/captions.json`, returns `{}` on missing
- `loadMenuOptions()`: parses `menu-options.json`, builds `slugToGroup` Map + `menuLabel()` helper (mirrors ig-studio/src/menu.js semantics)
- `getPhotos()`: lists `photos/` dir, merges classification + captions + menu → `IgPhoto[]` with `status: 'validated'|'pending'`

**`src/app/api/ig-studio/photo/[id]/route.ts`**:
- `requireStudioAuth()` → 401 on failure (route handlers not matched by proxy.ts)
- `isValidPhotoId()` → 404 on any non-matching id (blocks path traversal)
- `?size=thumb` → sharp resize 480px wide, quality 70, `Cache-Control: private, max-age=3600`
- Default → full-res buffer, same cache headers
- `serverExternalPackages: ['sharp']` added to `next.config.ts`

### Task 2 — Gallery page + client filters

**`src/app/(ig-studio)/ig-studio/page.tsx`** (RSC, replaces 07-01 placeholder):
- `dynamic = 'force-dynamic'`
- `requireStudioAuth()` → redirect to login on fail
- `getPhotos()` + `loadMenuOptions()` → 81 photos + menu groups
- Header: title + "N validées / 81 photos" count + logout form
- Passes all photos + group names to `<GalleryFilters />`

**`src/app/(ig-studio)/ig-studio/GalleryFilters.tsx`** (`'use client'`):
- Filter state: `status` (all/validated/pending), `group` (all + menu groups), `conf` (all / ≥70% / <70%)
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` responsive grid
- Each card: lazy thumbnail via `/api/ig-studio/photo/{id}?size=thumb`, dish name, confidence badge (emerald ≥70% / amber <70%), status pill (emerald validated / amber pending), one-line reasoning excerpt
- `min-h-[44px]` tap targets on all interactive elements
- Links to `/ig-studio/{id}` for the per-photo editor (07-04)

## Verification results

**Task 1:**
- `401` unauthed — PASS
- `200 image/jpeg` + sharp thumbnail when authed — PASS
- `404` on `..%2f..%2fpackage` traversal attempt — PASS
- Full-res: `200 image/jpeg 618KB` — PASS

**Task 2:**
- SSR HTML contains 81 unique photo thumbnail refs (`/api/ig-studio/photo/umai_001..081?size=thumb`) — PASS
- SSR HTML contains 81 unique editor links (`/ig-studio/umai_001..081`) — PASS

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- Per-photo editor pages (`/ig-studio/{id}`) are linked but not yet built (07-04 scope). Cards link to them; a 404 is expected until 07-04.
- `captions.json` likely does not exist yet — `readCaptions()` returns `{}` gracefully; `hasCaption` will be `false` for all photos.

## Self-Check: PASSED

All 4 key files confirmed on disk. Both task commits present:
- `bfa32e7` feat(07-03): ig-studio server data lib + auth-gated photo/thumbnail route (sharp)
- `226aa34` feat(07-03): /ig-studio gallery grid + status + client filters (REVIEW-01,02)
