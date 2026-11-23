---
phase: 14-traductions-en-de-it-zh
plan: 02
subsystem: content
tags: [sanity, field-level-patches, ifRevisionId, rollback, verification, review-sheet, csv, node-test, tdd, i18n]

requires:
  - phase: 14-traductions-en-de-it-zh (plan 01)
    provides: "translation-rules.mjs (translatableFields, TRANSLATION_LOCALES, validateTranslations, mergeTranslations, formatMenuJson), the two staging overlays, check-translations.mjs --out (merged preview of 178 fields / 712 values)"
  - phase: 12-synchronisation-menu-print-2026-sanity
    provides: "the 97 published m26-* documents (20 categories + 77 items, deterministic ids, price variants keyed v<i>), the sync-menu.mjs backup / exit-code patterns, menu-schema.mjs validateMenu"
  - phase: 13-fondations-multilingues-page-menu-touriste
    provides: "the secondary French line markup (data-fr-name, span lang=fr) and the src/lib/menu.ts rule that frenchSecondaryNames mirrors"
provides:
  - "scripts/menu-2026/translation-patches.mjs: pure planners (patchTargets, readLocaleObject, planTranslationPatches, planTranslationRollback, stripTranslations); field-level set patches only"
  - "scripts/menu-2026/apply-translations.mjs: CLI --dry-run | --apply | --rollback with verified JSON backup, one ifRevisionId transaction, conflict / drift / draft / missing-document guards, post-apply check, safety backup on rollback"
  - "scripts/menu-2026/translation-checks.mjs: pure page checks (frenchSecondaryNames, frenchLeakCandidates, extractFrenchNameLines, visibleText, htmlLang) and the review sheet (buildReviewRows, toCsv)"
  - "scripts/menu-2026/verify-translations.mjs: LANG / FRNAME / FRLEAK proof of the translated menu pages (live URL or HTML file), with retries"
  - "scripts/menu-2026/export-review-sheet.mjs: published, read-only Sanity export to 14-REVIEW-SHEET.csv (TRANS-03), --strict"
  - "70 node:test cases (43 + 27), 106 with the 14-01 rules suite, all passing before and after the Plan 14-03 merge"
affects: [14-03 merge + Sanity publish + live proof + review sheet, 15-qr-codes]

tech-stack:
  added: []
  patterns:
    - "Pure planner module + thin CLI whose main(argv, deps) is exported: the whole write path (backup, transaction, post-apply check, rollback) runs in node:test against an in-memory fake Sanity, and was also run through the real @sanity/client against a local mock HTTP server"
    - "Field-level set / unset patches guarded by ifRevisionId in one transaction; a plan that is not clean (conflict, French drift, open draft, missing document) aborts with nothing written"
    - "Scratch workspace + one-command path-limited landing while Phase 13 ran in the same tree (no index.lock collision this time)"

key-files:
  created:
    - scripts/menu-2026/translation-patches.mjs
    - scripts/menu-2026/translation-patches.test.mjs
    - scripts/menu-2026/apply-translations.mjs
    - scripts/menu-2026/translation-checks.mjs
    - scripts/menu-2026/translation-checks.test.mjs
    - scripts/menu-2026/verify-translations.mjs
    - scripts/menu-2026/export-review-sheet.mjs
  modified: []

key-decisions:
  - "Planner semantics: a blank or non-string existing value counts as absent (set, no conflict); an identical value is skipped; a different non-blank value is a conflict (listed, set only with --overwrite-existing); French in Sanity is compared exactly to the JSON French and a missing Loc or price variant is French drift"
  - "drafts are listed whenever a drafts.<target> document exists and are patched (with their own _rev, same drift rule) only with --include-drafts; drafts of non-targets and versions.* documents are ignored"
  - "A commit failure that is not a revision mismatch (HTTP 409) is reported as an unknown outcome, never as 'Nothing written': only a revision mismatch proves the transaction was refused"
  - "verify-translations retries a page whose checks fail (revalidation lag), not only fetch errors, exactly like verify-live.mjs; with the default --retries 0 the behaviour is the plan's"
  - "FRLEAK candidates exclude French texts under 5 characters, texts equal to or contained in any string of the locale; FR_LEAK_ALLOW stays empty"

