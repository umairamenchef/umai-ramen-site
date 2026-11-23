---
phase: 12-synchronisation-menu-print-2026-sanity
plan: 03
subsystem: content-sync
tags: [sanity, deploy, revalidate, hmac, verification, menu, next-cache, groq-js]

# Dependency graph
requires:
  - phase: 12-synchronisation-menu-print-2026-sanity (plan 01)
    provides: "Backward-compatible schema + FR rendering (variants, prix sur demande, badges, sub-groups, sections, page notes, JSON-LD offers), hardened home queries"
  - phase: 12-synchronisation-menu-print-2026-sanity (plan 02)
    provides: "menu-2026.json (20 categories / 77 items), sync-menu.mjs (dry-run / apply / rollback with backup), draft discrepancy report"
provides:
  - "scripts/menu-2026/verify-live.mjs: verifies a live URL or a prerendered HTML file against menu-2026.json + menu.* messages (m26 / legacy expectations, --home, retries)"
  - "scripts/menu-2026/revalidate.mjs: signed POST /api/revalidate per Sanity type (node:crypto HMAC, --self-test against @sanity/webhook)"
  - "Phase 12 code live on umai-ramen.fr (commit 34748ef), 2026 print menu published in Sanity production (transaction PS4gSiVcUV6cnzSF8ooJME), live cache refreshed and verified FR/EN/DE/home"
  - "Pre-apply backup menu-backup-20261123-201142.json + dry-run-tested rollback path; 12-DISCREPANCY-REPORT.md marked APPLIQUÉ with « Vérification en ligne »"
affects: [13 tourist menu page, 14 translations (re-run sync --apply then revalidate.mjs), 15 QR supports]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Publish = sync-menu.mjs --apply, then revalidate.mjs (signed revalidateTag); tagged Sanity fetches never expire on their own"
    - "verify-live.mjs walks the print JSON with a cursor: order + per-item price binding on the visible text (scripts/styles/comments stripped, NBSP normalized)"
    - "Shadow build: real `next build` fed a planned dataset through a fetch-intercept preload (groq-js), to see post-sync HTML before any production write (scratchpad only)"

key-files:
  created:
    - scripts/menu-2026/verify-live.mjs
    - scripts/menu-2026/revalidate.mjs
    - .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-201142.json
  modified:
    - .planning/phases/12-synchronisation-menu-print-2026-sanity/12-DISCREPANCY-REPORT.md

key-decisions:
  - "Live cache refresh = rung b (signed revalidate.mjs, 4 x 200): no Sanity webhook refreshes umai-ramen.fr today; Phase 14 publishes the same way (sync --apply, then revalidate.mjs)"
  - "verify-live legacy markers are locale-aware: legacy EN/DE render « Paitan Ramen » / « Chintan Ramen », so the FR-only « Ramen Paitan » marker of the plan could never pass on /en and /de"
  - "Price binding refuses a match glued to a preceding digit (« 8,90 € » never matches inside « 18,90 € »); failures print by severity (MISSING, ORDER, PRICE first) with a per-kind tally"
  - "Before the production write, the planned post-sync dataset was rendered by a real next build (fetch-intercept + groq-js, scratchpad only) and passed every m26 check: the write went ahead only after that"

patterns-established:
  - "Deploy gate: code first (verify --expect legacy live), then content (verify --expect m26 live)"
  - "Every content-checked local build purges .next/cache/fetch-cache first"

requirements-completed: [MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06]

# Metrics
duration: 29min
completed: 2026-11-23
---

# Phase 12 Plan 03: Deploy, sync and live verification Summary

**The Phase 12 code went live by SSH and was proven on the old menu. The 2026 print was then written to Sanity production in one transaction after a 200-doc backup. Signed `revalidateTag` calls refreshed the live cache, and umai-ramen.fr now passes 309 print-fidelity checks per locale (FR/EN/DE) plus the home checks: 3 Sanity card photos and Tantan 15,90 €.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-11-23T19:50:26Z
- **Completed:** 2026-11-23T20:19:30Z
- **Tasks:** 3/3
- **Files:** 4 (2 scripts created, 1 backup created, 1 report modified)

## Rollback points

| What | Rollback point | How |
|---|---|---|
| Code (VPS) | `2523057` (VPS HEAD before deploy) | `ssh umai-app 'cd /home/ek/apps/umai && git reset --hard 2523057 && docker compose -p umai up -d --build web'` |
| Content (Sanity) | `.planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-201142.json` (200 docs, written by `--apply` right before the transaction) | `node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback --backup <that file>`, then `revalidate.mjs`, then `verify-live.mjs --expect legacy`. Dry-run tested: `restore=174 delete=97`. |

