---
phase: 14-traductions-en-de-it-zh
plan: 03
subsystem: content
tags: [i18n, translations, sanity, field-level-patches, ifRevisionId, revalidate, api-cdn, verification, review-sheet, zh-Hans, playwright]

requires:
  - phase: 14-traductions-en-de-it-zh (plan 01)
    provides: "the two staging overlays (178 fields, 712 values), translation-rules.mjs, check-translations.mjs --write"
  - phase: 14-traductions-en-de-it-zh (plan 02)
    provides: "apply-translations.mjs (dry-run / apply / rollback), verify-translations.mjs, export-review-sheet.mjs, translation-checks.mjs (frenchSecondaryNames, buildReviewRows, toCsv)"
  - phase: 13-fondations-multilingues-page-menu-touriste
    provides: "IT/ZH menu locales live (86068ab), the FR secondary line (data-fr-name + span lang=fr), Studio it/zh fields, verify-live.mjs for 5 locales, the Sanity API CDN finding"
provides:
  - "scripts/menu-2026/menu-2026.json: the single reviewable FR + EN/DE/IT/ZH source (overlays merged, then deleted)"
  - "Sanity c7twe801/production: the 712 translations on the 97 m26 documents (transaction lWwPwzVj4paFn3vV2NnUyI), live on /en, /de, /it and /zh/menu"
  - ".planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-20261123-232132.json (pre-write state, rollback source)"
  - ".planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv (FR | EN | DE | IT | ZH (à relire), regenerated from Sanity, TRANS-03)"
  - "Live evidence: VERIFY OK checks=309 x5 (+ home x3), VERIFY TRANSLATIONS OK locales=5 (fr 0, en 25, de 26, it 26, zh 26), ROUTING OK 84, MOBILE OK, 12 screenshots read"
affects: [15-qr-codes]

tech-stack:
  added: []
  patterns:
    - "Publishing translations: dry-run, apply (JSON backup + one ifRevisionId transaction of field-level set patches + post-apply check), rollback dry-run, wait until the API CDN serves the site's own queries, revalidate.mjs --delay 30, verify-live / verify-translations"
    - "API CDN freshness is per query URL: poll the site's exact MENU_CATEGORIES_QUERY and HOMEPAGE_QUERY with the site's client options (CDN, no token, apiVersion 2025-01-01); a simpler query was fresh 60 s earlier and is not a safe proxy"

key-files:
  created:
    - .planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-20261123-232132.json
    - .planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv
  modified:
    - scripts/menu-2026/menu-2026.json
  deleted:
    - scripts/menu-2026/translations-2026-food.json
    - scripts/menu-2026/translations-2026-drinks.json

key-decisions:
  - "Phase 13 gate re-run live before any write (13-03-SUMMARY, code markers, clean src/scripts, it/zh 200 + zh-Hans + pills, ROUTING OK 84, VERIFY OK it/zh on the FR-only content); the FR-secondary markup matched the extractor, so no script change was needed"
  - "The stale ekToConfirm entry (EN/DE French-only until Phase 14) was rewritten in the merge commit to « EN/DE/IT/ZH traduits par Claude (phase 14), relecture native conseillée, ZH à relire en priorité. » after the cmp with the merged preview; formatMenuJson round-trip still byte-identical"
  - "No apply flag needed: the dry-run was clean (0 conflict, 0 French drift, 0 draft, 0 missing document), so --overwrite-existing and --include-drafts were not used"
  - "Revalidation waited for the API CDN to serve the translated menu on the site's own queries (fresh after 91 s of polling, about 105 s after the write), then revalidate.mjs --delay 30: every live check passed on its first attempt, no extra revalidation cycle"
  - "The UI-string review (plan-checker W5) used 9 extra scratch screenshots (en / it / zh rows, notes in 4 languages) because the plan's script only shoots zh and de; no wording error, two cosmetic notes under Gaps"

patterns-established:
  - "Content publish gate = CDN poll of the site's exact queries before revalidate, not a fixed delay"
  - "Every production write in this phase is reversible from a committed backup and was proven so by a rollback dry-run before any page check"

requirements-completed: [TRANS-01, TRANS-02, TRANS-03]

duration: 19min
completed: 2026-11-24
---