patterns-established:
  - "Result lines (OK / ABORT / APPLIED / POST-APPLY / ROLLBACK / REVIEW SHEET / VERIFY TRANSLATIONS) go to stdout so tee and grep work; usage, env and unexpected errors go to stderr (exit 2 or 1)"
  - "Mutation checks on a throwaway copy to prove a green suite has teeth (29 mutations, 27 caught, 2 provably equivalent)"

requirements-completed: []  # TRANS-01 (publishing side) and TRANS-03 (tool side) are delivered and proven offline and read-only; per the plan REQUIREMENTS.md stays untouched, Plan 14-03 ticks TRANS-01..03 after the live proof

duration: 18min
completed: 2026-11-23
---

# Phase 14 Plan 02: Field-level translation publisher, page verifier and review-sheet export Summary

**A guarded, reversible field-level publisher (backup, ifRevisionId transaction, conflict / drift / draft guards, post-apply check, rollback), a page-level proof that French only appears as the secondary FR line, and a regenerable FR | EN | DE | IT | ZH review sheet, all tested offline and shown read-only against production to accept exactly 712 values on 97 documents.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-11-23T22:36:22Z
- **Completed:** 2026-11-23T22:55Z
- **Tasks:** 2/2 (both TDD, RED then GREEN)
- **Files created:** 7 (+ this SUMMARY), nothing modified

## Accomplishments

- `apply-translations.mjs --dry-run` against production with the merged preview prints exactly `TRANSLATION PLAN docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0` (Target `c7twe801/production`). The 712 SET lines are all `<field>.en|de|it|zh` keys on 97 documents (name 388, description 232, subgroup 84, footnote 4, price label 4).
- The apply and rollback paths were exercised end to end without ever touching production: 16 CLI tests (argument parsing plus 15 end to end on an in-memory fake Sanity), and a scratch run of the real `@sanity/client` against a local mock HTTP server (one mutate call per apply, 97 patch mutations each with `ifRevisionID`, `visibility=sync`, a 409 mapped to the ABORT line, rollback restoring French-only documents).
- `verify-translations.mjs` proves the Phase 13 secondary-line rule on a page: offline fixtures give `OK   zh frNames=26` and `OK   en frNames=25`, and the two mutations fail with `FAIL FRLEAK zh` / `FAIL FRNAME zh`. It also passes real Next.js chrome: pages built from the real prerendered `/{en,de,it,zh}/menu` with the translations substituted pass with 25 / 26 / 26 / 26 French lines and no false positive from header or footer text, while the unmodified (still French) real pages fail on en/de/it/zh and pass on fr.
- `export-review-sheet.mjs` reads the published Sanity menu read-only: `REVIEW SHEET rows=178 categories=20 items=77 empty=712`, BOM `ef bb bf`, header line exactly `Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)`, 179 CRLF lines, byte-identical on a rerun, `--strict` exits 1 with the file still written.
- Nothing written to Sanity, no backup file exists, no build, no npm, no push, no SSH; `menu-2026.json` byte-identical; STATE.md, ROADMAP.md and REQUIREMENTS.md untouched.

## Task Commits

1. **Task 1 RED: failing tests for the translation patch planner and the CLI** - `b88c77f` (test)
2. **Task 1 GREEN: field-level translation patches with backup, guards and rollback** - `9fac420` (feat)
3. **Task 2 RED: failing tests for page checks and the review sheet** - `358bbe4` (test)
4. **Task 2 GREEN: translated-page verifier and Sanity review-sheet export** - `894eab5` (feat)

Each commit contains only its own plan files, by explicit path (`git show --stat`). Phase 13 committed `1350fff` and `e145bdf` in between; no `index.lock` collision occurred.

## Files Created