Deployed commit: `34748ef` (VPS HEAD = local HEAD at deploy time). Later commits (`a5418b7` and this docs commit) only touch `.planning/`, so they need no redeploy.

## Accomplishments

- **Task 1, tooling.**
  - `verify-live.mjs` checks each category (name, JP label, description, footnote, sub-groups). It walks the 77 items in print order with a cursor and checks, in each item's own text segment: its prices (3/6/9 pcs, 25/50cl, 12/75cl, « 3 × 6cl »), « Prix sur demande », badges, description and JP label. It also checks the page notes and section headings.
  - It checks that `??`, « Asashi », raw `menu.*` keys, the formules title and 24 legacy names are absent.
  - With `--home`: exactly 3 `/<locale>/menu` card links with a cdn.sanity.io image, and the Tantan price. On menu pages: 0 Sanity images.
  - `revalidate.mjs` signs exactly like `@sanity/webhook` (`SELF-TEST OK`).
  - `revalidate.mjs --types siteSettings` → **HTTP 200**: the local secret matches the VPS, so rung c was never needed.
  - Negative check before deploy: the live site (old code, old data) failed `--expect m26` with exit 1, **52 MISSING lines** and `VERIFY FAILED failures=160`.
- **Beyond the plan, before any write.** A shadow `next build` rendered the planned post-sync dataset: the 245 published docs plus the 271 dumped mutations, answered by a groq-js fetch-intercept preload kept in the scratchpad.
  - It passed `--expect m26` on FR/EN/DE menus (309 checks each) and FR/EN/DE homes.
  - 12 mutated copies of that output each failed with the right line:
    - price swap and price drift → `PRICE`;
    - reordered items → `ORDER`;
    - `??` / Kimchi → `PRESENT`;
    - dropped description, JP label, badge and « Prix sur demande » → `DESC` / `JP` / `BADGE` / `PRICE`;
    - injected Sanity image → `MENU_IMAGES 1`;
    - raw key → `PRESENT raw message key`;
    - 2 card photos → `HOME_CARD_IMAGES 2/3`.
- **Task 2, deploy.**
  - Gates: tsc 0, 29/29 tests, validator OK (20/77/34, 201 text checks), purged build with legacy data verified in FR/EN/DE/home.
  - Pushed `48d25cb..34748ef`.
  - SSH deploy: the first image build hit the transient Google Fonts error (see Issues); the old container kept serving, and the retry succeeded.
  - Live with legacy data: `VERIFY OK … expect=legacy` for fr/en/de and the fr home; /studio, /fr, /en, /de and /fr/menu return 200.
- **Task 3, sync.**
  - Dry-run: `LIVE GUARD: ok` and the same numbers as Plan 02.
  - `--apply`: `BACKUP …menu-backup-20261123-201142.json documents=200`, `APPLIED transactionId=PS4gSiVcUV6cnzSF8ooJME`, `POST-APPLY CHECK OK`.
  - PRE-FLIGHT on the real synced data (purged build): all VERIFY OK.
  - Refresh ladder: rung a failed for 4 minutes, rung b (4 × 200) fixed it on the first verify attempt.
  - Final live checks: all OK. Read-only Sanity counts: all as expected. The report was finalized, committed and pushed (`a5418b7`).

## Verify outputs (live, after sync)

```
SYNC SUMMARY mode=apply categories=20 items=77 hideLegacy=174 hideOrphanM26=0 slugSuffixed=7 drafts=0 imagesFromLegacy=3 imagesKept=0
APPLIED transactionId=PS4gSiVcUV6cnzSF8ooJME
POST-APPLY CHECK OK
revalidate menuCategory -> 200 · menuItem -> 200 · menuExtra -> 200 · menuFormule -> 200
VERIFY OK target=https://umai-ramen.fr/fr/menu locale=fr expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/en/menu locale=en expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/de/menu locale=de expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/fr locale=fr expect=m26 home checks=8
VERIFY OK target=https://umai-ramen.fr/en locale=en expect=m26 home checks=10
VERIFY OK target=https://umai-ramen.fr/de locale=de expect=m26 home checks=10
```

**Refresh rung used: b** (`node --env-file=.env.local scripts/menu-2026/revalidate.mjs`). Rung a (waiting for a Sanity webhook) changed nothing in 4 minutes. The Sanity token cannot list webhooks (401, missing `sanity.project.webhooks/read`), so any existing webhook most likely still targets the dead umai.turfu.in.

**Live JSON-LD:** 20 sections, 77 items, one Offer per variant (Karaage 3, Asahi 2, Riesling 2, Asahi Super Dry « 33cl » 1, Trio « 3 × 6cl » 1) and no Offer for Année Lumière.

## Sanity counts (read-only, after apply)

