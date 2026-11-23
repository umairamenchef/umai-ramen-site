---
phase: 14-traductions-en-de-it-zh
plan: 01
subsystem: content
tags: [i18n, translations, zh-Hans, node-test, tdd, menu-2026, json-overlay]

requires:
  - phase: 12-synchronisation-menu-print-2026-sanity
    provides: "scripts/menu-2026/menu-2026.json (FR transcription of the 2026 print, 20 categories / 77 items), menu-schema.mjs validateMenu (accepts en/de/it/zh, rejects ??, Asashi, dotted degrees in every locale), validate-menu.mjs --crosscheck"
  - phase: 13-fondations-multilingues-page-menu-touriste
    provides: "verify-live.mjs PRESENT lists (per-locale menu.formulesTitle, LEGACY_ABSENT) and the secondary FR name rule (secondaryFrenchName)"
provides:
  - "scripts/menu-2026/translation-rules.mjs: translatableFields, mergeTranslations, validateTranslations (12 rules), formatMenuJson (byte-exact round-trip), overlaySkeleton + rule constants"
  - "scripts/menu-2026/translation-rules.test.mjs: 36 node:test cases (one failing fixture per rule, merge errors, real-file counts, formatter round-trip, skeletons, constants)"
  - "scripts/menu-2026/check-translations.mjs: in-memory merge of the overlays + validateMenu + rules; --section, --skeleton, --json, --out, --write (Plan 14-03 only)"
  - "scripts/menu-2026/translations-2026-food.json: EN/DE/IT/ZH of the 8 food categories and 30 food items (71 fields, 284 values)"
  - "scripts/menu-2026/translations-2026-drinks.json: EN/DE/IT/ZH of the 12 drink categories and 47 drink items (107 fields, 428 values)"
affects: [14-02 publishing tools, 14-03 merge + Sanity publish + review sheet, 15-qr-codes]

tech-stack:
  added: []
  patterns:
    - "Staging overlays next to the source JSON: every overlay entry repeats its FR text, the merge reports STALE when the FR changes, the source JSON is untouched until the gated --write"
    - "Translation rules as an import-free, I/O-free module (same style as menu-schema.mjs), the CLI only reads files and prints"
    - "Scratch workspace + atomic landing (cp && git add && git commit -- <paths>) while another phase executes in the same tree"

key-files:
  created:
    - scripts/menu-2026/translation-rules.mjs
    - scripts/menu-2026/translation-rules.test.mjs
    - scripts/menu-2026/check-translations.mjs
    - scripts/menu-2026/translations-2026-food.json
    - scripts/menu-2026/translations-2026-drinks.json
  modified: []

key-decisions:
  - "Every reference value of the plan used verbatim (category names, MENU-05 notes, sub-groups, the 77 item names, worked examples, required glosses); no rule constant changed"
  - "SCRIPT also rejects a space between two Hanzi or next to full-width punctuation (STYLE: a ZH space only between Hanzi and a Latin brand)"
  - "mergeTranslations: a blank overlay value never overrides nor conflicts with a menu value, so re-merging the overlays after Plan 14-03's --write is clean; optional { names } labels overlay errors with file names"
  - "Karaage ZH description 自家腌制炸鸡 (not 自制腌制炸鸡, double 制); 自制 kept for Yuzu maison"

patterns-established:
  - "Overlay = { version: 1, section, categories: { <catKey>: { name, description, footnote } }, items: { <itemKey>: { name, description, subgroup, prices: [ { label } | null ] } } }, Loc = { fr, en, de, it, zh }"
  - "Rule errors start with the rule id then <path>.<locale>; MISSING is exactly `MISSING <path>.<locale>`"

requirements-completed: []  # TRANS-01 / TRANS-02 content side delivered and verified offline; per the plan, REQUIREMENTS.md stays Pending: Plan 14-03 ticks TRANS-01..03 after the live proof

duration: 27min
completed: 2026-11-23
---

# Phase 14 Plan 01: Offline EN/DE/IT/ZH translations of the 2026 menu + executable translation rules Summary

**The whole 2026 menu (20 categories, 77 items, 178 fields, 712 values) translated into English, German, Italian and simplified Chinese in two reviewable staging overlays, every 14-CONTEXT rule enforced by a tested rules module and a check CLI, FR source provably untouched.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-11-23T21:59:37Z
- **Completed:** 2026-11-23T22:26Z
- **Tasks:** 3/3
- **Files created:** 5 (+ this SUMMARY)