- `scripts/menu-2026/translation-patches.mjs` (233 lines): pure planners, one import (`./translation-rules.mjs`).
- `scripts/menu-2026/translation-patches.test.mjs` (949 lines): 43 tests, planner units plus the CLI on a fake Sanity.
- `scripts/menu-2026/apply-translations.mjs` (431 lines): Node 24 ESM CLI, no `createOrReplace`, no `.delete(`, `ifRevisionId(` on every patch.
- `scripts/menu-2026/translation-checks.mjs` (204 lines): pure page checks and review sheet, one import.
- `scripts/menu-2026/translation-checks.test.mjs` (589 lines): 27 tests, helpers plus both CLIs offline.
- `scripts/menu-2026/verify-translations.mjs` (219 lines): page verifier CLI, no dependency.
- `scripts/menu-2026/export-review-sheet.mjs` (133 lines): Sanity to CSV export CLI.

## CLI Usage and Exact Output Lines (Plan 14-03 greps these)

All result lines go to stdout; usage and env errors (exit 2) and unexpected failures (exit 1) go to stderr. Tokens are never printed (checked in every captured output).

### apply-translations.mjs

```
node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --dry-run [--json <file>] [--overwrite-existing] [--include-drafts] [--full]   (default mode)
node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --apply [--overwrite-existing] [--include-drafts]
node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --rollback --backup <file> [--dry-run] [--full]
```

Exit 0 ok, 1 refused or failed, 2 usage or missing env (`--json` only with the dry-run mode, `--backup` only with `--rollback`, two modes, repeated or unknown flag, `--overwrite-existing` / `--include-drafts` with `--rollback`).

```
MENU JSON OK categories=20 items=77
TRANSLATIONS OK fields=178 values=712
Target: c7twe801/production
TRANSLATION PLAN docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0
SET m26-cat-entrees name.en            (15 lines, then "... 697 more SET lines (--full prints them all)"; --full prints all 712)
CONFLICT <id> <path>.<l> sanity="..." json="..."
FR DRIFT <id> <path> sanity="..." json="..."       (sanity=(missing) when the Loc or variant is absent)
DRAFT <id>
MISSING DOC <id>
DRY RUN: nothing written to Sanity                 (dry-run end, exit 0)
```

`--apply` after the plan lines:

```
ABORT: <reasons>. Nothing written.                 (conflict without --overwrite-existing, FR drift, draft without --include-drafts, missing document; exit 1)
NOTHING TO DO                                      (idempotent re-run: patched=0 skip=712, then the post-apply check)
BACKUP .planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-<YYYYMMDD-HHmmss>.json documents=97
APPLIED transactionId=<id> patches=97 values=712
POST-APPLY CHECK OK docs=97 values=712             (or one "POST-APPLY CHECK FAILED <what>" line per failure, exit 1)
ABORT: a document changed during the run (<message>). Nothing written, rerun.     (revision mismatch, exit 1)
ERROR the transaction failed (<message>). Sanity applies it all or not at all, but its outcome is unknown: run --dry-run ...   (any other commit failure, exit 1)
```

`--rollback`:

```
ROLLBACK PLAN backup=<rel path> docs=97 set=0 unset=712      (for a backup taken from the French-only state)
PATCH <id> set=<n> unset=<n>                                 (15, or all with --full)
SAFETY BACKUP <rel path>-pre-rollback.json documents=<n>
ROLLBACK OK transactionId=<id>      |      ROLLBACK OK (nothing to do)
```

Validation failure (before any env check or network call, exit 1): up to 80 `ERROR <rule error>` lines, `… <n> more`, `TRANSLATIONS FAILED errors=<n>: nothing read from or written to Sanity`, no `Target:` line.

### verify-translations.mjs