# Phase 14 Plan 03: Translations published to Sanity and proven live on the five menu locales, review sheet handed to EK Summary

**The 712 EN/DE/IT/ZH translations of the 2026 menu now live next to every French text in `menu-2026.json` and in Sanity production (one guarded transaction of field-level patches after a committed backup). https://umai-ramen.fr/{en,de,it,zh}/menu show the whole menu in their language, with Japanese names intact, the French name only on the intentional « FR » line and real simplified-Chinese glyphs at 375 px. EK has a regenerable FR | EN | DE | IT | ZH (à relire) sheet that equals what Sanity serves.**

## Performance

- **Duration:** about 19 min
- **Started:** 2026-11-23T23:17:33Z (00:17 in Strasbourg, 24/11)
- **Completed:** 2026-11-23T23:36Z
- **Tasks:** 3/3
- **Files:** 1 modified, 2 deleted, 2 created (+ this SUMMARY)

## Accomplishments

- **Gate:** Phase 13 proven live again before any write (outputs below).
- **Single source:** `menu-2026.json` carries `en`, `de`, `it`, `zh` next to every `fr` (178 fields, 712 values); the two staging overlays are deleted; `check-translations.mjs`, `validate-menu.mjs --crosscheck` (201 text checks) and the 106 tests pass.
- **Production:** `TRANSLATION PLAN docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0`, backup committed, `APPLIED transactionId=lWwPwzVj4paFn3vV2NnUyI patches=97 values=712`, `POST-APPLY CHECK OK docs=97 values=712`, rollback dry-run `set=0 unset=712`.
- **Live (TRANS-01 / TRANS-02):** `VERIFY OK … checks=309` on fr, en, de, it and zh (every category, description, footnote, sub-group, item name in print order, description, price binding, badge and page note in the page language), home OK on fr/en/de, `VERIFY TRANSLATIONS OK locales=5` with exactly 0 / 25 / 26 / 26 / 26 French lines, `ROUTING OK checks=84`, `MOBILE OK`, screenshots read (no tofu).
- **Review sheet (TRANS-03):** `REVIEW SHEET rows=178 categories=20 items=77 empty=0`, byte-identical on a second export, `SHEET == JSON`, BOM, 179 CRLF lines, header `Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)`.
- **Pushed:** secret scan 0 hits for the 4 `.env.local` secrets over the 17 outgoing commits, `86068ab..f125909 v2-2026 -> v2-2026`, `origin/v2-2026` = pushed HEAD. No `src/` change, so no deploy.

## Task Commits

1. **Task 1 (merge): menu-2026.json carries the EN/DE/IT/ZH translations, overlays deleted** - `6815b93` (feat)
2. **Task 1 (backup): pre-write backup of the m26 menu documents** - `31033ba` (docs)
3. **Task 2: live verification on the five menu locales** - no commit (verification only, nothing to fix)
4. **Task 3: review sheet regenerated from Sanity** - `f125909` (docs)

**Plan metadata:** final `docs(14-03)` commit (this SUMMARY, STATE, ROADMAP, REQUIREMENTS).

Each commit was made with explicit paths (`git commit -- <paths>`); `git show --stat` lists only the plan files.

## Evidence

### Task 1 step 1: Phase 13 live gate (before any write)

```
GATE a OK (13-03-SUMMARY.md exists)
GATE b OK (secondaryFrenchName, Studio zh field, verify-live 5 locales, zh.json)
GATE c OK (no src/scripts change in flight)
  /it/menu -> 200
  /zh/menu -> 200
<html lang="zh-Hans" class="…">                       (+ data-menu-locale-switcher present)
ROUTING OK base=https://umai-ramen.fr checks=84
VERIFY OK target=https://umai-ramen.fr/it/menu locale=it expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/zh/menu locale=zh expect=m26 checks=309
```

`src/components/menu/MenuItem.tsx` renders `<p data-fr-name=""> <span aria-hidden>FR</span> <span lang="fr">…</span></p>`, the markup `extractFrenchNameLines` expects: no adaptation.

### Task 1 step 2: mirror check (site rule vs Phase 14 checker)

```
MIRROR OK fr site=0 script=0
MIRROR OK en site=25 script=25
MIRROR OK de site=26 script=26
MIRROR OK it site=26 script=26
MIRROR OK zh site=26 script=26
```

