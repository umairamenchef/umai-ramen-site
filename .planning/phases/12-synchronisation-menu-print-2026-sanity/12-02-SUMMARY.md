---
phase: 12-synchronisation-menu-print-2026-sanity
plan: 02
subsystem: content-sync
tags: [sanity, menu, transcription, node-script, groq, backup, rollback]

# Dependency graph
requires:
  - phase: 12-synchronisation-menu-print-2026-sanity (plan 01, parallel)
    provides: "Sanity schema field names (priceVariant, prices, priceOnRequest, badges, subgroup, section, footnote, menuFormule.available) and the « Prix service compris » page note used by the live guard"
provides:
  - "scripts/menu-2026/menu-2026.json: validated transcription of the 2026 print (20 categories, 77 items, 34 distinct prices), single input of the sync (Phase 14 adds en/de/it/zh)"
  - "scripts/menu-2026/menu-schema.mjs: validateMenu() + allPrices() + LOCALES/UNITS/BADGES/EXPECTED_CATEGORY_KEYS"
  - "scripts/menu-2026/validate-menu.mjs: CLI with --crosscheck (price set + normalised text-layer fidelity, 5-entry TEXT_ALLOWLIST)"
  - "scripts/menu-2026/sync-menu.mjs: --dry-run | --backup-only | --apply | --rollback (+ --dump, --full)"
  - "12-DISCREPANCY-REPORT.md (FR, SIMULATION) and the pre-sync backup menu-backup-20261123-194217.json (200 docs)"
