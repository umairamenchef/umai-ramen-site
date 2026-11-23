---
phase: 13-fondations-multilingues-page-menu-touriste
plan: 03
subsystem: i18n
tags: [deploy, verification, lighthouse, playwright, sanity, revalidate, api-cdn, zh-Hans, intersection-observer]

requires:
  - phase: 13-fondations-multilingues-page-menu-touriste
    provides: "13-01: locale rules, IT/ZH menu-only routing, check-messages.mjs, verify-routing.mjs. 13-02: tourist menu page (pills, FR secondary line, diet labels, zh fonts, Studio it/zh inputs), selectors [data-menu-locale-switcher] a / [data-fr-name] / nav.sticky"
  - phase: 12-synchronisation-menu-print-2026-sanity
    provides: "verify-live.mjs (print fidelity), revalidate.mjs (signed revalidateTag), the manual SSH deploy and its font-flake retry rule"
provides:
  - "Phase 13 live on umai-ramen.fr: deployed 86068ab (rollback point 34748ef)"
  - "verify-live.mjs covering the fr/en/de/it/zh menu pages (it/zh refuse --home and --expect legacy)"
  - "scripts/i18n/probe-translation.mjs: reversible Studio-field to live-page probe (baseline, backup, set, API CDN wait, revalidate, CHECK-ON, unset in finally, CHECK-OFF on text + RSC payload, final read vs backup)"
  - "Quick-nav starts on the first category at scroll 0 (no arbitrary tab, no nav auto-scroll at load); Chinese dietary pills at 12 px"
  - "Live evidence: ROUTING OK 84, VERIFY OK x5 + fr home, HTML contracts x5, MOBILE OK, NAV PROBE OK, Lighthouse 3 x 5, PROBE OK"
  - "Finding for Phase 14 and EK: the Sanity API CDN serves the pre-write menu for 1.5 to 2 min after a write; revalidating earlier re-caches the old menu"
affects: [14-traductions-en-de-it-zh, 15-qr-codes]

tech-stack:
  added: []
  patterns:
    - "Deploy gate compares the VPS HEAD and origin/v2-2026 with the sha captured right before the push, never with a local HEAD that concurrent plans can move"
    - "Production content probe: read-only baseline, JSON backup, one set transaction, API CDN wait, revalidate, unset in finally, final read compared with the backup"
    - "Publishing Sanity content to the live site: write, wait until the API CDN serves it (about 2 min), revalidate.mjs, verify-live (re-run revalidate.mjs while stale)"
    - "Live Lighthouse: 3 load-gated passes (load < 3 before each URL), median per category, host load recorded per run"

key-files:
  created:
    - scripts/i18n/probe-translation.mjs
    - .planning/phases/13-fondations-multilingues-page-menu-touriste/backup/probe-backup-20261123-223714.json
  modified:
    - scripts/menu-2026/verify-live.mjs
    - src/components/menu/MenuStickyNav.tsx
    - src/components/menu/DietaryBadge.tsx
    - .planning/phases/13-fondations-multilingues-page-menu-touriste/deferred-items.md

key-decisions:
  - "UI-04 stays pending: the protocol median for /fr/menu performance is 87 (88/87/86), recorded under Gaps with a site-wide cause (react-dom hydration long task + render-blocking CSS); an interleaved fr/en diagnostic (fr 91/89/97, en 89/90/91) shows no fr-specific cost and was not used for scoring"
  - "Quick-nav empty band: first tab only while the reader is above the first section, current tab kept in gaps and below the last section (a literal reset-to-first would flicker inside the 235 px « Boissons » header, taller than the 162 px observer band)"
  - "zh dietary pills: [&:lang(zh-Hans)]:text-[12px] inside DietaryBadge, no change for other locales"
  - "Deploy gate against PUSHED=86068ab (captured before the push) because Phase 14 commits move the local HEAD; no push after the deploy (probe and docs commits ride with the next push, none touches src/)"
  - "The probe waits for the site's exact menu query to be fresh on the Sanity API CDN before revalidating and re-sends the revalidation when a check stalls (run 1 revalidated after 34 s and failed CHECK-ON; run 2 PROBE OK)"
  - "Brand-green contrast left untouched, handed to EK as a design decision"

patterns-established:
  - "Content publish = write, CDN wait (about 2 min or a CDN poll), revalidate.mjs, verify-live; never revalidate within a minute of a Sanity write"
  - "Live checks read headers too: x-nextjs-cache MISS right after revalidateTag means a fresh render, STALE/HIT reuse cached data"

requirements-completed: [I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, UI-01, UI-02, UI-03]  # UI-04 pending: Lighthouse gap (see ## Gaps)