### Task 1 step 3: merge (commit `6815b93`)

```
OVERLAY translations-2026-food.json categories=8 items=30
OVERLAY translations-2026-drinks.json categories=12 items=47
WROTE scripts/menu-2026/menu-2026.json
TRANSLATIONS OK categories=20 items=77 fields=178 values=712
CMP IDENTICAL (menu-2026.json == merged preview)
FORMAT IDEMPOTENT OK                     (after the ekToConfirm rewrite: formatMenuJson(parse(file)) === file)
OVERLAY translations-2026-food.json absent
OVERLAY translations-2026-drinks.json absent
TRANSLATIONS OK categories=20 items=77 fields=178 values=712
MENU JSON OK categories=20 items=77 variants=32 distinctPrices=34
CROSSCHECK OK distinct=34
TEXT CROSSCHECK OK checks=201 allowlisted=5
node --test (rules + patches + checks): tests 106, pass 106, fail 0
```

Negative evidence before the write (live still French): `verify-live.mjs --locale en` exit 1, `failures by kind: MISSING=25 CATEGORY=12 DESC=35 TEXT=15`, `VERIFY FAILED failures=87 target=https://umai-ramen.fr/en/menu locale=en expect=m26`.

`menu-2026.json` contains `"zh": "Tantan Ramen（担担拉面）"`, `"en": "Lunchtime only"`, `"de": "Vom Fass"` and `"it": "Solo a pranzo"`. The `ekToConfirm` entry « EN/DE : les nouveaux plats et catégories sont en français seulement jusqu'à la phase 14 (…) » now reads « EN/DE/IT/ZH traduits par Claude (phase 14), relecture native conseillée, ZH à relire en priorité. » (plan-checker I5).

### Task 1 steps 4 and 5: dry-run, apply, rollback dry-run (2026-11-23 23:21 UTC)

```
MENU JSON OK categories=20 items=77
TRANSLATIONS OK fields=178 values=712
Target: c7twe801/production
TRANSLATION PLAN docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0
DRY RUN: nothing written to Sanity

--apply (no flag):
TRANSLATION PLAN docs=97 patched=97 set=712 skip=0 conflicts=0 frDrift=0 drafts=0 missingDocs=0
BACKUP .planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-20261123-232132.json documents=97
APPLIED transactionId=lWwPwzVj4paFn3vV2NnUyI patches=97 values=712
POST-APPLY CHECK OK docs=97 values=712

--rollback --backup <that file> --dry-run:
ROLLBACK PLAN backup=.planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-20261123-232132.json docs=97 set=0 unset=712
DRY RUN: nothing written to Sanity
```

Backup checks: `documents=97`; 0 occurrence of `SANITY_TOKEN`, `SANITY_WEBHOOK_SECRET`, `DEPLOY_WEBHOOK_SECRET`, `IG_STUDIO_PASSWORD` values; committed in `31033ba`. `sync-menu.mjs` was never run (`12-DISCREPANCY-REPORT.md` unchanged).

### Task 1 step 6: API CDN wait, then signed revalidate

Scratch poller (not in the repo): the site's own `MENU_CATEGORIES_QUERY` and `HOMEPAGE_QUERY`, read from `src/sanity/lib/queries.ts`, through the API CDN with the site's client options, compared with `menu-2026.json` on 97 documents (4 locales of names and descriptions), plus the simple `*[_id=="m26-item-karaage"][0].name.zh`. A read-only dry check before the write gave `menu=97/97 home=3/3` for the French state and `0/97` for the translated state.

```
CDN WAIT START 23:21:49Z   (write ended 23:21:35Z)
CDN poll t=0s  menu=0/97 home=0/3 karaage.zh=-
CDN poll t=30s menu=0/97 home=0/3 karaage.zh=Karaage（日式炸鸡）     <- the simple query is already fresh
…
CDN poll t=91s menu=97/97 home=3/3 karaage.zh=Karaage（日式炸鸡）
CDN FRESH after 91s (menu=97/97 home=3/3 karaage.zh=Karaage（日式炸鸡）) expect=translated

revalidate.mjs --delay 30 (23:23:28Z to 23:24:10Z):
waiting 30s before revalidating
revalidate menuCategory -> 200 {"revalidated":true,…}
revalidate menuItem -> 200 {"revalidated":true,…}
revalidate menuExtra -> 200 {"revalidated":true,…}
revalidate menuFormule -> 200 {"revalidated":true,…}
```

