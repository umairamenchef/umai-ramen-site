---
phase: 07-ig-studio-ui
plan: 02
subsystem: ig-studio/src
tags: [ig-studio, menu, overlay, compose, caption, claude, anthropic]
dependency_graph:
  requires: []
  provides: [menu.js, extended-overlay.js, compose-single-photo, caption.js]
  affects: [07-03-ig-studio-editor-api, 07-04-ig-studio-ui]
tech_stack:
  added: []
  patterns: [canonical-menu-loader, overlayMode-resolution, composeOne-preview, claude-caption-drafter]
key_files:
  created:
    - ig-studio/src/menu.js
    - ig-studio/src/menu.test.js
    - ig-studio/src/caption.js
  modified:
    - ig-studio/src/overlay.js
    - ig-studio/src/overlay.test.js
    - ig-studio/src/compose.js
    - ig-studio/package.json
decisions:
  - "overlayMode resolution: explicit entry.overlayMode wins; falls back to shotType/slug-based detection — backward compatible"
  - "label priority: entry.dishName (human) → dishLabel (legacy KB) → menuLabel (canonical); human-chosen packshot always chips regardless of confidence"
  - "composeOne helper for preview: reuses coverCrop + applyOverlay, no duplicate rendering; writes to --out path only (no out/{id}/ pollution)"
  - "caption.js uses claude-sonnet-4-6, prints ONLY caption to stdout for clean API capture"
metrics:
  duration: ~25min
  completed: "2026-06-29T13:53:54Z"
  tasks_completed: 3
  files_changed: 7
---

# Phase 07 Plan 02: IG Studio Node Glue — SUMMARY

**One-liner:** Canonical menu.js loader + overlayMode-aware applyOverlay + compose `--photo`/`--preview` CLI + `caption.js` FR drafter via claude-sonnet-4-6.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | menu.js loader + overlayMode/label-aware applyOverlay | 8059ab1 | menu.js (new), menu.test.js (new), overlay.js (extended), overlay.test.js (extended) |
| 2 | compose.js single-photo + preview CLI modes | 949aa3a | compose.js, package.json |
| 3 | caption.js FR caption drafter | fb1f993 | caption.js (new), package.json |

## What Was Built

### menu.js
- `loadMenu()` → `{ groups, nap, items, bySlug }` (memoised) — canonical source for the `/ig-studio` dropdown
- `menuLabel(slug)` → `{ name, price, baseline }` or `null` for `'ambiance'`/unknown
- 10 test assertions, all green

### overlay.js (extended, backward-compatible)
- Mode resolution: `entry.overlayMode ?? shotType/slug-based` — `'photo-only'` returns canvas unchanged; `'packshot'` always composites logo
- Chip logic: label resolves AND (`overlayMode === 'packshot'` [human beats low confidence] OR `conf >= 0.7` [legacy AI path])
- Label priority: `entry.dishName` → `dishLabel` (legacy KB) → `menuLabel` (canonical)
- 6 test assertions (4 legacy + 2 new cases), all green

### compose.js (extended)
- `--photo <id>`: re-compose one photo into `out/{id}/{feed,square,story}.png`; prints JSON result line
- `--preview --format <f> --out <path> [--entry-file <path>]`: single-format preview to explicit path (no `out/{id}/` write)
- `--entry-file`: accepts in-flight unsaved editor JSON with `overlayMode`/`dishName`/`price`
- `composeOne()` helper exported for programmatic use from API routes
- Preview verified: `1080×1350` feed PNG from unsaved entry with human chip rendered correctly

### caption.js
- `generateCaption({ dishName, baseline, price, overlayMode, nap })` → FR caption string
- Packshot: dish + baseline + price + NAP (address/phone/instagram/website) + CTA + hashtags
- Ambiance/photo-only: generic brand voice, no dish claim
- CLI: `node --env-file=.env src/caption.js --photo <id> [--entry-file <path>]` — prints ONLY caption to stdout
- `caption` npm script added

## Verification Results

1. `node --test src/menu.test.js src/overlay.test.js` — **16/16 pass** (10 menu + 6 overlay)
2. `node src/compose.js --photo umai_057` → `out/umai_057/feed.png`, `square.png`, `story.png` ✓
3. `--preview --format feed --out /tmp/igpreview.png --entry-file /tmp/igentry.json` → 1080×1350 PNG ✓; human packshot chip rendered at confidence 0.2 ✓
4. Caption export + model checks pass; live API call for `umai_057` returns plausible FR caption ✓

## Example Generated Caption (umai_057 — Gyoza)

```
Croustillants dehors, fondants dedans — nos gyoza sont la définition du bonheur en une bouchée 🥟✨
Poulet, porc ou légumes, chaque version cache une farce généreuse qui sent bon le fait maison.
Une petite faim dans les ruelles de la Krutenau ? On vous attend avec la poêle chaude.

📍 5 Rue des Orphelins, 67000 Strasbourg
📞 09 52 34 34 38
🌐 umai-ramen.fr
👉 @umai_ramen_strasbourg

#UmaiRamen #Strasbourg #Ramen #Gyoza #Raviolis #Krutenau #RestaurantJaponais #CuisineJaponaise #StreetFoodJaponaise #Strasbourgeats
```

Tone: appetizing, convivial, Krutenau-anchored — matches brand voice brief.

## Deviations from Plan

None — plan executed exactly as written. All three tasks delivered within scope. No architectural changes required.

## Self-Check

- [x] `ig-studio/src/menu.js` — exists
- [x] `ig-studio/src/menu.test.js` — exists
- [x] `ig-studio/src/overlay.js` — modified
- [x] `ig-studio/src/overlay.test.js` — modified
- [x] `ig-studio/src/compose.js` — modified
- [x] `ig-studio/src/caption.js` — exists
- [x] Commits: 8059ab1, 949aa3a, fb1f993 — all present in git log
- [x] `out/`, `.env`, temp files — not staged/committed

## Self-Check: PASSED