```
node scripts/menu-2026/verify-translations.mjs [--base <url>] [--locale fr|en|de|it|zh] [--target <url|file>] [--json <menu json>] [--retries N] [--interval S]
OK   <l> frNames=<n> leakChecks=<n> target=<t>
FAIL LANG <l> html lang="<x>", expected "<y>"
FAIL FRNAME <l> page has <n> French line(s), expected <m>; first difference at index <i>: page=<"..."|(none)> expected=<"..."|(none)>
FAIL FRLEAK <l> French text on the page: "<text>"          (40 FAIL lines per locale at most, then "… <n> more")
attempt <k>/<N> <l> failures=<n> (e.g. ...)                 (between retries)
VERIFY TRANSLATIONS OK locales=<n>                          (last line, exit 0)   |   VERIFY TRANSLATIONS FAILED failures=<n>   (exit 1)
```

Usage, file and network errors exit 2 (HTTP other than 200 and fetch errors are retried first). Defaults: base `https://umai-ramen.fr`, all five locales on `<base>/<l>/menu`, menu `scripts/menu-2026/menu-2026.json`, retries 0, interval 30.

### export-review-sheet.mjs

```
node --env-file=.env.local scripts/menu-2026/export-review-sheet.mjs [--out <file>] [--strict]
REVIEW SHEET rows=178 categories=20 items=77 empty=<n> file=<path>     (path relative to the repo root when inside it)
STRICT: <n> empty cells                                                 (--strict with empty > 0, exit 1, file still written)
```

Default file `.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv`. SANITY_TOKEN is optional (used when present).

## Production Read-Only Proof

| Time (UTC) | Run | Result |
|---|---|---|
| 22:42:14 | `--dry-run --json <merged preview>` (scratch copy) | `TRANSLATION PLAN docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0`, exit 0 |
| 22:52:22 | `export-review-sheet.mjs --out <scratch>` | `REVIEW SHEET rows=178 categories=20 items=77 empty=712` |
| 22:54:10 | landed CLI from the repo, `--dry-run --json <merged preview>` | identical plan line; second export byte-identical (`cmp`) |

The default `--dry-run` (no `--json`, as Plan 14-03 runs it after the merge) was also run on a post-merge simulation (merged file as `menu-2026.json`, no overlays) and printed the same plan line. Output files contain no token occurrence.

**Phase 13 probe interference: none observed.** Phase 13 committed its probe tooling at 22:42Z (its own probe runs date from 22:26Z and 22:37Z); all three production reads above came back clean (`skip=0 conflicts=0` and `empty=712`, so none of the `name.it` / `name.zh` probe values on `m26-item-karaage` / `m26-cat-entrees` was live). No retry or 5-minute wait was needed. Note for later: the Phase 13 probe exits 3 (PROBE SKIP) once it/zh content exists, so it cannot be rerun after Plan 14-03.

## Offline Verify Lines

```
fake-zh.html        OK   zh frNames=26 leakChecks=99 target=...fake-zh.html            VERIFY TRANSLATIONS OK locales=1   exit 0
fake-en.html        OK   en frNames=25 leakChecks=95 target=...fake-en.html            VERIFY TRANSLATIONS OK locales=1   exit 0
fake-zh-leak.html   FAIL FRLEAK zh French text on the page: "Bouillon de poulet au sésame, huile de piment, bœuf haché, pousses de soja, pak-choï, daikon et demi-œuf mariné."   exit 1
fake-zh-drop.html   FAIL FRNAME zh page has 25 French line(s), expected 26; first difference at index 2: page="Oeuf onsen" expected="Oeuf mariné entier"   exit 1
```

Real-page calibration (scratch copies of the Phase 13 prerendered pages, not part of the repo): `fr` OK with `frNames=0 leakChecks=0`; en / de / it / zh fail with `FRNAME` (0 lines, first expected « Miso végétarien ») and many `FRLEAK` (the pages still hold French content). Pages rebuilt from the real chrome with the translations substituted and the Phase 13 FR line inserted: `OK en frNames=25 leakChecks=95`, `OK de frNames=26 leakChecks=97`, `OK it frNames=26 leakChecks=99`, `OK zh frNames=26 leakChecks=99`. These are the counts Plan 14-03 expects live (fr 0, en 25, de 26, it 26, zh 26).