## Accomplishments

- `node scripts/menu-2026/check-translations.mjs` ends with `TRANSLATIONS OK categories=20 items=77 fields=178 values=712`: every translatable field has EN, DE, IT and ZH text that passes all 12 rules, `validateMenu` and the merge checks.
- Japanese and brand names kept as printed in every language (51 item names, 6 category names); ZH appends the agreed full-width gloss (`Tantan Ramen（担担拉面）`, `Karaage（日式炸鸡）`, `Udon（乌冬面）`, `Highball（嗨棒）`...). French-named items (26) are translated naturally.
- Descriptions explain the dish (TRANS-02): Japanese terms kept in EN/DE/IT, the three FR texts that do not say what the dish is carry the required gloss (Tantan Udon: thick wheat noodles, Ramune: Japanese soda, Diabolo: lemonade with syrup).
- The merged preview passes `validate-menu.mjs --crosscheck` and, with every en/de/it/zh key removed, deep-equals menu-2026.json: the FR text is untouched.
- Phase 13 undisturbed: only the five plan files were created and committed (by explicit path); no build, no npm, no network, no Sanity, no SSH, no push.

## Task Commits

1. **Task 1 RED: failing tests for the translation rules** - `a7d5c73` (test)
2. **Task 1 GREEN: translation rules module and check-translations CLI** - `f1860ad` (feat)
3. **Task 2: EN/DE/IT/ZH translations of the food menu (staging overlay)** - `a746f92` (feat)
4. **Task 3: EN/DE/IT/ZH translations of the drinks menu (staging overlay)** - `5d5c08e` (feat)

No REFACTOR commit was needed. Each commit contains only its task files (`git show --stat`).

## Files Created

- `scripts/menu-2026/translation-rules.mjs` (668 lines): rules module, no imports, no I/O.
- `scripts/menu-2026/translation-rules.test.mjs` (884 lines): 36 node:test cases, all green.
- `scripts/menu-2026/check-translations.mjs` (166 lines): Node 24 ESM CLI.
- `scripts/menu-2026/translations-2026-food.json` (581 lines): food overlay.
- `scripts/menu-2026/translations-2026-drinks.json` (879 lines): drinks overlay.

## API for Plans 14-02 and 14-03

```js
// scripts/menu-2026/translation-rules.mjs
export const TRANSLATION_LOCALES = ['en', 'de', 'it', 'zh'];
export function translatableFields(menu, { section } = {})
  // -> [{ path, scope: 'category'|'item', catKey, key, field: 'name'|'description'|'footnote'|'subgroup'|'label', index?, value }]
  // print order per category: name, description, then per item name, description, subgroup, prices[i].label, then footnote.
  // Only Loc objects whose fr is a non-empty string; `value` is the Loc object itself (same reference).
export function mergeTranslations(base, overlays, { names } = {})   // -> { menu, errors }; never mutates its inputs
export function validateTranslations(menu, { section } = {})        // -> string[] (empty = valid)
export function formatMenuJson(menu)                                // -> string, file style of menu-2026.json
export function overlaySkeleton(menu, section)                      // -> overlay with fr filled, en/de/it/zh = ''
export const INVARIANT_ITEM_NAMES /* Set, 51 */, ZH_ITEM_GLOSS /* 27 */, INVARIANT_CATEGORY_NAMES /* Set, 6 */,
  ZH_CATEGORY_GLOSS /* 6 */, INVARIANT_TEXTS /* 7 */, BRANDS /* 26 */, JP_TERMS /* 28 */, GLOSSARY /* 19 rows */,
  NOT_SIMPLIFIED, FORBIDDEN_TEXT, LEGACY_ABSENT /* 22, mirrors verify-live.mjs */, REQUIRED_GLOSSES /* 3 */;
```

Overlay shape (both files are `JSON.stringify(overlay, null, 2)`):

```json
{
  "version": 1,
  "section": "food",
  "categories": { "<catKey>": { "name": { "fr": "…", "en": "…", "de": "…", "it": "…", "zh": "…" }, "description": {}, "footnote": {} } },
  "items": { "<itemKey>": { "name": {}, "description": {}, "subgroup": {}, "prices": [ { "label": {} } ] } }
}
```