The simple query turned fresh about 60 s before the site's queries: polling it alone would have revalidated too early and re-cached the French menu (the 13-03 race).

### Task 2: live verification

```
VERIFY OK target=https://umai-ramen.fr/fr/menu locale=fr expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/en/menu locale=en expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/de/menu locale=de expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/it/menu locale=it expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/zh/menu locale=zh expect=m26 checks=309
(all on attempt 1, no retry line)
VERIFY OK target=https://umai-ramen.fr/fr locale=fr expect=m26 home checks=8
VERIFY OK target=https://umai-ramen.fr/en locale=en expect=m26 home checks=10
VERIFY OK target=https://umai-ramen.fr/de locale=de expect=m26 home checks=10
OK   fr frNames=0 leakChecks=0 target=https://umai-ramen.fr/fr/menu
OK   en frNames=25 leakChecks=95 target=https://umai-ramen.fr/en/menu
OK   de frNames=26 leakChecks=97 target=https://umai-ramen.fr/de/menu
OK   it frNames=26 leakChecks=99 target=https://umai-ramen.fr/it/menu
OK   zh frNames=26 leakChecks=99 target=https://umai-ramen.fr/zh/menu
VERIFY TRANSLATIONS OK locales=5
ROUTING OK base=https://umai-ramen.fr checks=84
```

Spot checks (curl, raw HTML): `/zh/menu` has `Tantan Ramen（担担拉面）`, `仅限午餐` and `<html lang="zh-Hans"`; `/de/menu` has `Nur mittags` and `Vom Fass`; `/it/menu` has `Solo a pranzo`; `/en/menu` has `Lunchtime only`; `/fr/menu` has `Le midi seulement`. `data-fr-name` outside scripts: fr 0, en 25, de 26, it 26, zh 26. The plan's Task 2 `<verify>` printed `TASK 2 VERIFY PASS`.

**375 px (plan script `mobile-14.mjs`, Playwright 1.49 from the npx cache):**

```
OK   fr {"lang":"fr","sw":375,"cw":375,"fr":0}
OK   en {"lang":"en","sw":375,"cw":375,"fr":25}
OK   de {"lang":"de","sw":375,"cw":375,"fr":26}
OK   it {"lang":"it","sw":375,"cw":375,"fr":26}
OK   zh {"lang":"zh-Hans","sw":375,"cw":375,"fr":26}
MOBILE OK
```

