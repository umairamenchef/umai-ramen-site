---
phase: 05-brand-kit-compositing
plan: 01
subsystem: ig-studio/brand
tags: [brand, tokens, logo, chip, overlay, sharp, svg, tdd]
dependency_graph:
  requires: []
  provides: [brand/tokens.js, brand/logo.js, brand/assets/umai-logo-overlay.png, src/chip.js, src/overlay.js, dishLabel in src/kb.js]
  affects: [05-02 compose pipeline]
tech_stack:
  added: []
  patterns: [sharp SVG rasterization, module-level memoization, TDD red-green]
key_files:
  created:
    - ig-studio/brand/tokens.js
    - ig-studio/brand/logo.js
    - ig-studio/brand/assets/umai-logo-overlay.png
    - ig-studio/src/chip.js
    - ig-studio/src/chip.test.js
    - ig-studio/src/overlay.js
    - ig-studio/src/overlay.test.js
  modified:
    - ig-studio/src/kb.js
    - ig-studio/package.json
decisions:
  - Sharp-only SVG rasterization chosen over puppeteer/Chrome (BRAND-05 deviation, documented in plan): no Chrome dependency, fully autonomous, librsvg+pango shipped with sharp
  - Logo fill injected into root SVG tag attribute (fill + fill-opacity) rather than CSS override — simpler and reliable with rsvg
  - Chip width calculated via character-count approximation (acceptable for v1, Phase 07 will refine with measured text)
  - dishLabel prefixes family name for tsukemen-/mazesoba-/hiyashi- variants; Ramen/Tantan names are self-describing
metrics:
  duration: ~12min
  completed: 2026-06-29
  tasks: 3
  files: 9
---

# Phase 05 Plan 01: Brand Kit & Compositing Primitives — Summary

Sharp-only brand kit: ivoire/vert token module, transparent logo PNG rasterized from committed SVG, SVG dish-name chip wired to summer-menu KB, and shotType-driven overlay compositor with conf≥0.7 chip gate.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Brand-token module + transparent logo PNG | 6ea64e7 | brand/tokens.js, brand/logo.js, brand/assets/umai-logo-overlay.png, package.json |
| 2 | dishLabel resolver + SVG dish-name chip (TDD) | RED: fd85963 / GREEN: 8efaff9 | src/kb.js, src/chip.js, src/chip.test.js |
| 3 | shotType-driven applyOverlay | 72e602a | src/overlay.js, src/overlay.test.js |

## Verification Results

- `npm run brand:logo` → 349×120 px, alpha=true, format=png ✔
- `node --test src/chip.test.js` → 14/14 pass ✔
- `node --test src/overlay.test.js` → 4/4 pass ✔
- No new npm dependencies added (sharp-only) ✔
- brand/ committed; nothing under out/ touched ✔

## Deviations from Plan

### Documented Deviations (planned)

**1. [Sharp-only pipeline — documented in plan] No puppeteer/Chrome**
- BRAND-05 allowed sharp as alternative; plan explicitly chose it
- sharp ships with librsvg 2.62.3 + pango/fontconfig/harfbuzz
- Logo SVG rasterized at height 120 → 349×120 transparent PNG

### Auto-fixed Issues

None — plan executed exactly as written.

## Key Decisions

1. **SVG fill injection** via root attribute (`fill="#F5F0E8" fill-opacity="0.92"`) rather than CSS — simpler, reliable with rsvg renderer.
2. **Chip width** approximated by character count × char-width constant — acceptable v1 accuracy; Phase 07 UI can refine with actual font metrics.
3. **Memoization** in `getLogoOverlayPng` via module-level Map — avoids repeated SVG rasterization on multi-format compose runs.
4. **dishLabel family prefix** for tsukemen-/mazesoba-/hiyashi- variants (item.name is just "Gyokai", "Karaage", "Poulet grillé" without context) — produces "Tsukemen Gyokai", "Hiyashi Poulet grillé" etc.

## Self-Check: PASSED

- brand/tokens.js ✔
- brand/logo.js ✔
- brand/assets/umai-logo-overlay.png ✔
- src/chip.js ✔
- src/chip.test.js ✔
- src/overlay.js ✔
- src/overlay.test.js ✔
- All commits verified in git log ✔