duration: 51min
completed: 2026-11-23
---

# Phase 13 Plan 03: Deploy and live proof Summary

**Phase 13 is live on umai-ramen.fr (86068ab). The IT/ZH routing matrix, 5-locale print fidelity, pills / footers / og:locale, the 375 px layout with Chinese glyphs and a fixed quick-nav all pass live. A reversible Sanity probe showed Studio it/zh values on /it/menu and /zh/menu with « FR Karaage » underneath, then put production back exactly as it was. Lighthouse holds accessibility 96 / best practices 100 / SEO 100 on all five menus, but the /fr/menu performance median is 87, from site-wide costs, so UI-04 stays open as a gap.**

## Performance

- **Duration:** about 51 min
- **Started:** 2026-11-23T21:51:42Z
- **Completed:** 2026-11-23T22:43Z (evidence); metadata commit follows
- **Tasks:** 3/3, plus the 2 orchestrator pre-deploy fixes
- **Files:** 3 source/script files modified, 1 script created, 4 probe backups, `deferred-items.md` updated

## Rollback points and deployed commit

| What | Value | How |
|---|---|---|
| Code (VPS) before the deploy | `34748ef` (Phase 12 code, VPS HEAD read just before the push) | `ssh umai-app 'cd /home/ek/apps/umai && git reset --hard 34748ef && docker compose -p umai up -d --build web'` |
| Deployed | `86068ab66230e6af6f9c917d4109fa44ef440ed0` (`PUSHED`) | VPS `git rev-parse HEAD` = `origin/v2-2026` = `PUSHED`; container `umai-web-1` recreated 2026-11-23 22:03:17 UTC |
| Content (Sanity) | unchanged by this plan | both probe runs reverted; final read identical to the backups (apart from `_rev` / `_updatedAt`) |