affects: [12-03 apply + live verification, 13 tourist menu page, 14 translations (re-runs the sync with en/de/it/zh)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic m26- ids + createOrReplace in one transaction: idempotent, re-runnable sync"
    - "Hide (available=false), never delete; the only delete path is --rollback of m26- docs"
    - "Studio-owned image: kept on re-runs; legacy photos copied at run time via imageFrom (no hard-coded asset id)"
    - "Backup-first: verified JSON export before any write; rollback picks the newest backup without m26- docs"
    - "Print fidelity is machine-checked: price set equality + normalised substring check against the PDF text layers"

key-files:
  created:
    - scripts/menu-2026/menu-schema.mjs
    - scripts/menu-2026/validate-menu.mjs
    - scripts/menu-2026/menu-2026.json
    - scripts/menu-2026/sync-menu.mjs
    - .planning/phases/12-synchronisation-menu-print-2026-sanity/12-DISCREPANCY-REPORT.md
    - .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-194217.json
  modified: []

key-decisions:
  - "Extra legacyIds (report only, per plan): Café expresso ← Expresso, décaféiné; Double expresso ← Double café; Café au lait ← Grand café au lait; Thés verts japonais ← the 5 listed green teas; Infusions ← the 4 « Infusion … » docs. Hibiki / Yamazaki / Toki left unmapped (served expression uncertain)"
  - "« Asashi » appears only in json.corrections (the ekToConfirm line is worded without the typo)"
  - "--rollback tolerates an invalid menu JSON (it only uses the backup); dry-run / backup-only / apply still exit 1"
  - "Rollback: external-reference guard, and the -pre-rollback safety backup is written right before the commit (aborted or no-op rollbacks leave no file)"
  - "Backups: same-second name collision waits for the next second (name pattern kept); « most recent » = newest exportedAt"

patterns-established:
  - "validate-menu.mjs --crosscheck must pass before any sync run; any print → web change goes into json.corrections (and TEXT_ALLOWLIST only for the 5 documented cases)"
  - "sync-menu.mjs --dry-run regenerates the FR report; --apply regenerates it with Statut : APPLIQUÉ"

requirements-completed: [MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06]

# Metrics
duration: 24min
completed: 2026-11-23
---

# Phase 12 Plan 02: Print transcription + Sanity sync tool Summary

**The 2026 print (77 items, 34 prices) is transcribed into a machine-checked JSON. `sync-menu.mjs` plans the publication as 97 createOrReplace + 174 hide patches, copies the 3 home-card photos and writes the FR discrepancy report. It was run read-only only: production is unchanged.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-11-23T19:22:50Z
- **Completed:** 2026-11-23T19:46:57Z
- **Tasks:** 2/2
- **Files created:** 6

## Accomplishments

- `menu-2026.json`: 20 categories / 77 items in print order, verbatim FR, 32 structured variants (3/6/9 pcs, 25/50cl, 33cl, 12/75cl, label « 3 × 6cl »), JP labels, category notes, Menu enfant footnote, sub-groups, best-seller badge, Edamame végétarien + sans gluten. Autonomy-grant defaults are applied: Année Lumière `priceOnRequest`, Trio BAT text, Asashi → Asahi. The file has 13 corrections, 15 EK review points and no `??`.
- `validate-menu.mjs --crosscheck` → `MENU JSON OK categories=20 items=77 variants=32 distinctPrices=34`, `CROSSCHECK OK distinct=34`, `TEXT CROSSCHECK OK checks=201 allowlisted=5`. Negative probes fail as expected:
  - one-letter typos in a name or a description (« Tantan Ramn »);
  - `??`, Asashi, a dotted degree, golden-price drift, two pricing modes, an ALL-CAPS name, a missing item and a stray `imageFrom`;
  - « Œuf mariné entier » (proves there is no œ/oe folding).
- `sync-menu.mjs` dry-run against production (read-only):
  `SYNC SUMMARY mode=dry-run categories=20 items=77 hideLegacy=174 hideOrphanM26=0 slugSuffixed=7 drafts=0 imagesFromLegacy=3 imagesKept=0`
  `LIVE GUARD: blocked (Phase 12 code not deployed yet)`
  PLAN: 271 mutations = 97 createOrReplace (20 categories + 77 items) + 174 patches `available=false` (167 menuItem + 5 menuExtra + 2 menuFormule), 0 delete; single-transaction payload ≈ 49 KB.
- Pre-sync backup: `.planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-194217.json`. It holds 200 documents, counts {menuItem 167, menuCategory 26, menuExtra 5, menuFormule 2}, perspective raw and 0 `m26-` ids. It is the only backup file.
- `--rollback --dry-run` → `ROLLBACK PLAN backup=.planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-194217.json restore=0 delete=0`.
- Production unchanged after all runs (read-only curl): `count(m26-*) = 0`, `count(menuItem available==true) = 167`, 200 menu docs, 0 hidden. The token never appears in any output or file.
- Photos: the report lists 3 rows « copiée » with run-time asset refs: Gyozas ← « Gyoza porc » (`item-e3480244`), Tantan Ramen ← « Tantan Ramen » (`item-e3480254`) and Tokyo Ramen ← « Tokyo Ramen » (`item-e3480256`).

## Task Commits

1. **Task 1 RED: failing validator** - `1243c1c` (test)
2. **Task 1 GREEN: transcription JSON (+ validator dedupe fix)** - `5688d77` (feat)
3. **Task 2: sync-menu.mjs + discrepancy report + pre-sync backup** - `b909224` (feat)

**Plan metadata:** see the final `docs(12-02)` commit (SUMMARY only; STATE/ROADMAP are left to the orchestrator for this wave).

## Files Created/Modified

- `scripts/menu-2026/menu-schema.mjs`: `validateMenu()` (rules a–h: keys/order, sections, locale objects, one pricing mode, badges/flags/legacyIds/imageFrom, no `??`/Asashi/dotted degree in web strings, corrections + ekToConfirm, golden values), `allPrices()`, constants.
- `scripts/menu-2026/validate-menu.mjs`: CLI. `--crosscheck` checks the price set and the normalised text fidelity (NFC, apostrophes, lower-case without œ folding, CJK vertical-label join, hyphen/French spacing) against the `*-print.txt` layers, with the 5-entry `TEXT_ALLOWLIST`. `--file` validates another JSON (tests).
- `scripts/menu-2026/menu-2026.json`: the transcription (single sync input).
- `scripts/menu-2026/sync-menu.mjs`: modes `--dry-run` (default), `--backup-only`, `--apply [--skip-live-guard]` and `--rollback [--backup <file>] [--dry-run]`, plus `--full` and `--dump <file>`.
- `.planning/phases/12-synchronisation-menu-print-2026-sanity/12-DISCREPANCY-REPORT.md`: FR report with the 9 required sections. `Statut : SIMULATION`; the rollback command names the backup above.
- `.planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-194217.json`: the pre-sync snapshot.

## Visual transcription: PNGs read

All were rendered with PyMuPDF into the session scratchpad (`scratchpad/umai-print/`, not copied into the repo) and read with the Read tool:
- Food: `plats-p1.png` (150 dpi spread), `plats-p1-r0c0.png`, `plats-p1-r0c1.png`, `plats-p1-r1c0.png`, `plats-p1-r1c1.png` (300 dpi tiles), `plats-p2.png` (cover: address only).
- Drinks: `boissons-p1.png` + `boissons-p1-r0c0/r0c1/r1c0/r1c1.png`, `boissons-p2.png` + `boissons-p2-r0c0/r0c1/r1c0/r1c1.png`.
- Zooms: `edamame-icons-900.png` (900 dpi) shows a leaf and a crossed wheat ear, so végétarien + sans gluten. `tantan-row-600.png` (600 dpi) shows only the « ~Notre best-seller~ » tag on Tantan Ramen, so no vegetarian icon.

**Visual reading vs planner's inventory: none differ.** Every item, price row, icon, sub-heading, JP label and the order match. The golden constants were kept as planned. Text-layer code points were checked: ASCII `~`, U+00D7 `×`, U+FF06 `＆` (ウイスキー＆ラム) and a single U+2019 (« l’eau »).

## Commands for Plan 03

```bash
# 0. (after the 12-01 code is deployed) preview; the live guard must print « LIVE GUARD: ok »
node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --dry-run            # optional: --dump <file> to review the exact mutations

# 1. apply (writes its own pre-sync backup first, one transaction, then POST-APPLY CHECK)
node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --apply
#    expected: SYNC SUMMARY mode=apply categories=20 items=77 hideLegacy=174 hideOrphanM26=0 slugSuffixed=7 drafts=0 imagesFromLegacy=3 imagesKept=0
#              APPLIED transactionId=…  /  POST-APPLY CHECK OK  /  report rewritten with « Statut : APPLIQUÉ … »

# 2. rollback if needed (preview first; without --backup it picks the newest backup with no m26- docs = the apply backup)
node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback --dry-run
node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback --backup .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-194217.json
```

Both backups (this one and the one `--apply` writes) describe the same pre-sync state unless Studio edits happen in between. Prefer the one written by `--apply`, which the regenerated report names.

## Decisions Made

- **legacyIds:** the planner's suggestions were all confirmed against the read-only export. Clear same-product matches were added for cafés, green teas and infusions (listed in key-decisions). These matches only affect the report: « remplacé par » rows and price/text comparisons. Hibiki (legacy « 17 ans », 22 €), Yamazaki (legacy « Distiller's Reserve »), Toki (legacy only as « Toki Highball »), the two « Gelée … en infusion » and « Blue mountain » thé noir are left unmapped (« Never guess »).
- **ekToConfirm #3** is worded without the typo, so « Asashi » occurs only in `corrections`, as the must-have truth requires. The report still shows it in the corrections table.
- No STATE.md / ROADMAP.md / REQUIREMENTS.md updates (parallel-wave instruction). MENU-01..06 are listed above because this plan delivers their data, tool and report; production publication is Plan 12-03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate « GOLDEN <key>: item missing » message**
- **Found during:** Task 1 (negative probe « drop an item »)
- **Fix:** `checkGolden` reports a missing golden item once.
- **Files modified:** scripts/menu-2026/menu-schema.mjs
- **Committed in:** 5688d77