| Query | Expected | Got |
|---|---|---|
| legacy menuItem/menuExtra/menuFormule with `available == false` | 174 (dry-run hideLegacy) | 174 |
| legacy menuCategory (nothing deleted) | 26 | 26 |
| `m26-` menuItem with `available == true` | 77 | 77 |
| `m26-` menuItem with an image (migrated home-card photos) | 3 | 3 |
| item-e3480244 / e3480254 / e3480256 still with their image (copy, not move) | 3 | 3 |
| legacy items/extras still available | 0 | 0 |
| formules with `available != false` | 0 | 0 |
| legacy item/extra/formule docs still present | 174 | 174 |
| `m26-` categories | 20 | 20 |
| menu drafts | 0 | 0 |
| visible « Tantan Ramen » | 1 | 1 |
| docs of the pre-apply backup still present | 200 | 200 |

Total menu documents: 297 (200 + 97).

## Task Commits

1. **Task 1: live tooling** - `34748ef` (feat)
2. **Task 2: deploy (manual SSH) + live legacy verification** - no commit (deploy-only task, no source change); deployed commit `34748ef`
3. **Task 3: apply sync, refresh, verify, finalize report** - `a5418b7` (docs: applied report + pre-apply backup)

**Plan metadata:** final `docs(12-03)` commit (SUMMARY, STATE, ROADMAP, REQUIREMENTS).

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The legacy marker in the plan spec was French-only**
- **Found during:** Task 1, first local build check
- **Issue:** `--expect legacy` required « Ramen Paitan » on every locale. The legacy category is translated in EN/DE (« Paitan Ramen »), so Task 2's EN/DE legacy gate could never pass.
- **Fix:** locale-aware markers (`LEGACY_PAITAN` / `LEGACY_CHINTAN`), used in the legacy menu check and both home checks. « Paitan Ramen » and « Chintan Ramen » were added to `LEGACY_ABSENT`; neither string occurs in menu-2026.json or the messages (checked).
- **Files modified:** scripts/menu-2026/verify-live.mjs
- **Commit:** 34748ef

**2. [Rule 1 - Bug] The capped output hid the MISSING lines the acceptance criterion counts**
- **Found during:** Task 1, negative live run
- **Issue:** with checks printed in walk order, the 60-line cap was used up by category-level `JP`/`TEXT` lines. Only 14 `MISSING` lines showed, below the « ≥ 20 MISSING » acceptance criterion.
- **Fix:** failures print by severity (MISSING, ORDER, PRICE, image checks, PRESENT, … then TEXT, JP), stable within a kind, plus a `failures by kind:` tally. Result: 52 MISSING lines shown.
- **Files modified:** scripts/menu-2026/verify-live.mjs
- **Commit:** 34748ef

**3. [Rule 2 - Correctness] Stricter price binding, normalized expectations, retry on fetch errors**
- **Issue:**
  - a plain substring check lets « 8,90 € » match inside « 18,90 € »;
  - expected strings were not NBSP-normalized like the page text;
  - a fetch error (502 while the container restarts) would have ended a `--retries` run at once.
- **Fix:**
  - price needles must not follow a digit (a preceding « . » or letter is fine, verified on all 77 items);
  - expected strings use the same `norm()` as the page;
  - a fetch error on a non-final attempt is retried, and exits 2 only on the last attempt;
  - `--home` also asserts no `??`;
  - sub-group labels are checked once per category.
- **Commit:** 34748ef

**4. [Rule 3 - Blocking] Transient Google Fonts failure in the build (local once, VPS once)**
- **Found during:** Task 1 rebuild and Task 2 deploy
- **Issue:** `next build` (Turbopack) failed with `next/font/google queries have exactly one entry`. Google Fonts briefly served Outfit with `fonts.gstatic.com/l/font?kit=…&skey=…&v=v15` URLs, whose `&` breaks Turbopack's font-file import query.
- **Fix:** retried once in each case and both builds passed. 14 samples of the same CSS from both hosts then returned the normal `/s/` format. On the VPS the failed build left the old container serving (`up -d --build` builds before it swaps), so the site was never down.
- **Commit:** none (no code change)

### Additional verification beyond the plan

- Shadow build of the planned post-sync dataset, plus 12 negative probes (see Accomplishments). Kept in the scratchpad only, nothing committed.
- EN/DE homes checked (legacy before the sync, m26 after it).
- Live JSON-LD offers checked; `--rollback --dry-run` against the real post-sync state.
- Secret scan before each push: the token and the 3 other `.env.local` secrets occur 0 times in the outgoing commits, the report and the backup.

---