Commits after the deploy (`1350fff` and this docs commit, plus Phase 14's own commits) are local only and ride with the next push; none touches `src/`, so they need no redeploy.

## Accomplishments

- **Deployed**: secret scan 0 hits for the 4 `.env.local` secrets in the 24 outgoing commits, push `fbb724b..86068ab`, manual SSH deploy succeeded first try (no Google Fonts flake).
- **Live routing (I18N-02/05)**: `ROUTING OK base=https://umai-ramen.fr checks=84` (the same verifier failed 33 checks against the old live code in 13-01).
- **Live content (I18N-03, UI-02/03)**: `VERIFY OK … checks=309` on all five menu locales and the fr home; translated headings, units, badges, « Prix sur demande » and notes in every locale.
- **Live chrome (I18N-04)**: on every menu page, the 5 pills, exactly one `aria-current="page"` on its own pill, 0 `data-fr-name`, 0 `eazee-link.com`, og:locale fr_FR / en_US / de_DE / it_IT / zh_CN. Footers are « Suivez-nous » / « Follow us » / « Folgen Sie uns » / « Seguici » / « 关注我们 ». zh has `<html lang="zh-Hans">` and links to `/en/notre-histoire` and `/zh/menu`.
- **375 px (UI-04 layout, I18N-05 glyphs)**: `MOBILE OK` live. There is no page-level horizontal scroll, the pills measure 52/54/54/48/63 × 44 px, and the sticky quick-nav is present. zh uses PingFang SC from the system stack, and the screenshots show no tofu.
- **End to end (I18N-01, UI-01)**: `PROBE OK`. Studio values reach /zh/menu (« 日式炸鸡块 » / « 小吃 ») and /it/menu (« Pollo fritto giapponese » / « Antipasti »), each item with « FR Karaage » underneath. fr/en/de are unaffected, everything was reverted and verified.
- **Pre-deploy fixes**: the quick-nav no longer starts on a random category (live negative control on the old code: « Vins », « Cafés & Thés », « Spritz »), and Chinese dietary pills are 12 px.

## Task Commits

1. **Pre-deploy fix 1: quick-nav initial state** - `8f569fc` (fix)
2. **Pre-deploy fix 2: 12 px Chinese dietary pills** - `486d0b2` (fix)
3. **Task 1: verify-live covers it/zh + local production gate** - `86068ab` (feat)
4. **Task 2: deploy + live verification** - no commit (deploy only); deployed `86068ab`
5. **Task 3: Lighthouse protocol + reversible probe** - `1350fff` (feat: probe script + 4 backups)

**Plan metadata:** final `docs(13-03)` commit (SUMMARY, deferred-items, STATE, ROADMAP, REQUIREMENTS).

## Evidence

### Task 1: local production gate (purged build of the shipped code)

- `npx tsc --noEmit` exit 0; `node --test src/lib/menu.test.mjs src/i18n/locales.test.mjs` 59/59; `MESSAGES OK checks=1627`.
- `rm -rf .next/cache/fetch-cache && npx next build`: success first try (60 s). `/it/menu` and `/zh/menu` are prerendered.
- `VERIFY OK target=.next/server/app/<l>/menu.html locale=<l> expect=m26 checks=309` for fr, en, de, it, zh; `--locale zh --home` and `--locale it --expect legacy` exit 2 (usage).
- `ROUTING OK base=http://localhost:3100 checks=84`.
- `NAV PROBE OK` (scratch Playwright probe, 375 px): 3 fresh loads × 5 locales. Every load lands at `scrollY` 0 with « Entrées » active and `nav.scrollLeft` 0. A wheel-scroll to the Desserts section activates « Desserts » (nav scrolled to 628, tab visible). Back at the top, « Entrées » is active again. Computed dietary pill size: 12px on zh (`素:12px 无麸质:12px`), 10px on fr/en/de/it.
- `MOBILE OK` (the plan's `mobile-check.mjs`): scrollWidth 375 on all five, pills `52x44 54x44 54x44 48x44 63x44`, one current pill each, sticky nav, zh body/heading font stacks contain `PingFang SC`.
- Compiled CSS: `html:lang(zh-Hans){--font-body:…"PingFang SC"…}` and `.\[\&\:lang\(zh-Hans\)\]\:text-\[12px\]:lang(zh-Hans){font-size:12px}`.
- Local Lighthouse 13.3.0, mobile, one run per locale (host load 5.7 to 7.0, informative for performance):

| Locale | Perf | A11y | BP | SEO | Load | Failing audits (weight > 0, score < 0.9) |
|---|---|---|---|---|---|---|
| fr | 83 | 96 | 100 | 100 | 5.71 | FCP, LCP, TBT, color-contrast |
| en | 83 | 96 | 100 | 100 | 6.99 | FCP, LCP, color-contrast |
| de | 93 | 96 | 100 | 100 | 6.59 | TBT, color-contrast |
| it | 96 | 96 | 100 | 100 | 5.77 | color-contrast |
| zh | 83 | 96 | 100 | 100 | 6.96 | TBT, color-contrast |

The 44 `color-contrast` nodes are all pre-existing design colours, none in a Phase 13 element (the pills and dietary pills pass):
- brand green #77967A on ivory (2.87:1): the active quick-nav tab, the 8 sub-group labels, « service compris »;
- white on #77967A (3.26:1): the bestseller badge, the cookie « Accepter » button and the mobile bar button;
- decorative JP labels with opacity: 22 × 2.29:1 and 4 × 2.01:1;
- footer legal links (3.45:1).

### Task 2: deploy and live checks

```
VPS HEAD before deploy: 34748ef (rollback point)
secret scan (origin/v2-2026..HEAD): SANITY_WEBHOOK_SECRET 0, SANITY_TOKEN 0, DEPLOY_WEBHOOK_SECRET 0, IG_STUDIO_PASSWORD 0
PUSHED=86068ab66230e6af6f9c917d4109fa44ef440ed0   fbb724b..86068ab  v2-2026 -> v2-2026
deploy: Image umai-web Built / Container umai-web-1 Recreated / Started (first try)
VPS = origin = PUSHED: OK
ROUTING OK base=https://umai-ramen.fr checks=84
VERIFY OK target=https://umai-ramen.fr/fr/menu locale=fr expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/en/menu locale=en expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/de/menu locale=de expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/it/menu locale=it expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/zh/menu locale=zh expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/fr locale=fr expect=m26 home checks=8
HTML OK (fr/en/de/it/zh: status 200, aria-current=1 on /<l>/menu, data-fr-name=0, eazee-link.com=0, og:locale fr_FR/en_US/de_DE/it_IT/zh_CN, footers)
/studio 200, /fr 200, /en 200, /de 200, /fr/menu 200, /it/menu 200, /zh/menu 200
MOBILE OK (live, same numbers as local)
NAV PROBE OK (live, 2 fresh loads x 5 locales + Desserts + back-to-top + pill sizes)
TASK 2 VERIFY PASS (the plan's <verify> with the VPS/origin comparison against PUSHED)
```

### Screenshot review (zh, 375 px, local and live identical)

Both `zh-menu-375-top.png` and `zh-menu-375-notes.png` were read. They render real simplified-Chinese glyphs with no empty boxes or tofu:
- the title 菜单 and the subtitle 用心烹制，选用新鲜的本地食材;
- the pills FR EN DE IT 中文, with 中文 filled black;
- the section heading 菜品 under its 料理 label;
- the notes 品尝我们的手工拉面：从汤底到小麦面条，全部店内自制（…）。, 如需过敏原清单，请向店员索取。 and 价格已含服务费;
- the cookie banner 本网站使用 Cookie 进行访问量统计。 Cookie 政策 / 拒绝 / 接受.

Latin parts (category tabs, dish names in French fallback) stay in Outfit / DM Serif.

The notes shot shows « ENTRÉES » still underlined right after the instant jump to the bottom. That is screenshot timing: 1.2 s later the active tab is « Cafés & Thés », the last section, which is then in the observer band.

### Task 3A: live Lighthouse protocol (UI-04)

Lighthouse 13.3.0 CLI, mobile (simulated throttling), 3 passes × 5 URLs, 2026-11-23 22:07 to 22:18 UTC. Before each URL the run waited for a 1-minute load below 3 (polls of 30 s); the load before each run is recorded.

| Locale | Perf runs (median) | A11y runs (median) | BP runs (median) | SEO runs (median) | Median perf run: TBT / LCP | Load before runs |
|---|---|---|---|---|---|---|
| fr | 88 / 87 / 86 (**87**) | 96 / 96 / 96 (**96**) | 100 / 100 / 100 (**100**) | 100 / 100 / 100 (**100**) | 415 ms / 2.4 s (run 2) | 2.54 / 2.91 / 2.91 |
| en | 96 / 97 / 81 (**96**) | 96 / 96 / 96 (**96**) | 100 / 100 / 100 (**100**) | 100 / 100 / 100 (**100**) | 66 ms / 2.6 s (run 1) | 2.38 / 2.56 / 2.56 |
| de | 96 / 84 / 95 (**95**) | 96 / 96 / 96 (**96**) | 100 / 100 / 100 (**100**) | 100 / 100 / 100 (**100**) | 130 ms / 2.6 s (run 3) | 2.36 / 2.30 / 2.47 |
| it | 91 / 97 / 91 (**91**) | 96 / 96 / 96 (**96**) | 100 / 100 / 100 (**100**) | 100 / 100 / 100 (**100**) | 74 ms / 3.1 s (run 1) | 2.35 / 2.72 / 2.51 |
| zh | 93 / 95 / 91 (**93**) | 96 / 96 / 96 (**96**) | 100 / 100 / 100 (**100**) | 100 / 100 / 100 (**100**) | 66 ms / 2.9 s (run 1) | 2.82 / 2.88 / 2.69 |

Per run (FCP / LCP / TBT): fr 2.3 s / 3.1 s / 193 ms, 1.2 / 2.4 / 415, 1.5 / 2.7 / 405; en 1.7 / 2.6 / 66, 1.5 / 2.4 / 61, 1.4 / 2.8 / 568; de 1.7 / 2.6 / 65, 2.3 / 3.2 / 298, 1.7 / 2.6 / 130; it 2.3 / 3.1 / 74, 1.5 / 2.4 / 82, 2.3 / 3.1 / 79; zh 2.0 / 2.9 / 66, 1.3 / 2.2 / 228, 1.2 / 2.4 / 309. CLS 0 everywhere. The only failing non-performance audit is `color-contrast` (pre-existing, see above).

The fr median (87) misses. Its spread is 2 points and load stayed below 3, so the plan's redo rule (spread > 15 or load > 3) does not apply, and the miss goes under `## Gaps`.

**Diagnostic, not used for scoring:** fr and en were interleaved under the same gating (fr, en, fr, en, fr, en; load 2.12 to 2.98):

| Run | fr | en |
|---|---|---|
| 1 | 91 (TBT 259 ms) | 89 (TBT 134 ms) |
| 2 | 89 (TBT 174 ms) | 90 (TBT 326 ms) |
| 3 | 97 (TBT 138 ms) | 91 (TBT 136 ms) |
| median | **91** | **90** |

fr and en load the same 48 requests, 14 scripts (192 KB) and 875 DOM nodes. The swing comes from one late long task in the react-dom chunk `4fa395d360c87cc3.js` (202 KB raw / 64 KB gzip, `hydrateRoot`), whose scripting time varies from 396 to 867 ms between runs of the same page, and from the render-blocking CSS (savings from 100 to 1150 ms depending on the run).

### Task 3B: reversible Studio-field → page probe (I18N-01 + UI-01)

`--dry-run` twice (backups 222637 and 223706, nothing written), then two real runs.

**Run 1** (backup `probe-backup-20261123-222649.json`): `PROBE FAILED CHECK-ON`, then reverted cleanly.

```
PROBE APPLIED lWwPwzVj4paFn3vV2NOaeI
revalidate menuCategory -> 200 · menuItem -> 200   (34 s after the write)
CHECK-ON attempt 1..10/10: zh: no « 日式炸鸡块 »; zh: no « 小吃 »; zh: 0 FR-name segments (want 1) …
PROBE REVERTED lWwPwzVj4paFn3vV2NRXpu
CHECK-OFF OK attempt 1/10
FINAL READ OK: no name.it / name.zh, both documents identical to the backup (apart from _rev/_updatedAt)
```

Cause: after `revalidateTag` the next request is a blocking `MISS` render, which re-fetched the menu through the Sanity API CDN. The CDN still served the pre-write menu, and the tagged data cache (`revalidate: false`) then kept it. After the run, an extra `revalidate.mjs` (once the CDN was fresh) was followed by `MISS` renders with 0 probe strings in visible text and RSC payload, plus `VERIFY OK` on it and zh. The script was fixed (see Deviations).

**Run 2** (backup `probe-backup-20261123-223714.json`): **PROBE OK**

```
BASELINE OK attempt 1/1 (x-nextjs-cache fr=HIT en=HIT de=HIT it=HIT zh=HIT)
PROBE BACKUP .planning/phases/13-fondations-multilingues-page-menu-touriste/backup/probe-backup-20261123-223714.json
PROBE APPLIED nXr78YifWlVbPeAj46HcEw
APPLY API CDN up to date after 111s (category it/zh Antipasti / 小吃, item it/zh Pollo fritto giapponese / 日式炸鸡块)
revalidate menuCategory -> 200 · menuItem -> 200
CHECK-ON OK attempt 1/10 (x-nextjs-cache fr=MISS en=MISS de=MISS it=MISS zh=MISS)
PROBE REVERTED lWwPwzVj4paFn3vV2NTyra
REVERT API CDN up to date after 86s (category it/zh - / -, item it/zh - / -)
revalidate menuCategory -> 200 · menuItem -> 200
CHECK-OFF OK attempt 1/10 (x-nextjs-cache fr=MISS en=MISS de=MISS it=MISS zh=MISS)
FINAL READ OK: no name.it / name.zh, both documents identical to the backup (apart from _rev/_updatedAt)
EVIDENCE zh item row: primary « 日式炸鸡块 » | FR line « FR Karaage »
EVIDENCE zh category: heading « 小吃 » | quick-nav tab « 小吃 »
EVIDENCE it item row: primary « Pollo fritto giapponese » | FR line « FR Karaage »
EVIDENCE it category: heading « Antipasti » | quick-nav tab « Antipasti »
PROBE OK
```

CHECK-ON also held for en/de (0 FR line, French fallback « Karaage » / « Entrées ») and fr (0 FR line, no Chinese).

After the probe:
- `VERIFY OK … it … checks=309` and `VERIFY OK … zh … checks=309`;
- live /zh/menu has 0 `data-fr-name` and 0 « 日式炸鸡块 »;
- a direct read gives `m26-item-karaage` name `{"_type":"localeString","fr":"Karaage"}` and `m26-cat-entrees` name `{"_type":"localeString","fr":"Entrées"}`, with 0 drafts.

The backups and the script contain none of the `.env.local` secrets.

## Gaps

### UI-04: Lighthouse performance on /fr/menu (protocol median 87, target ≥ 90)

- **Numbers:** fr performance 88 / 87 / 86, median 87, load 2.54 / 2.91 / 2.91. The other four menu locales pass (en 96, de 95, it 91, zh 93), and all five have accessibility 96, best practices 100 and SEO 100.
- **Headroom is thin everywhere:** single runs range from 81 to 97, and the interleaved diagnostic gave fr 91 and en 90 as medians.
- **Cause (site-wide, not Phase 13):**
  1. **Main-thread / TBT:** one late long task (~3.2 s into the trace) in the react-dom framework chunk `4fa395d360c87cc3.js` (React hydration of the whole menu page), 396 to 867 ms scripting depending on the run. `mainthread-work-breakdown` puts TBT savings up to 400 ms.
  2. **Render-blocking CSS** (`render-blocking-insight`, FCP/LCP savings 100 to 1150 ms): the app CSS plus the `next/font/google` CSS (Outfit, DM Serif Display, Noto Sans JP).
  3. **Unused / legacy JS and CSS** (`unused-javascript` 90 to 150 ms, `unused-css-rules` 90 to 150 ms, `legacy-javascript-insight` 100 ms LCP).
- **Not Phase 13:** fr and en have identical requests, bytes and DOM. Phase 13 made the page lighter (−9.6 % HTML in 13-02; in 13-01, Noto Sans JP weight 300 and the DM Serif italic dropped, one font preload fewer), and the pre-Phase-13 baseline on /en/menu was 91 / 67 / 77.
- **Gap-closure directions** (outside this plan's guardrails):
  - self-host and subset the three fonts (`next/font/local`), which also removes the build flake;
  - reduce hydration work on the menu page (fewer or smaller client islands, a smaller RSC payload);
  - re-measure on a quiet host (load < 2) or with PageSpeed Insights once its quota allows.
- UI-04 stays unticked in REQUIREMENTS.md; the 375 px half of UI-04 (quick-nav, no horizontal scroll) is proven live.

## Decisions Made

See `key-decisions` above. In short:
- the quick-nav empty-band rule;
- the zh-only pill size;
- the deploy gate against `PUSHED`;
- the probe's CDN wait;
- UI-04 left pending under the plan's protocol;
- colours untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Quick-nav activated and centred an arbitrary category at load (orchestrator pre-deploy fix 1)**
- **Found during:** pre-existing, logged in 13-02 `deferred-items.md`; applied before the local gate as instructed.
- **Issue:** the initial IntersectionObserver callbacks reported ratio 0 for every section in no guaranteed order. The `reduce` tie-break picked a late entry, and the auto-centring scrolled the nav to it.
- **Fix:**
  - non-intersecting entries are removed from the ratio map;
  - an empty band sets the first tab only while the first section is below the band, otherwise it keeps the current tab;
  - the nav auto-scrolls only when the active tab changes, never on the initial render.

  The orchestrator's literal wording (« keep the FIRST category active ») would also reset the tab inside the 235 px « Boissons » header, which is taller than the 162 px band, and in the footer area. The hybrid keeps the required load behaviour without that flicker.
- **Files modified:** `src/components/menu/MenuStickyNav.tsx`
- **Verification:**
  - local and live, 375 px: « Entrées » active and `nav.scrollLeft` 0 on every fresh load of the 5 locales;
  - Desserts activated by wheel-scroll, first tab again at the top;
  - negative control against the old live code: « Vins », « Cafés & Thés », « Spritz ».
- **Committed in:** `8f569fc`

**2. [Rule 2 - Legibility] Chinese dietary pills 12 px (orchestrator pre-deploy fix 2)**
- **Issue:** 素 / 无麸质 were 10 px, hard to read on a phone.
- **Fix:** `[&:lang(zh-Hans)]:text-[12px]` on the `DietaryBadge` span (compiled to `…:lang(zh-Hans){font-size:12px}`).
- **Files modified:** `src/components/menu/DietaryBadge.tsx`
- **Verification:** computed `font-size` 12px on /zh/menu (4 pills), 10px on fr/en/de/it, local and live.
- **Committed in:** `486d0b2`

**3. [Rule 1 - Bug] The probe raced the Sanity API CDN (new script of this plan)**
- **Found during:** Task 3B, first real run.
- **Issue:** the spec's fixed `--delay 30` revalidated 34 s after the write. The CDN served the pre-write menu for 111 s, so the blocking `MISS` render re-cached the old menu and CHECK-ON could never pass. The same race could have left probe values live after the revert while a CHECK-OFF on a not-yet-regenerated page passed trivially.
- **Fix** in `probe-translation.mjs`:
  - after each write, poll the site's exact `MENU_CATEGORIES_QUERY` (read from `src/sanity/lib/queries.ts`) through `apicdn` with the site's client options until it shows the expected state (max 180 s), then revalidate (`--delay 30` kept);
  - re-send the revalidation after CHECK attempts 3 and 6;
  - CHECK-OFF also requires that no probe value appears in the raw HTML / RSC payload of any of the 5 pages;
  - each check line logs `x-nextjs-cache`.
- **Verification:** run 2 `PROBE OK` (CHECK-ON and CHECK-OFF both on attempt 1 with fresh `MISS` renders). After run 1, an extra signed `revalidate.mjs` plus checks confirmed production carried no probe data.
- **Committed in:** `1350fff` (the script was committed once, in its fixed form).

**4. [Rule 2 - Correctness] Probe safety beyond the spec**
- A read-only BASELINE check runs before any write; the probe aborts with nothing written if the live it/zh pages are not in the expected pre-probe state.
- The final read is compared with the backup (sorted keys, minus `_rev` / `_updatedAt`), proving the restore.
- SIGINT/SIGTERM stop the checks but never skip the revert.
- The probe warns on open Studio drafts and fetches pages with `redirect: 'manual'` (a 307 fails instead of silently checking /en).
- **Committed in:** `1350fff`

**5. [Orchestrator adjustment] Deploy gate against `PUSHED`, no post-deploy push**
- Phase 14 commits landed concurrently (a540f67, a7d5c73..b88c77f), so `PUSHED=$(git rev-parse HEAD)` was captured right before `git push origin v2-2026`.
- The VPS HEAD and `origin/v2-2026` were compared with it, never with the moving local HEAD. The Task 2 `<verify>` was run in that adapted form: `TASK 2 VERIFY PASS`.
- `1350fff` and the docs commit are not pushed (no `src/` change, no redeploy needed).

**6. [Process] Lighthouse runs as background passes**
- Following the plan-checker info item, each pass ran in the background with the load gate per URL, and pass 3 was chained after pass 2. Waits used an idle single-process file check instead of polling the task output.
- The interleaved fr/en diagnostic is extra and was not used for scoring.

**7. [Spec consequence] Four probe backups**
- The spec writes a backup on `--dry-run` too, so the folder holds 2 dry-run backups (`222637`, `223706`) and 2 real-run backups (`222649`, `223714`), all of the same pre-probe state.

---

**Total deviations:** 7 (2 orchestrator pre-deploy fixes, 1 bug fix and 1 hardening in the new probe, 1 orchestrator process adjustment, 1 measurement process note, 1 spec consequence).
**Impact on plan:** no scope creep. Every change stays in Phase 13 files or this plan's own new script. No colour, font or framework change.

## Issues Encountered

- The zh notes screenshot shows the first tab still active right after the instant jump. This is screenshot timing, explained in the screenshot review.
- Lighthouse 13 no longer emits classic « opportunity » audits for most savings. The cause analysis uses the insight audits (`render-blocking-insight`, `legacy-javascript-insight`, `unused-*`), `bootup-time`, `long-tasks` and `mainthread-work-breakdown`.
- During the live Lighthouse runs the host load stayed between 2.1 and 3.0 (4 cores, other workloads including the concurrent Phase 14 agent; the local runs, with `next start` up, saw 5.7 to 7.0), so a load below 2 was never reached for an optional quieter remeasure.

## Known Stubs

None. `data-fr-name` stays 0 on the live pages because no it/zh/en/de content exists yet (Phase 14); the probe proved the path with real Studio values.

## User Setup Required

None. Optional for EK: see the hand-off below (Sanity webhook caveat, brand colour decision).

## Next Phase Readiness

**Phase 14 (translations):**
- **Wait for the API CDN before revalidating.** After `sync-menu.mjs --apply`, wait about 2 minutes, or poll the CDN like `probe-translation.mjs` does, before `revalidate.mjs`. Then run `verify-live.mjs` per locale and re-run `revalidate.mjs` while a page still shows old content. Revalidating within a minute of the write re-caches the old menu (`deferred-items.md` item 3).
- The durable fix is `useCdn: false` for the tagged fetches in `src/sanity/lib/client.ts`, which is outside Phase 13's scope. Without it, a future Sanity webhook would race the CDN in the same way.
- `verify-live.mjs` reads `L(field) = field[locale] ?? field.fr` from `menu-2026.json`, so once it/zh are in the JSON it expects the translated names on /it/menu and /zh/menu without code change.
- `probe-translation.mjs` exits 3 (`PROBE SKIP`) as soon as Karaage or Entrées carry it/zh content.

**Phase 15 (QR):** `/{locale}/menu/qr` inherits the layout's fr/en/de prerender only. Add a `generateStaticParams` like the menu page's if it/zh should be prerendered (otherwise they render on demand). `isMenuPath('/menu/qr')` already lets it/zh through the proxy.

**UI-04:** a gap-closure plan for the Lighthouse performance headroom (see `## Gaps`).

---

## Remise à EK (FR)

**En ligne depuis le 23/11/2026 (commit 86068ab) :** https://umai-ramen.fr/it/menu et https://umai-ramen.fr/zh/menu

**Ce qui change pour les visiteurs :**

1. **Pastilles de langue sur le menu** : sous le titre de chaque page menu, cinq pastilles FR · EN · DE · IT · 中文 (la langue en cours est en noir). Le touriste change de langue sans quitter le menu ni rescanner le QR code.
2. **Italien et chinois = menu seulement** : toute autre page demandée en italien ou en chinois renvoie vers la version anglaise. Le sélecteur de langue de l'en-tête reste FR / EN / DE ; IT et 中文 n'existent que dans les pastilles de la page menu.
3. **Le nom français reste visible** : dès qu'un plat aura sa traduction (phase 14), la page affichera le nom traduit puis, juste en dessous, une ligne « FR Karaage » (le nom à dire au serveur). Je l'ai testé en production sur Karaage et Entrées (« 日式炸鸡块 » et « Pollo fritto giapponese » avec « FR Karaage » dessous), puis retiré : la page et Studio sont revenus exactement comme avant.
4. **Lien eazee-link retiré** du bas de la page menu : l'ancienne carte numérique affichait de vieux prix. Le lien reste enregistré dans Studio (`siteSettings.eazeeLinkUrl`), rien n'est supprimé.
5. **Bandeau cookies en anglais** : le lien s'appelle maintenant « Cookie policy » (au lieu de « Learn more »).
6. **Pied de page traduit** en anglais et en allemand (il était en français partout).
7. **Pastilles régime** : V / GF en anglais et en allemand (V / SG en français et en italien ; 素 / 无麸质 en chinois, en 12 px pour rester lisibles).
8. **Barre des catégories** : à l'arrivée sur le menu, elle commence sur « Entrées ». Avant, elle sautait au hasard sur « Vins », « Desserts » ou « Bières ».
9. **Studio** : les champs « Italien » et « Chinois (simplifié) » sont prêts dans le bloc replié « Traductions » de chaque nom et description. La phase 14 les remplira.

**Décision de charte pour toi : le vert de la marque.** Le vert #77967A sur le fond ivoire donne un contraste de 2,87:1, et le texte blanc sur ce vert 3,26:1, alors que la norme d'accessibilité (WCAG AA) demande 4,5:1 pour du petit texte. C'est le cas de :
- l'onglet actif de la barre des catégories ;
- les petites mentions vertes (sous-groupes, « service compris ») ;
- le badge best-seller ;
- le bouton « Accepter » du bandeau cookies et la barre mobile.

Un vert un peu plus foncé comme **#567058** passerait dans les deux sens (environ 4,8:1 sur ivoire et 5,4:1 en blanc sur vert). Même famille de remarque : les petits libellés japonais décoratifs (transparents à 60–70 %, environ 2:1) et les liens légaux gris du pied de page (3,45:1). Le score Lighthouse « Accessibilité » reste à 96/100 malgré cela. Je n'ai rien changé : c'est un choix de charte.

**Performance (point resté ouvert) :** Lighthouse mobile donne Accessibilité 96, Bonnes pratiques 100 et SEO 100 sur les 5 langues. En Performance, les médianes sont FR 87, EN 96, DE 95, IT 91, ZH 93. La page française passe juste sous 90 dans la série officielle à cause de coûts communs à tout le site (démarrage de React, CSS des polices Google), pas d'un élément de cette phase ; une seconde série donne 91 pour la page française. Un plan de correction dédié suivra.

**Important : une modification faite dans Studio n'arrive pas toute seule sur le site** (aucun webhook Sanity ne pointe vers umai-ramen.fr). Après une publication, **attendre environ 2 minutes** (le temps que le CDN de Sanity se mette à jour), puis lancer :

```
node --env-file=.env.local scripts/menu-2026/revalidate.mjs
```

Si la page montre encore l'ancien contenu, relancer la même commande. Vérifié aujourd'hui : lancée 30 secondes après la publication, elle remet l'ancien menu en cache.

**Retour arrière si besoin** (revient au code d'avant la phase 13 ; le contenu Sanity n'a pas été modifié par ce plan) :

```
ssh umai-app 'cd /home/ek/apps/umai && git reset --hard 34748ef && docker compose -p umai up -d --build web'
```

Sauvegardes du test de traduction : `.planning/phases/13-fondations-multilingues-page-menu-touriste/backup/`.

---
*Phase: 13-fondations-multilingues-page-menu-touriste*
*Completed: 2026-11-23*

## Self-Check: PASSED

- Files present: `scripts/i18n/probe-translation.mjs`, `scripts/menu-2026/verify-live.mjs`, `src/components/menu/MenuStickyNav.tsx`, `src/components/menu/DietaryBadge.tsx`, the 4 `backup/probe-backup-*.json`, `deferred-items.md`, this SUMMARY
- Commits present: `8f569fc`, `486d0b2`, `86068ab`, `1350fff`; together they touch exactly those 8 files (no `docker-compose.yml`, `Dockerfile`, `Caddyfile`, `deploy/`, `.dockerignore`, `.claude/`, `ig-studio/*`, `.planning/config.json`, no Phase 14 path)
- Deploy: `origin/v2-2026` = VPS HEAD = `PUSHED` = `86068ab66230e6af6f9c917d4109fa44ef440ed0` (re-read after the probe)
- Production content: `m26-item-karaage` / `m26-cat-entrees` FR-only names, 0 drafts; live it/zh `VERIFY OK`, 0 `data-fr-name`, 0 probe strings
- No stub markers in the files of this plan; no secret in any committed file or output
