---
phase: 04-ingestion-classification
plan: "01"
subsystem: ig-studio/classification-cli
tags: [cli, vision-ai, classification, tdd]
dependency_graph:
  requires: []
  provides: [classification.json, ig-studio/src/cli.js, ig-studio/src/kb.js, ig-studio/src/classifier.js, ig-studio/src/store.js]
  affects: [04-02-contact-sheet, 05-compositing, 06-captions]
tech_stack:
  added: ["@anthropic-ai/sdk ^0.106.0", "sharp ^0.35.2"]
  patterns: [ESM Node CLI, TDD, override-wins merge, vision prompt engineering]
key_files:
  created:
    - ig-studio/package.json
    - ig-studio/src/cli.js
    - ig-studio/src/photos.js
    - ig-studio/src/kb.js
    - ig-studio/src/classifier.js
    - ig-studio/src/store.js
    - ig-studio/src/kb.test.js
  modified:
    - ig-studio/.gitignore
decisions:
  - "Pilot even-spread: indices by interpolation (not first-N) → covers full 81-photo range"
  - "Safe fallback in classifier: parse errors return low-confidence ambiance, never crash the batch"
  - "KB slugs hardcoded map for stability (no fragile string-norm for Hiyashi/Tsukemen variants)"
metrics:
  duration: "295s"
  completed: "2026-06-29"
  tasks: 3
  files: 8
requirements:
  - INGEST-01
  - INGEST-02
  - INGEST-03
  - INGEST-04
  - INGEST-05
  - INGEST-06
  - INGEST-08
---

# Phase 04 Plan 01: ig-studio Classification CLI — Summary

**One-liner:** Node ESM CLI classifying 81 local ramen photos via claude-opus-4-8 vision against summer-menu-2026.json KB, with override-wins store and pilot gate.

## What Was Built

### Task 1 — ig-studio ESM scaffold
- `package.json` with `classify`/`signoff`/`contact-sheet` scripts, `@anthropic-ai/sdk` + `sharp` installed
- `photos.js`: `listPhotos()` (81 photos via regex), `selectPilot()` deterministic even-spread across full range
- `cli.js`: `--pilot`/`--all`/`--signoff`/`--limit=N` parsing; `--all` gate exits non-zero without `.pilot-signoff`
- `.gitignore` updated: `classification.json`, `contact-sheet.html`, `.pilot-signoff` added

### Task 2 — Summer KB + Vision classifier (TDD)
- `kb.js`: `loadKB()` parses summer-menu-2026.json, derives 21 stable slugs including ambiance; `buildPromptContext()` encodes broth+noodle rules, chashu-is-topping, ambiance fallback
- `classifier.js`: sharp downscale (1024px), claude-opus-4-8 image block call, JSON extraction with fence/regex guards, contract enforcement (slug validation, shotType→dishSlug coupling, confidence clamp)
- `kb.test.js`: 12 tests, all pass (TDD RED→GREEN cycle)

### Task 3 — Store + live pilot
- `store.js`: `readStore()`/`mergeAndWrite()` — override-wins, preserves out-of-batch entries, sorted pretty JSON
- Live pilot run: 10 varied photos classified via real API call

## Live Pilot Results

| file | dishSlug | shotType | confidence | reasoning (brief) |
|------|----------|----------|------------|-------------------|
| umai_001.jpg | ambiance | ambiance | 0.95 | Kitchen prep scene — chef draining noodles, no finished dish |
| umai_010.jpg | ambiance | ambiance | 0.55 | Ramen being plated in kitchen — action/ambiance, not packshot |
| umai_019.jpg | tokyo | packshot | 0.82 | Clear broth + pork chashu + bamboo → Tokyo |
| umai_028.jpg | yuzu | packshot | 0.70 | Clear broth + chicken slices → Yuzu |
| umai_037.jpg | ambiance | ambiance | 0.55 | Udon + tempura — no precise slug match; coerced to ambiance |
| umai_045.jpg | tokyo | packshot | 0.55 | Clear broth + karaage chicken balls → Tokyo default |
| umai_054.jpg | tsukemen-gyokai | packshot | 0.70 | Cold separate noodles + dipping broth → tsukemen |
| umai_063.jpg | karaage | packshot | 0.92 | Golden fried chicken in bowl with spicy mayo — clear karaage |
| umai_072.jpg | tantan-ramen | packshot | 0.90 | Reddish broth + minced beef + piment → tantan-ramen |
| umai_081.jpg | ambiance | ambiance | 0.97 | Restaurant interior, kimono decor, multi-dish table |

**Distribution:** 4 ambiance, 2 tokyo, 1 yuzu, 1 tantan-ramen, 1 tsukemen-gyokai, 1 karaage

**Note:** umai_037.jpg coerced to ambiance — it appears to be an udon dish (not on the summer ramen menu). The model correctly flagged it as not matching any summer slug. Worth human review.

## Commits

| Task | Hash | Message |
|------|------|---------|
| T1 | 5a1ff41 | chore(04-01): scaffold ig-studio node CLI + photo discovery (INGEST-01) |
| T2 RED | b2878a7 | test(04-01): add failing tests for kb.js loadKB + buildPromptContext (TDD RED) |
| T2 GREEN | 38d841b | feat(04-01): summer-KB loader + claude-opus-4-8 vision classifier (INGEST-02..05) |
| T3 | 8a25fc9 | feat(04-01): classification.json override-wins store + pilot gate (INGEST-06, INGEST-08) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] buildPromptContext() used "bouillon CLAIR" (uppercase) — test expected lowercase**
- **Found during:** Task 2 TDD GREEN phase
- **Issue:** Test `mentions "bouillon clair"` failed due to case mismatch
- **Fix:** Changed to lowercase "bouillon clair" in kb.js prompt text
- **Files modified:** ig-studio/src/kb.js
- **Commit:** 38d841b (same task commit)

## Known Stubs

None — all outputs are live data from real API calls.

## Self-Check: PASSED

- store.js: FOUND
- kb.js: FOUND
- classifier.js: FOUND
- Commits 5a1ff41, b2878a7, 38d841b, 8a25fc9: all FOUND