**Total deviations:** 4 (2 bug fixes to the plan's checker spec, 1 correctness hardening, 1 transient build flake handled by retry). **Impact:** none on scope. The CLI, output lines and checks are as specified, with a few strictly additive checks.

## Issues Encountered

- Turbopack + Google Fonts flake (above). It can hit any future deploy: if `docker compose … up -d --build web` fails with `next/font/google queries have exactly one entry`, rerun the same deploy command.
- The Sanity webhooks API returned 401 for the robot token (missing grant), so the existing webhook configuration could not be inspected.
- `sync-menu.mjs --dry-run` / `--apply` regenerate `12-DISCREPANCY-REPORT.md` from scratch. The hand-written `## Vérification en ligne` section will disappear on the Phase 14 re-run and must be re-added there.

## Deferred Issues

- **Sanity webhook to umai-ramen.fr** (EK / project admin): add a GROQ webhook (`_type` projection, secret = the VPS `SANITY_WEBHOOK_SECRET`) targeting `https://umai-ramen.fr/api/revalidate`. Studio edits by Loan/EK would then reach the site without running `revalidate.mjs`. Until then, a Studio menu edit stays invisible on the site until someone runs `revalidate.mjs` or a redeploy restarts the container.
- **Build robustness:** switching the 3 Google fonts to `next/font/local` (self-hosted files) would remove the build-time dependency on fonts.googleapis.com and the flake. This is out of scope here (it touches every page).

## Known Stubs

None. Both scripts are complete CLIs; the report and the backup are data.

## User Setup Required

None for this plan. Optional: create the Sanity webhook above.

## Next Phase Readiness

- Phase 13 builds the tourist layout on live 2026 data (`m26-` docs; categories have `section`, `nameJp`, `footnote`).
- Phase 14 adds en/de/it/zh to menu-2026.json, then runs `sync-menu.mjs --apply` (idempotent; Studio photos kept), then `revalidate.mjs`, then `verify-live.mjs` per locale. For translated content, extend `L()` in verify-live, which already prefers the locale over FR.

## Self-Check: PASSED

- Files: `scripts/menu-2026/verify-live.mjs`, `scripts/menu-2026/revalidate.mjs`, `backup/menu-backup-20261123-201142.json`, `12-DISCREPANCY-REPORT.md` (APPLIQUÉ, `## Vérification en ligne`, `--rollback --backup`, backup filename) are all present.
- Commits `34748ef` and `a5418b7` exist locally and on `origin/v2-2026`.

---

## Remise à EK (FR)

**Rapport :** `.planning/phases/12-synchronisation-menu-print-2026-sanity/12-DISCREPANCY-REPORT.md` (statut APPLIQUÉ, section « Vérification en ligne »).

Le menu en ligne (https://umai-ramen.fr/fr/menu) reprend maintenant l'imprimé 2026 : 20 catégories, 77 articles, prix et variantes. Les anciens plats sont masqués, pas supprimés : ils restent dans Studio avec « disponible » décoché. EN/DE affichent le même menu en français en attendant les traductions (phase 14).

**À confirmer par EK (revue a posteriori) :**
1. Année Lumière millésime 2023 : prix 12cl / 25cl / 50cl à fournir. En attendant, le site affiche « Prix sur demande ».
2. Trio dégustation : description provisoire « Trois sakés sélectionnés par notre équipe. » (texte du BAT, l'imprimé n'en a pas).
3. Bière bouteille : la coquille de marque est corrigée en « Asahi Super Dry » sur le site.
4. Pas de « 1/2 boules » sur l'imprimé : « Boule de glace au choix » est à 3,00 €, prix unique.
5. « Version végétarienne disponible » n'apparaît pas sur l'imprimé : le badge existe dans Studio mais aucun plat ne le porte.
6. Edamame : les deux pictos de l'imprimé sont lus comme « végétarien » et « sans gluten ».
7. Les 3 photos des cartes « Notre Menu » de l'accueil sont reprises des anciens articles masqués : Gyoza porc → Gyozas, Tantan Ramen → Tantan Ramen, Tokyo Ramen → Tokyo Ramen. Les autres nouveaux plats n'ont pas de photo ; on peut en ajouter dans Studio, une nouvelle synchronisation ne les écrase pas.
8. EN/DE : contenu en français seulement jusqu'à la phase 14.

Le rapport liste aussi les autres points (15 au total, plus les 7 slugs suffixés « -2026 »).

**Retour arrière si besoin :**

```
node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback --backup .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-201142.json
node --env-file=.env.local scripts/menu-2026/revalidate.mjs
node scripts/menu-2026/verify-live.mjs --locale fr --expect legacy --retries 6 --interval 20
```

**À savoir :** une modification du menu dans Studio n'apparaît pas toute seule sur le site, car aucun webhook Sanity ne pointe vers umai-ramen.fr. Il faut lancer `revalidate.mjs`, ou créer le webhook (voir « Deferred Issues »).
