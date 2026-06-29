---
phase: 05-brand-kit-compositing
plan: 02
subsystem: ig-studio/src
tags: [compose, crop, gallery, pipeline, sharp, meta-formats, brand-07]
dependency_graph:
  requires: [05-01 brand primitives (overlay.js, chip.js, brand/)]
  provides: [src/crop.js, src/compose.js, src/gallery.js, out/{photoId}/ at runtime]
  affects: [Phase 06 caption generation, Phase 07 review UI]
tech_stack:
  added: []
  patterns: [sharp fit:cover crop, pathToFileURL CLI guard, sips verification oracle]
key_files:
  created:
    - ig-studio/src/crop.js
    - ig-studio/src/crop.test.js
    - ig-studio/src/compose.js
    - ig-studio/src/gallery.js
  modified:
    - ig-studio/package.json
    - ig-studio/.gitignore
decisions:
  - sharp fit:cover/centre for cover-crop (no letterbox) — sips is the verify oracle (BRAND-06 documented deviation: sips verifies, sharp crops)
  - composePhoto exports separately from CLI main to allow import in verify scripts
  - pathToFileURL guard wraps CLI main with process.argv[1] null-check (needed for dynamic import)
  - gallery.html gitignored (local working artifact, like contact-sheet.html)
metrics:
  duration: ~10min
  completed: 2026-06-29
  tasks: 3
  files: 6
---

# Phase 05 Plan 02: Compose Pipeline & Review Gallery — Summary

End-to-end branded compose pipeline: cover-crop to 3 exact Meta formats + shotType-driven overlay → `out/{photoId}/{feed,square,story}.png`. Pilot of 10 photos generated with correct overlay logic. Review gallery HTML produced for owner sign-off.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Meta-format spec + coverCrop (TDD) | RED: 2fc8cb9 / GREEN: e280043 | src/crop.js, src/crop.test.js |
| 2 | compose pipeline + CLI | 2464931 | src/compose.js |
| 3 | Review gallery HTML | 17eb6b6 | src/gallery.js, .gitignore |

## Pilot Run Results

```
[compose] Pilot run — 10 photos
[1/10] umai_001.jpg → feed/square/story (photo-only)
[2/10] umai_010.jpg → feed/square/story (photo-only)
[3/10] umai_019.jpg → feed/square/story (logo+chip)
[4/10] umai_028.jpg → feed/square/story (logo+chip)
[5/10] umai_037.jpg → feed/square/story (photo-only)
[6/10] umai_045.jpg → feed/square/story (logo-only)
[7/10] umai_054.jpg → feed/square/story (logo+chip)
[8/10] umai_063.jpg → feed/square/story (logo+chip)
[9/10] umai_072.jpg → feed/square/story (logo+chip)
[10/10] umai_081.jpg → feed/square/story (photo-only)

Summary: 5 packshot+chip / 1 logo-only / 4 ambiance
```

## Dimension Verification (sips)

All outputs verified exact via `sips -g pixelHeight pixelWidth`:
- feed: 1080×1350 ✔
- square: 1080×1080 ✔
- story: 1080×1920 ✔

## Verification Results

- `node --test src/crop.test.js` → 6/6 pass ✔
- Task 2 inline verify → OK dims exact, packshot chip+logo, ambiance photo-only ✔
- `npm run compose -- --pilot` → 10 photos, no network, correct overlay counts ✔
- `npm run gallery` → gallery.html written, references out/ thumbnails ✔
- gallery.html gitignored ✔; no out/ images staged ✔

## Example Output Paths

**Packshot with chip (tokyo, conf 0.82):**
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_019/feed.png`
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_019/square.png`
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_019/story.png`

**Packshot with chip (gyoza, conf 0.97):**
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_057/feed.png`
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_057/square.png`
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_057/story.png`

**Ambiance (photo-only, umai_001):**
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_001/feed.png`
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_001/square.png`
- `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/out/umai_001/story.png`

**Review gallery:** `/Users/ekitcho/Desktop/dev-claude-lab/umai2026/ig-studio/gallery.html`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pathToFileURL guard with null-check on process.argv[1]**
- Found during: Task 2 verification (dynamic `import()` call)
- Issue: `pathToFileURL(process.argv[1])` throws when `process.argv[1]` is undefined
- Fix: added `process.argv[1] &&` guard before the pathToFileURL call
- Files modified: src/compose.js (1 line)

### No Architectural Deviations

Plan executed exactly as designed. Sharp does the crop; sips is the verify oracle (BRAND-06 documented deviation).

## Self-Check: PASSED

- src/crop.js ✔
- src/crop.test.js ✔
- src/compose.js ✔
- src/gallery.js ✔
- package.json (compose + gallery scripts) ✔
- .gitignore (gallery.html) ✔
- All 4 task commits verified in git log ✔
- out/ not committed ✔