**2. [Rule 2 - Robustness] Backup naming and « most recent » selection**
- **Found during:** Task 2 (unit-check harness)
- **Issue:** Two backups in the same second would collide; `wx` refuses to overwrite, so the run aborts safely but confusingly. Ordering by file name also puts a plain backup and a `-pre-rollback` backup from the same second in the wrong order.
- **Fix:** On collision the script waits for the next second and keeps the `menu-backup-<YYYYMMDD-HHmmss><suffix>.json` pattern. The newest backup is picked by `exportedAt`.
- **Committed in:** b909224

**3. [Rule 2 - Safety] Rollback hardening**
- An external-reference guard aborts before any write when a non-m26 document references an m26 document; the transaction would fail anyway.
- The `-pre-rollback` safety backup is written right before the commit, after the plan, the reference check and the no-op check. It still precedes every Sanity write, and aborted or no-op rollbacks leave no file behind.
- `--rollback` only warns when `menu-2026.json` is invalid, because it uses the backup, not the JSON. The other modes still exit 1 before any network call.
- **Committed in:** b909224

**4. [Rule 2 - Usability/safety] CLI guard rails**
- Unknown or conflicting flags (e.g. `--apply --dry-run`) exit 2 instead of silently defaulting to dry-run.
- The apply path refuses any mutation other than createOrReplace and patch, so `.delete(` exists only in `runRollback`.
- `--dump <file>` (dry-run only) writes the exact planned mutations for review.
- `validate-menu.mjs --file <path>` exists for negative tests.
- `validateMenu` adds a few checks on top of the spec: allowed fields per object, a legacy id mapped by at most one item, no `drafts.` ids, ALL-CAPS check on category names too.
- **Committed in:** 1243c1c, 5688d77, b909224