`prices` exists only on `trio-degustation` (one entry, `{ "label": { "fr": "3 × 6cl", ... } }`); in general it has the item's price-variant count, `null` for a variant without a label.

Error formats:

- Merge: `OVERLAY <file>: …` (bad shape: version ≠ 1, non-object entry, non-string value, unknown locale key / field / top-level key, prices length ≠ the menu's, entry of the other section), `ORPHAN <path> (…)`, `DUPLICATE <path> (…)`, `STALE <path> overlay fr "…", menu fr "…" (…)`, `CONFLICT <path>.<l> menu has "…", overlay has "…" (…)`. A missing overlay entry is not a merge error. A blank overlay value never overrides a menu value. A CONFLICT keeps the menu value. Merged Loc objects are rewritten in key order fr, en, de, it, zh.
- Rules: `MISSING <path>.<l>` (exactly), otherwise `<RULE> <path>.<l> <details>` for INVARIANT, BRAND, JPTERM, GLOSSARY, NUMBERS, SCRIPT, TYPO, FORBIDDEN, LENGTH; `SUBGROUP "<fr>".<l> "<a>" vs "<b>" (<path a>, <path b>)`; `GLOSS items.<key>.description.<l> "<expected>"`.

For Plan 14-03: after `--write`, re-running the check merges the overlays into the already-merged menu-2026.json with no error (same values). Editing a translation in menu-2026.json without updating its overlay makes the check report CONFLICT. `formatMenuJson` puts a 5-locale Loc on one line when it fits in 110 characters and expands it otherwise (for example `items.karaage.name`), so the `--write` diff shows such blocks. The output is idempotent and parses back to the same data (tested).

## check-translations.mjs Output

```
$ node scripts/menu-2026/check-translations.mjs
OVERLAY translations-2026-food.json categories=8 items=30
OVERLAY translations-2026-drinks.json categories=12 items=47
TRANSLATIONS OK categories=20 items=77 fields=178 values=712

$ node scripts/menu-2026/check-translations.mjs --section food     # last line
TRANSLATIONS OK categories=8 items=30 fields=71 values=284
$ node scripts/menu-2026/check-translations.mjs --section drinks   # last line
TRANSLATIONS OK categories=12 items=47 fields=107 values=428
```

Before the overlays existed (Task 1, FR-only data): `OVERLAY translations-2026-food.json absent`, 80 `ERROR MISSING …` lines, `… 632 more`, `TRANSLATIONS FAILED errors=712`, exit 1, and no non-MISSING error. Usage errors exit 2: `--write --section food`, `--write --json x`, `--skeleton food --out x`, `--out scripts/menu-2026/menu-2026.json`, unknown or repeated flags. `--skeleton food` gives 8 categories and 30 items; `--skeleton drinks` gives 12 and 47.

**`--write` is for Plan 14-03 only** (after Phase 13 is live). Neither this plan nor 14-02 runs it, and it cannot be combined with `--section` or `--json`.

## Merged-Preview Crosscheck

```
$ node scripts/menu-2026/check-translations.mjs --out "$TMPDIR/umai-14/menu-2026.merged.json"
$ node scripts/menu-2026/validate-menu.mjs --crosscheck --file "$TMPDIR/umai-14/menu-2026.merged.json"
MENU JSON OK categories=20 items=77 variants=32 distinctPrices=34
CROSSCHECK OK distinct=34
TEXT CROSSCHECK OK checks=201 allowlisted=5
```

The preview with every en/de/it/zh key removed (712 keys) deep-equals `scripts/menu-2026/menu-2026.json`. `git diff --quiet -- scripts/menu-2026/menu-2026.json` succeeds after every landing.

## Phase 13 Secondary FR Line (expected live in Plan 14-03)

Phase 13 adds a « FR » line under an item name unless the translated name already contains the French name. With these overlays the line appears on **en 25, de 26, it 26, zh 26** items (computed on the merged preview with the same NFC, lowercase and collapsed-whitespace rule):

| key | en | de | it | zh |
|---|---|---|---|---|
| miso-vegetarien | Vegetarian Miso | Miso vegetarisch | Miso vegetariano | 素食味噌拉面 |
| udon-boeuf-cinq-epices | Five-spice beef udon | Udon mit Fünf-Gewürze-Rind | Udon al manzo alle cinque spezie | 五香牛肉乌冬面 |
| oeuf-marine-entier | Whole marinated egg | Ganzes mariniertes Ei | Uovo marinato intero | 整颗溏心蛋 |
| oeuf-onsen | Onsen egg (slow-cooked) | Onsen-Ei (langsam gegart) | Uovo onsen (cotto a bassa temperatura) | 温泉蛋 |
| chashu-porc | Pork chashu | Schweine-Chashu | Chashu di maiale | 猪肉叉烧 |
| chashu-poulet | Chicken chashu | Hähnchen-Chashu | Chashu di pollo | 鸡肉叉烧 |
| cafe-the-gourmand | Coffee or tea with mini desserts | Kaffee oder Tee mit Mini-Desserts | Caffè o tè con mini dessert | 咖啡或茶配迷你甜点 |
| duo-mochis-glaces | Duo of mochi ice cream | Mochi-Eis-Duo | Duo di mochi gelato | 冰淇淋麻糬双拼 |
| tiramisu-matcha | Matcha tiramisu | Matcha-Tiramisu | Tiramisù al matcha | 抹茶提拉米苏 |
| tiramisu-framboise-litchi | Raspberry & lychee tiramisu | Himbeer-Litschi-Tiramisu | Tiramisù lampone e litchi | 覆盆子荔枝提拉米苏 |
| boule-de-glace | Scoop of ice cream of your choice | Eiskugel nach Wahl | Pallina di gelato a scelta | 自选口味冰淇淋球 |
| yuzu-maison | Homemade yuzu | Yuzu hausgemacht | Yuzu fatto in casa | 自制柚子冰茶 |
| the-noir-glace-litchi | Lychee iced black tea | Schwarzer Eistee mit Litschi | Tè nero freddo al litchi | 荔枝冰红茶 |
| the-glace-peche | Peach iced tea | Pfirsich-Eistee | Tè freddo alla pesca | 蜜桃冰茶 |
| sirop-a-leau | Syrup with water | Sirup mit Wasser | Sciroppo con acqua | 果味糖浆水 |
| lisbeth | Lisbeth blue, green, red | Lisbeth blau, grün, rot | Lisbeth blu, verde, rossa | Lisbeth（蓝标、绿标、红标） |
| trio-degustation | Tasting trio | Verkostungs-Trio | Trio degustazione | 清酒品鉴三杯 |
| ryoma | Ryoma, amber rum | Ryoma, brauner Rum | Ryoma, rum ambrato | Ryoma，琥珀朗姆酒 |
| kiyomi | Kiyomi, white rum | Kiyomi, weißer Rum | Kiyomi, rum bianco | Kiyomi，白朗姆酒 |
| annee-lumiere-2023 | Année Lumière vintage 2023 | Année Lumière Jahrgang 2023 | Année Lumière annata 2023 | Année Lumière 2023年份 |
| cafe-expresso | Espresso | Espresso | Caffè espresso | 意式浓缩咖啡 |
| double-expresso | Double espresso | Doppelter Espresso | Doppio espresso | 双份意式浓缩咖啡 |
| cafe-au-lait | Coffee with milk | Milchkaffee | Caffè latte | 牛奶咖啡 |
| japanese-coffee | Japanese Coffee (= FR, no FR line in EN) | Japanischer Kaffee | Caffè giapponese | 日式咖啡 |
| thes-verts-japonais | Japanese green teas | Japanische Grüntees | Tè verdi giapponesi | 日本绿茶 |
| infusions | Herbal teas | Kräutertees | Infusi | 花草茶 |

The 51 invariant names render once (EN/DE/IT equal FR, ZH = FR or FR（gloss））.

## Translation Judgement Calls

All values given by the plan's `<translation_reference>` are used verbatim. These are the calls I made on the descriptions the plan left to the translator:

- **Karaage** « Poulet mariné et frit maison »: Homemade marinated fried chicken / Mariniertes und frittiertes Hähnchen, hausgemacht / Pollo marinato e fritto, fatto in casa / 自家腌制炸鸡. ZH uses 自家 instead of the lexicon's 自制 to avoid « 自制腌制 » (制 twice). « Yuzu maison » keeps 自制 (自制柚子冰茶).
- **Takoyaki** « Boulettes fondantes au poulpe »: Melt-in-the-mouth octopus balls / Zart schmelzende Bällchen mit Oktopus / Polpettine morbide al polpo / 软嫩的章鱼小丸子 (« fondant » rendered as texture, nothing added).
- **Edamame** « à la fleur de sel »: kept as the culinary term in EN and DE (fleur de sel / Fleur de Sel). IT uses fior di sale, ZH 撒上盐之花的毛豆.
- **Chashu in EN descriptions** = the glossary rendering « chashu (braised pork) / chashu (braised chicken) ». Item names stay short (Pork chashu / Chicken chashu).
- **Onsen egg**: EN descriptions always say « onsen egg (slow-cooked) ». DE and IT descriptions say plain Onsen-Ei / uovo onsen, as in the worked examples. The extra-item names carry the explanation (langsam gegart / cotto a bassa temperatura).
- **Wantan Ramen** « ravioli de poulet »: chicken wontons / Hähnchen-Wan-Tans / ravioli di pollo / 鸡肉云吞 (explains the dish name).
- **Tantan Tsukemen** « garnitures »: toppings / Toppings / condimenti / 配料. « pimenté »: spicy / scharf / piccante / 香辣.
- **German ingredient lists** after « mit » stay in the nominative (« …, ein halbes mariniertes Ei »), as in the worked example. This also keeps the glossary form « mariniertes Ei ».
- **Chashu Mazesoba** « Morceaux de porc teriyaki »: Teriyaki pork pieces / Teriyaki-Schweinefleisch in Stücken / Bocconcini di maiale teriyaki / 照烧猪肉块.
- **Tantan Udon** ZH: 芝麻乌冬面，… 乌冬面 is the established Chinese name of udon, so no extra gloss is needed (required substring 乌冬). EN/DE/IT carry the thick-wheat-noodle gloss.
- **Mini Ramen** « Tokyo ou Miso. »: ZH spells out 东京拉面或味噌拉面。. EN/DE/IT mirror the FR (Tokyo or Miso.).
- **Ramune** ZH: 日本汽水，口味可选：柚子、草莓或荔枝。 (the name already carries 波子汽水).
- **Ginger Highball** « Déclinaison au gingembre. »: The ginger version. / Die Variante mit Ingwer. / La variante allo zenzero. / 生姜风味版本。
- **Atelier du saké** « Classique japonais. »: A Japanese classic. / Ein japanischer Klassiker. / Un classico giapponese. / 经典日本清酒。 (清酒 says what it is; the item sits in the sake category).
- **Nana Spritz** ZH « Prosecco » → 普罗塞克起泡酒 (Prosecco is a wine name, not in the brand list; 起泡酒 explains it).
- **Lisbeth** ZH colours as bottle labels 蓝标、绿标、红标. No still or sparkling claim is invented.
- **Trio dégustation** ZH description 由本店团队精选的三款清酒。 (精选 is the standard menu word for « sélectionnés »).
- **Consistency fixes**: DE uses « Eiskugel » in the footnote, the café gourmand and the scoop item. « Au choix » appears as Your choice / Zur Auswahl / A scelta / 任选其一 for the sub-group and as Choice of / Nach Wahl: / A scelta: / 可选： inside descriptions (lexicon). litchi is always lychee / Litschi / litchi / 荔枝, and saké is always sake / Sake / sakè / 清酒.
- **Typography**: FR capitalisation is mirrored (Nana Spritz and ice-cream flavour lists). The FR lowercase start of the syrup list stays lowercase in EN and IT; German capitalises nouns. EN keeps the glossary form « chili oil », not the British « chilli ».

Rule-constant changes: **none**. The planner's constants (GLOSSARY, NOT_SIMPLIFIED, glosses, brands, terms, forbidden lists) are used as written.

## Decisions Made

- The added ZH spacing sub-check is listed under Deviations, item 2.
- Merge semantics chosen so that Plan 14-03 can re-run the check after `--write` without noise. A blank overlay value means « not provided » (no CONFLICT, menu value kept). Non-locale keys and non-string values already in a menu Loc are preserved, so validateMenu still reports them instead of the merge hiding them.
- CLI output (OVERLAY, ERROR, OUT/WROTE and status lines) goes to stdout so `tail -n 1` and `grep` work. Usage errors go to stderr with exit 2.

## Deviations from Plan

### Auto-fixed / added (Rules 1-3)

**1. [Rule 1 - Bug] STALE / CONFLICT messages put a colon right after the path**
- **Found during:** Task 1 GREEN (2 of 36 tests failed)
- **Issue:** `STALE <path>: …` and `CONFLICT <path>.<l>: …` did not follow the `RULE <path> details` format the tests and the other messages use.
- **Fix:** `STALE <path> overlay fr "…", menu fr "…" (…)` and `CONFLICT <path>.<l> menu has "…", overlay has "…" (…)`.
- **Committed in:** `f1860ad` (before landing; the RED test file was not changed).

**2. [Rule 2 - Correctness] Small checks added beyond the 12-rule spec**
- SCRIPT (zh) rejects a space between two Hanzi or touching full-width punctuation. This makes the STYLE rule « a space is allowed only between Hanzi and a Latin brand » executable, and the test file covers it.
- The merge reports OVERLAY when an overlay entry belongs to the other section, when `prices` has a different length than the item's variants, or when a top-level key is unknown.
- `mergeTranslations(base, overlays, { names })` adds an optional third argument so CLI errors name the overlay file. The two-argument contract is unchanged.
- CLI guards: `--out` cannot target menu-2026.json (that would bypass the `--write` guards), `--skeleton` cannot be combined with `--section`, `--out` or `--write`, repeated flags are rejected, `-h` / `--help` prints the usage, and `--out` creates its parent directory.
- **Files:** translation-rules.mjs, check-translations.mjs, translation-rules.test.mjs. **Committed in:** `a7d5c73`, `f1860ad`.

**3. [Rule 3 - Environment] Scratch workspace location**
- The plan's `T="${TMPDIR:-/tmp}/umai-14"` was placed in the session scratchpad (`<scratchpad>/umai-14`, because the agent environment requires temporary files to live there). The plan's automated verify commands were run with `TMPDIR=<scratchpad>`, so their `${TMPDIR:-/tmp}/umai-14/...` paths resolve there. The commands themselves are unchanged and the behaviour is the same.

**Total deviations:** 3 (1 bug fix during TDD, 1 group of small correctness additions, 1 environment adaptation). **Impact:** none on the contract used by 14-02 and 14-03; no scope creep, no extra file.

## Issues Encountered

- `scripts/i18n/probe-translation.mjs` is untracked in the working tree. It belongs to Phase 13 (13-03 reversible Sanity probe), not to this plan, and was left untouched. `scripts/menu-2026/` has no untracked or modified file.
- Phase 13 committed `86068ab feat(13-03)` between this plan's RED and GREEN landings. No index.lock collision occurred.

## Known Stubs

None. Every translatable field has four non-empty, rule-checked values. The ZH column is « à relire » (14-CONTEXT), a native review is optional later, and Plan 14-03's review sheet supports it.

## Next Phase Readiness

- Plan 14-02 can build the publishing tools on `translatableFields`, `mergeTranslations` and `validateTranslations` (field paths map one-to-one to Sanity `set` patches on the `m26-*` documents).
- Plan 14-03: once Phase 13 is live, run `node scripts/menu-2026/check-translations.mjs --write` (the only writer of menu-2026.json), then publish. Expect the secondary FR line counts above. REQUIREMENTS.md TRANS-01..03 are ticked there.
- STATE.md / ROADMAP.md / REQUIREMENTS.md were not touched (bookkeeping suppressed; the orchestrator updates them).

## Self-Check: PASSED

- FOUND: scripts/menu-2026/translation-rules.mjs, translation-rules.test.mjs, check-translations.mjs, translations-2026-food.json, translations-2026-drinks.json
- FOUND commits: a7d5c73, f1860ad, a746f92, 5d5c08e (each contains only its task files)
- `node --test scripts/menu-2026/translation-rules.test.mjs`: 36 pass, 0 fail
- `node scripts/menu-2026/check-translations.mjs`: `TRANSLATIONS OK categories=20 items=77 fields=178 values=712`
- `git diff --quiet -- scripts/menu-2026/menu-2026.json`: clean
