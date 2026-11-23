---
phase: 14-traductions-en-de-it-zh
status: passed
verified: 2026-11-24
mode: lean (orchestrator verification — EK asked to speed up on 2026-11-24; no separate gsd-verifier run)
score: 3/3 success criteria
---

# Phase 14 — Traductions EN/DE/IT/ZH — Verification

## Success criteria

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| 1 | Every available item name, description, category heading and the Phase 12 notes/markers appear in EN/DE/IT/ZH on the live menus, with no French except the intentional secondary FR name | 14-03: `apply-translations` APPLIED 97 docs / 712 values (tx `lWwPwzVj4paFn3vV2NnUyI`), `POST-APPLY CHECK OK`; `VERIFY TRANSLATIONS OK locales=5` (fr 0, en 25, de 26, it 26, zh 26 FR lines), `VERIFY OK checks=309` ×5, `ROUTING OK 84`, `MOBILE OK`. Orchestrator spot check 2026-11-24 (live GETs): en « Lunchtime only », « Price on request », « Kids' menu », « Homemade marinated fried chicken »; de « Nur mittags », « Kindermenü », « Rinderhackfleisch mit Fünf-Gewürze-Mischung »; it « Solo a pranzo », « Menù bambini »; zh « 仅限午餐 », « 儿童餐 », « 温泉蛋 » with « FR Oeuf onsen » underneath; fr unchanged (0 `data-fr-name`); 0 `??` everywhere | ✓ |
| 2 | Japanese dish names unchanged in every language, each translated description explains the dish | `TRANSLATIONS OK categories=20 items=77 fields=178 values=712` (rules: JP names preserved, zh romanized name + （中文） gloss, brands unchanged); live zh « Tantan Ramen（担担拉面） »; Japanese-named items without an FR description get no invented explanation (listed for EK) | ✓ |
| 3 | EK has a review sheet FR \| EN \| DE \| IT \| ZH (ZH flagged « à relire »), regenerable from Sanity | `14-REVIEW-SHEET.csv` — `REVIEW SHEET rows=178 categories=20 items=77 empty=0`, header `Catégorie;Champ;FR;EN;DE;IT;ZH (à relire)`, UTF-8 BOM, byte-identical on re-export, `SHEET == JSON` | ✓ |

## Requirements

TRANS-01, TRANS-02, TRANS-03 — satisfied (ticked by 14-03 after the live proof).

## Rollback

`node --env-file=.env.local scripts/menu-2026/apply-translations.mjs --rollback --backup .planning/phases/14-traductions-en-de-it-zh/backup/translations-backup-20261123-232132.json` (dry-run proven: `docs=97 set=0 unset=712`).

## Non-blocking follow-ups (EK)

- Native review of the ZH column first, then IT/DE/EN (sheet above).
- Cosmetic (needs `src/`): DE cookie link « Mehr erfahren »; zh heading « TANTAN UMAÏ（担担面） » wraps before the full-width parenthesis at 375 px.
- Re-run Lighthouse on the 5 menus now that translated content is live (watch item).