## Smoke Sheet Facts

`$T/sheet-smoke.csv` (scratch): first bytes `ef bb bf`; line 1 `Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)`; 179 lines, 179 CRLF; 11 840 bytes while Sanity is French-only (712 empty cells); a second export is byte-identical; `--strict` printed `STRICT: 712 empty cells` and exited 1 with the file written. Row labels are `Catégorie : nom`, `Catégorie : description`, `<FR item name> : nom | description | sous-groupe | libellé de prix[ 2]`, `Catégorie : note de bas`; the first column is the category's French name. The FR column of the 178 rows equals `translatableFields` order, so Plan 14-03's `SHEET == JSON` comparison is built on the same ordering.

## Policies Plan 14-03 Must Follow

1. Run `apply-translations.mjs --dry-run` (no `--json`, after the merge) first; the clean state is exactly `docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0`.
2. `--overwrite-existing` only for conflicts you can name from the `CONFLICT` lines (for example a Phase 13 probe value left on `m26-item-karaage` / `m26-cat-entrees`, or a translation EK corrected in Studio). Never as a blanket flag.
3. `--include-drafts` only when a `DRAFT <id>` line shows an open Studio draft (otherwise publishing that draft later would erase the translations); the alternative is to publish or discard the draft first.
4. `FR DRIFT` means the French was edited in Studio since Phase 12: fold the Studio text into `menu-2026.json` (and recheck with `check-translations.mjs`) before applying; the planner never writes a translation next to French it did not read.
5. After `--apply`, record the `BACKUP` path and the `APPLIED transactionId`; then prove the rollback without writing: `--rollback --backup <file> --dry-run` must print `docs=97 set=0 unset=712`.
6. After `revalidate.mjs`, run `verify-translations.mjs --retries 3 --interval 20` (it retries failing checks too) and expect fr 0, en 25, de 26, it 26, zh 26 and `VERIFY TRANSLATIONS OK locales=5` as the last line.
7. `export-review-sheet.mjs --strict` from the repo root prints `file=.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv` and `empty=0` once Sanity is translated.
8. Both new test files pass before and after the merge (verified by a post-merge simulation: merged `menu-2026.json`, no overlay files, 106 of 106 tests pass).

## Decisions Made

See the `key-decisions` front matter. Besides those: the CLIs keep the sync-menu conventions (UTC stamp, `wx` backup flag, same-second collision wait, read-back length check, flushed exit) and every Sanity access goes through an injected client factory, which is what made the offline end-to-end tests possible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Invisible literal characters in the new source**
- **Found during:** Task 2 (mutation check "csv without BOM" reported NOT APPLIED because `grep FEFF` found nothing).
- **Issue:** the file-writing tool turned the `\u`-escapes I typed (BOM in `toCsv`, NBSP and narrow NBSP in `norm`, the same characters in the test) into raw invisible characters. They worked, but an invisible BOM inside source is fragile and unreviewable.
- **Fix:** replaced every occurrence by a visible escape through a script that builds the escape from char codes, re-ran the 27 tests, scanned all seven files for U+FEFF / U+00A0 / U+202F / U+200B (0 left). The RED commit `358bbe4` still holds the raw characters in the test file; `894eab5` replaces them.
- **Files modified:** translation-checks.mjs, translation-checks.test.mjs
- **Committed in:** `894eab5`

### Added beyond the plan (Rules 2 and 3, no change to any line Plan 14-03 greps)

**2. [Rule 2 - Correctness] `main(argv, deps)` exported from the three CLIs, with CLI tests inside the planned test files**
- The apply and rollback paths are the riskiest code of the phase and would otherwise have run for the first time in production. With an injected client, `translation-patches.test.mjs` covers usage errors, validation-before-network, dry-run, apply (backup, one transaction, ifRevisionId, post-apply), idempotent re-run, conflict, `--overwrite-existing`, FR drift, missing document, draft, revision race, unknown commit failure, a post-apply failure, rollback and its guards; `translation-checks.test.mjs` covers both other CLIs. No file outside the seven paths was needed.
- Scratch only (not in the repo): the real `@sanity/client` against a local mock HTTP server confirmed the mutation shape (`patch` only, `ifRevisionID`, `set` / `unset`, `visibility=sync`, `returnIds=true`), the `transactionId` parsing and the 409 mapping.