---

**Total deviations:** 4 groups (1 bug fix, 3 robustness or safety additions). **Impact:** no scope change. The planned interface, output lines, report headings and modes are exactly as specified.

## Unit-check of --apply / --rollback (no production write)

The harness lives in `scratchpad/sync-12-02/` and is not committed. It runs real CLI invocations of copies of the three scripts placed in a fake root. A Node loader hook replaces `@sanity/client` with an in-memory store. That store evaluates real GROQ with `groq-js`, applies transactions atomically and checks references. The live-guard `fetch` is stubbed, and the credentials are fake.

The fake root has no `node_modules` above it, and the fake client refuses any projectId other than the fake one, so production cannot be reached. The store is seeded from the 200-doc pre-sync backup. Result: **66/66 checks pass**:
- dry-run identical to production;
- apply blocked by the guard (exit 3, no backup);
- usage errors (exit 2);
- apply: APPLIED + POST-APPLY CHECK OK, 3 photos copied, legacy photo kept, report « APPLIQUÉ »;
- re-apply is idempotent: hideLegacy=0, imagesKept=4 with an EK Studio photo and hotspot kept, `DRIFT m26-item-hibiki: name` reported and reset;
- orphan m26 item hidden;
- rollback dry-run gives `restore=174 delete=98`;
- rollback blocked by an external reference with nothing written;
- rollback restores the exact initial ids and `available` flags (the formules' field is removed again);
- a second rollback is a no-op;
- invalid JSON means nothing is read or written;
- a missing legacy photo gives a WARN and a failed post-apply check with exit 1.

The real client's offline `transaction().serialize()` confirmed the createOrReplace / patch set / patch unset / delete payloads.

## Issues Encountered

- The session scratchpad is shared with the parallel 12-01 executor. I briefly created 3 harness files inside its `scratchpad/harness/` directory. Birth time equals mtime and none of its files reference them, so nothing was overwritten. I moved them to `scratchpad/sync-12-02/`.

## Known Stubs

None. The grep hits for « placeholder » are validator code that detects the print's placeholders.

## User Setup Required

None.

## Next Phase Readiness

- Plan 03 can run `--apply` as soon as the 12-01 code is deployed and `LIVE GUARD: ok` shows. The report is ready for EK's post-hoc review: 23 added items, price changes, text changes, 174 hidden docs, 3 photos, 13 corrections, 15 + 7 points to confirm.
- Phase 14 re-runs the same sync after adding en/de/it/zh to the JSON locale objects. Images kept on re-runs are reported as « conservée ».

## Self-Check: PASSED

---
*Phase: 12-synchronisation-menu-print-2026-sanity*
*Completed: 2026-11-23*