**Screenshot review** (the plan's 3 shots plus 9 extra scratch shots, all read):

- `zh-375-top.png`: 菜单, 用心烹制，选用新鲜的本地食材, pills FR EN DE IT 中文 (中文 filled), quick-nav 小吃 · TANTAN UMAÏ（担担面） · RAMEN（…, heading 菜品 under 料理, cookie banner 本网站使用 Cookie 进行访问量统计。 All real simplified glyphs, no empty box.
- `zh-375-drinks.png`: the sake list. FU ~ 8° 果香，十分轻盈。, JIDAI OKURE ~ 15,5° 圆润而平衡。, JUNMAISHU ~ 15,5° 强劲而醇厚。, ATELIER DU SAKÉ ~ 17,5° 经典日本清酒。: the Japanese and brand names are shown once, with no FR line. Then 清酒品鉴三杯 with the « FR Trio dégustation » line, « 3 × 6cl 18,00 € » and 由本店团队精选的三款清酒。
- `zh-375-rows.png`: GYOZAS（煎饺） 餃子 日式煎饺。馅料任选：鸡肉、猪肉或蔬菜。 3个 4,90 € · 6个 8,90 € · 9个 12,50 €; TAKOYAKI（章鱼小丸子） 软嫩的章鱼小丸子; EDAMAME（盐水毛豆） with the 素 / 无麸质 pills and 撒上盐之花的毛豆; the category TANTAN UMAÏ（担担面） 本店以白芝麻为基础的招牌料理。 No tofu in titles, glosses （…）, descriptions or units.
- `zh-375-notes.png`: 品尝我们的手工拉面：从汤底到小麦面条，全部店内自制（选用阿尔萨斯鸡肉和萨拉尔布磨坊的面粉）。, 如需过敏原清单，请向店员索取。, 价格已含服务费, footer 联系我们.
- `de-375-udon.png`: TANTAN UDON « Udon (dicke Weizennudeln) mit Sesam, Chiliöl, Rinderhack, Sojasprossen, Pak Choi, Rettich (Daikon) und Onsen-Ei. »; UDON KARAAGE; « UDON MIT FÜNF- / GEWÜRZE-RIND » wraps at its hyphen without clipping, price kept on the right, then the « FR Udon au bœuf aux cinq épices » line and « Tsuyu-Brühe, Rinderhackfleisch mit Fünf-Gewürze-Mischung, Onsen-Ei und Frühlingszwiebel. ». The active tab still shows VORSPEISEN: screenshot timing after an instant jump, as noted in 13-03.
- `de-375-notes.png`, `it-375-notes.png`, `en-375-notes.png`: page notes « Genießen Sie unsere handgemachten Ramen … », « Eine Liste der Allergene ist auf Anfrage erhältlich. », « BEDIENUNG INBEGRIFFEN »; « Gustate i nostri ramen artigianali … », « L'elenco degli allergeni è disponibile su richiesta. », « SERVIZIO INCLUSO »; « Enjoy our handcrafted ramen … », « A list of allergens is available on request. », « SERVICE INCLUDED ». Footers KONTAKT / CONTATTI / CONTACT.
- `en-375-rows.png`, `it-375-rows.png`: « Pan-fried dumplings. Filling of your choice: chicken, pork or vegetables. » with « 3 pcs / 6 pcs / 9 pcs »; « Ravioli alla piastra. Ripieno a scelta: pollo, maiale o verdure. » with « 3 pz / 6 pz / 9 pz »; Edamame with V GF (en) and V SG (it). Category descriptions « Our specialities made with white sesame. » and « Le nostre specialità a base di sesamo bianco. ».
- `en-375-starters.png`, `it-375-starters.png` (page tops): OUR MENU / FOOD / STARTERS, IL NOSTRO MENÙ / PIATTI / ANTIPASTI, cookie banners « Cookie policy » and « Informativa sui cookie ».

The Phase 13 UI strings (headings, units, badges, diet pills, notes, footer) read naturally next to the translated content in en, de, it and zh. Two cosmetic notes are under Gaps.

### Task 3: review sheet and push

```
REVIEW SHEET rows=178 categories=20 items=77 empty=0 file=.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv
REVIEW SHEET rows=178 categories=20 items=77 empty=0 file=<scratch>/sheet-again.csv
CMP IDENTICAL (second export byte-identical)
SHEET == JSON
first bytes: efbbbf
lines: 179  CRLF lines: 179  bytes: 30794
Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)
Tantan Umaï;Tantan Ramen : nom;Tantan Ramen;Tantan Ramen;Tantan Ramen;Tantan Ramen;Tantan Ramen（担担拉面）
TASK 3 VERIFY PASS (sheet part)

secret scan (git log -p origin/v2-2026..HEAD, 17 commits): SANITY_TOKEN 0, SANITY_WEBHOOK_SECRET 0, DEPLOY_WEBHOOK_SECRET 0, IG_STUDIO_PASSWORD 0
PUSHED=f1259095f5469b7207e2ff6ca0d34ac6bf68e9bc   86068ab..f125909  v2-2026 -> v2-2026
origin/v2-2026 = PUSHED (ORIGIN == PUSHED); git diff origin(before)..HEAD -- src: empty
```

## Gaps

No functional gap: every check passed on its first attempt, no translation was corrected, and no rollback was needed.

Non-blocking notes from the UI-string review (Phase 13 message files and layout, outside this plan's fix-forward scope, which forbids `src/**`):

1. **German cookie banner link** reads « Mehr erfahren », while EN, IT and ZH name the page (« Cookie policy », « Informativa sui cookie », « Cookie 政策 »; 13-03 renamed the EN « Learn more »). Setting `consent.moreInfo` to « Cookie-Richtlinie » in `src/messages/de.json` would align it (en.json has « Cookie policy » for the same key). Cosmetic.
2. **zh category heading wrap at 375 px:** « TANTAN UMAÏ（担担面） » breaks before the full-width parenthesis, so the second line starts with the parenthesis' built-in spacing. No clipping, no horizontal scroll. Cosmetic.

Watch item carried from 13-VERIFICATION (not run here): re-measure Lighthouse on the five menu locales now that each translated item adds a « FR » line (UI-04 variance).

## Decisions Made

See `key-decisions` in the front matter. In short:
- the gate was re-run live and the markup needed no extractor change;
- the stale `ekToConfirm` entry was rewritten inside the merge commit;
- no apply flag was used (clean dry-run);
- revalidation was gated on the API CDN serving the site's own queries;
- the UI-string review used extra screenshots.

## Deviations from Plan

### Auto-fixed / adapted (Rules 1-3)

**1. [Rule 3 - Environment] Scratch workspace in the session scratchpad**
- The plan's `T="${TMPDIR:-/tmp}/umai-14"` resolved to `<session scratchpad>/umai-14`: every command ran with `TMPDIR=<scratchpad>` (same adaptation as 14-01). The plan's automated verify commands were run unchanged with that `TMPDIR`. Nothing went into the repo.

**2. [Orchestrator instruction, Rule 2 - Correctness] API CDN poll before `revalidate.mjs`**
- **Issue:** the plan's `revalidate.mjs --delay 30` alone revalidates 30 s after the command starts. 13-03 measured that the API CDN serves the pre-write menu for 86 to 111 s, and revalidating earlier re-caches the old menu.
- **Fix:** a scratch poller (`cdn-wait.mjs`, not in the repo) waited until the site's exact queries returned the 97 translated documents (91 s of polling). `revalidate.mjs --delay 30` then ran as planned.
- **Verification:** every live check passed on attempt 1 with no extra revalidation.
- **Finding:** the orchestrator's simple Karaage query was already fresh after 30 s, so only the site's exact queries are a safe gate.

**3. [Rule 2 - Verification completeness] Extra screenshots for the UI-string review**
- The plan asks to read the Phase 13 UI strings in the en/de/it/zh screenshots, but its script only produces zh and de shots.
- Two scratch scripts took 9 more 375 px shots: en, it and zh starter rows, the en and it page tops, and the notes in 4 languages. All were read.
- Result: no wording error, two cosmetic notes (Gaps).

### Plan items executed as written

The `ekToConfirm` rewrite (plan objective, plan-checker I5) was done after the `cmp` with the merged preview and committed in the merge commit `6815b93`. The file is still byte-stable under `formatMenuJson`.

**Total deviations:** 3 (1 environment adaptation, 1 orchestrator-requested correctness gate, 1 verification extension). **Impact:** no repo file outside the plan's list; no scope creep.

## Issues Encountered

- None blocking. Playwright 1.49 from the npx cache launched its bundled Chromium directly (no fallback needed).
- `node --input-type=module` importing `src/lib/menu.ts` prints Node's `MODULE_TYPELESS_PACKAGE_JSON` warning (no `"type"` in `package.json`). This is harmless and the import works.

## Known Stubs

None. Every translatable field has four published, verified values. The ZH column is flagged « à relire » on purpose (14-CONTEXT): a native review is optional and the sheet supports it.

## User Setup Required

None. Optional for EK: native review of the sheet (ZH first), see the hand-off below.

## Next Phase Readiness

- **Phase 15 (QR codes):** the translated menu is live on all five locales, so the real-phone QR scan test and the Exaprint order can proceed. Reminder from 13-03: `/{it,zh}/menu/qr` needs its own `generateStaticParams` if it/zh should be prerendered.
- **Content edits from now on:** Studio wins over `menu-2026.json`. Re-running `apply-translations.mjs` reports any Studio-edited translation as CONFLICT. Note that `verify-live.mjs` reads the JSON: after a Studio correction, fold the corrected text into the JSON (rules must pass) before using it as a live gate.
- **Probe:** `scripts/i18n/probe-translation.mjs` now exits 3 (PROBE SKIP), because Karaage and Entrées carry it/zh content.

---

## Remise à EK (FR)

**En ligne depuis le 24/11/2026** (contenu Sanity seulement, transaction `lWwPwzVj4paFn3vV2NnUyI`, aucun changement de code ni de déploiement) :

- https://umai-ramen.fr/en/menu (anglais)
- https://umai-ramen.fr/de/menu (allemand)
- https://umai-ramen.fr/it/menu (italien)
- https://umai-ramen.fr/zh/menu (chinois simplifié)
- https://umai-ramen.fr/fr/menu reste inchangé (français seul, vérifié).

**Ce qui est traduit :** tout le contenu du menu 2026, soit 178 textes × 4 langues = 712 traductions :
- noms des plats et des boissons, et leurs descriptions ;
- noms des catégories, leurs descriptions et leurs notes de bas ;
- sous-groupes (« Au choix », « Pression »...) et libellé de prix « 3 × 6cl » ;
- notes de service de l'imprimé, par exemple « Le midi seulement » : « Lunchtime only », « Nur mittags », « Solo a pranzo », « 仅限午餐 ».

**Règle d'affichage :**
- **Noms japonais et marques inchangés** dans toutes les langues (Tantan Ramen, Karaage, Gyozas, Asahi, Hibiki...). En chinois, le nom chinois courant est ajouté entre parenthèses : « Tantan Ramen（担担拉面） », « Karaage（日式炸鸡） ».
- **La description traduite explique le plat** (ce que c'est et les ingrédients principaux).
- **Les plats au nom français sont traduits** (Oeuf onsen, Chashu de porc, Tiramisu matcha...). Le nom français reste visible juste en dessous, sur une ligne « FR » : c'est le nom à dire au serveur. Cela concerne 25 plats en anglais (« Japanese Coffee » est déjà anglais) et 26 en allemand, en italien et en chinois.
- Quand le nom traduit contient déjà le nom français (noms japonais), il n'y a pas de ligne FR : le nom s'affiche une seule fois.

**La fiche de relecture :** `.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv`
- Elle s'ouvre dans Excel ou Numbers : séparateur « ; », encodage UTF-8 avec BOM pour que le chinois s'affiche bien.
- Colonnes Catégorie | Champ | FR | EN | DE | IT | ZH (à relire). Une ligne par texte (178), dans l'ordre de l'imprimé.
- **La colonne « ZH (à relire) » est à faire relire en priorité par un locuteur natif chinois.** Je l'ai traduite sans relecture humaine. Pour EN, DE et IT, une relecture native est conseillée mais moins urgente.
- Pas de version .xlsx (optionnelle) : le CSV suffit.

**Corriger une traduction (par exemple après la relecture) :**
1. Dans Studio (https://umai-ramen.fr/studio), ouvrir l'article ou la catégorie.
2. Déplier la rubrique « Traductions » du nom ou de la description, puis corriger le champ Anglais, Allemand, Italien ou Chinois (simplifié).
3. Cliquer sur Publier.
4. **Attendre environ 2 minutes** : le CDN de Sanity sert encore l'ancien texte pendant 1,5 à 2 minutes (mesuré aujourd'hui : 105 secondes).
5. Lancer `node --env-file=.env.local scripts/menu-2026/revalidate.mjs`. Aucun webhook Sanity ne prévient le site, il faut donc cette commande. Si la page montre encore l'ancien texte, relancer la même commande.
6. Régénérer la fiche : `node --env-file=.env.local scripts/menu-2026/export-review-sheet.mjs`.

**Attention :**
- **Ne jamais relancer `sync-menu.mjs --apply`.** Il réécrit les documents entiers à partir du fichier JSON et effacerait les corrections faites dans Studio.
- `apply-translations.mjs` refuse d'écraser une traduction modifiée dans Studio : il la signale (CONFLICT) et n'écrit rien.
- Après une correction dans Studio, c'est Studio qui fait foi. Le fichier `scripts/menu-2026/menu-2026.json` ne suit pas tout seul ; je peux y reporter les corrections si besoin.

**Choix de traduction à valider :**
- **« Menu enfant »** devient « Kids' menu » (EN), « Kindermenü » (DE), « Menù bambini » (IT), « 儿童餐 » (ZH).
- **Explications ajoutées** là où le texte français ne dit pas ce qu'est le produit :
  - Udon (Tantan Udon) : « thick wheat noodles », « dicke Weizennudeln », « noodles di grano spessi ». En chinois, 乌冬面 est déjà le nom courant de l'udon.
  - Ramune : « Japanese soda », « Japanische Limonade », « Bibita giapponese », « 日本汽水 ».
  - Diabolo : « Lemonade with syrup », « Limonade mit Sirup », « Limonata con sciroppo », « 柠檬汽水加糖浆 ».
  - Œuf onsen : « onsen egg (slow-cooked) » dans les descriptions anglaises. Le nom de l'extra précise aussi « Onsen-Ei (langsam gegart) » et « Uovo onsen (cotto a bassa temperatura) ».
- **« Coca-Cola Zéro »** est gardé tel qu'imprimé dans toutes les langues. Le nom international est « Coca-Cola Zero » : à changer si tu préfères.
- **En allemand, « bœuf haché aux cinq épices »** devient « Rinderhackfleisch mit Fünf-Gewürze-Mischung ». C'est le terme du glossaire (« Hackfleisch mit Fünf-Gewürze »), complété par le bœuf de l'imprimé (« Rinder- ») et par « -Mischung » pour que la phrase soit correcte. Le nom du plat est « Udon mit Fünf-Gewürze-Rind ».

**Articles au nom japonais ou de marque sans description sur l'imprimé :** je n'ai ajouté aucune explication en anglais, allemand ou italien (règle : ne rien inventer qui n'est pas sur l'imprimé). Le nom reste seul :
- Bières : Asahi ~ 5°, Asahi Yuzu, Asahi Saké, Asahi Super Dry ~ 5°, Coedo IPA ~ 4,5°.
- Spritz : Yuzu Spritz, Umeshu Spritz, Peach Passion Spritz. Seul le chinois a une précision : 柚子气泡鸡尾酒, 梅酒气泡鸡尾酒, 蜜桃百香果气泡鸡尾酒.
- Saké : Zaku ~ 15,5°.
- Whiskies : Toki, Nikka from the Barrel, The Chita, Hibiki, Yamazaki.
- Vin : Riesling Alsace ~ Sperry (en chinois : 阿尔萨斯雷司令).
- Softs : Coca-Cola / Coca-Cola Zéro.

Le titre de chaque catégorie est traduit (Beers, Biere, Birre, 啤酒...), donc le touriste sait de quoi il s'agit. Pour ajouter une explication (par exemple « Umeshu : liqueur de prune japonaise »), il suffit de mettre une description française dans Studio, puis ses traductions. Je peux les écrire.

**Retour arrière (si besoin) :** cette commande remet les documents du menu comme avant les traductions (français seul). Le français et les prix ne sont jamais touchés.

```
node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --rollback --backup .planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-20261123-232132.json
```

Ensuite, attendre environ 2 minutes et lancer `node --env-file=.env.local scripts/menu-2026/revalidate.mjs`. Je l'ai testé à blanc : 712 traductions à retirer, rien d'autre. Attention, le retour arrière retire aussi les corrections de traduction faites dans Studio entre-temps.

**Pour la suite (phase 15) :** le menu traduit est en ligne dans les 5 langues. Le test des QR codes sur un vrai téléphone et la commande Exaprint peuvent avancer.

---
*Phase: 14-traductions-en-de-it-zh*
*Completed: 2026-11-24*

## Self-Check: PASSED

- FOUND: `scripts/menu-2026/menu-2026.json` (translated), `.planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-20261123-232132.json`, `.planning/phases/14-traductions-en-de-it-zh/14-REVIEW-SHEET.csv` (tracked), this SUMMARY
- DELETED as planned: `scripts/menu-2026/translations-2026-food.json`, `scripts/menu-2026/translations-2026-drinks.json`
- FOUND commits: `6815b93` (menu-2026.json + the two overlay deletions), `31033ba` (backup only), `f125909` (sheet only); each contains only its plan paths
- `git diff 86068ab HEAD -- src`: 0 files (no site code change, no deploy needed); `origin/v2-2026` = `f125909` after the push
- Plan verify commands: Task 1 `TASK 1 VERIFY PASS`, Task 2 `TASK 2 VERIFY PASS`, Task 3 `TASK 3 VERIFY PASS (sheet part)`; no secret value in any committed file or captured output