**3. [Rule 2 - Correctness] Write-path guards the plan did not spell out**
- A non-409 commit error says the outcome is unknown instead of claiming `Nothing written` (a timeout can follow a successful commit).
- A patch without a `_rev` throws before the backup is written (an unguarded patch is never sent).
- The rollback transaction is also guarded by `ifRevisionId` (revisions of the read taken just before the safety backup).
- `--help`, repeated flags and `--overwrite-existing` / `--include-drafts` with `--rollback` are usage errors (a silently ignored flag is a trap).

**4. [Rule 2 - Correctness] verify-translations retries failing checks, not only fetch errors**
- Plan 14-03 runs it with `--retries 3 --interval 20` right after a revalidation; retrying only transport errors would not wait for a stale page. Same loop as `verify-live.mjs`; identical to the plan with `--retries 0`.

**5. [Rule 3 - Determinism] Export query tie-break**
- `order(order asc)` became `order(order asc, _id asc)` in both clauses so the file stays byte-identical even if two documents ever share an `order`. Everything else in the query is the plan's.

**Total deviations:** 5 (1 bug fixed, 3 correctness additions, 1 determinism tweak). **Impact:** none on the contract; no scope creep (still the seven planned paths).

## Issues Encountered

- `\u`-escapes I typed into file content and into shell arguments arrived as raw characters (see deviation 1). Nothing else was affected: a search of all seven files shows no remaining invisible character, and escape-bearing mutation strings were built from char codes.
- Phase 13 rebuilt `.next/` while I worked; I only read copies of its prerendered `menu.html` files (scratch). `scripts/i18n/probe-translation.mjs` was untracked at the start and was committed by Phase 13 itself (`1350fff`), not by this plan.
- Mutation testing: 10 mutations on the Task 1 modules and 19 on Task 2 were applied to a throwaway copy. 27 are caught; two are equivalent mutations (the « identical to its translation » exclusion in `frenchLeakCandidates` is subsumed by the « contained in a string of the locale » rule, and the explicit NBSP class in `norm` is subsumed by JS `\s`), kept for fidelity with the plan and `verify-live.mjs`.

## Known Stubs

None. Every function is fully implemented; `FR_LEAK_ALLOW` is intentionally empty and documented (today no chrome string needs an exception, proven on the real prerendered chrome).

## Next Phase Readiness

- Plan 14-03 can run: merge (`check-translations.mjs --write`, after the Phase 13 gate), `apply-translations.mjs --dry-run`, `--apply`, rollback dry-run, revalidate, `verify-translations.mjs`, `export-review-sheet.mjs --strict`, with every expected line listed above.
- STATE.md, ROADMAP.md and REQUIREMENTS.md were not touched (bookkeeping suppressed; the orchestrator updates them). No requirement was marked complete.

## Self-Check: PASSED

- FOUND: scripts/menu-2026/translation-patches.mjs, translation-patches.test.mjs, apply-translations.mjs, translation-checks.mjs, translation-checks.test.mjs, verify-translations.mjs, export-review-sheet.mjs
- FOUND commits: b88c77f, 9fac420, 358bbe4, 894eab5 (the four contain only the seven plan paths)
- `node --test scripts/menu-2026/translation-patches.test.mjs scripts/menu-2026/translation-checks.test.mjs scripts/menu-2026/translation-rules.test.mjs`: 106 pass, 0 fail
- Plan Task 1 and Task 2 automated verify commands: both OK; `git diff --quiet -- scripts/menu-2026/menu-2026.json` clean; no `translations-backup-*.json` anywhere; no `createOrReplace` / `.delete(` in apply-translations.mjs
