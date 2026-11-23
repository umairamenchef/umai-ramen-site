---
phase: 13-fondations-multilingues-page-menu-touriste
verified: 2026-11-23T23:14:01Z
status: passed
score: 32/32 must-haves verified (5 ROADMAP success criteria + 27 PLAN truths)
---

# Phase 13: Fondations multilingues & page menu touriste — Verification Report

**Phase Goal:** A tourist can open the menu in English, German, Italian or Chinese on a phone, switch language without rescanning, and read each dish with the translated name first and the French name always visible; IT and ZH exist for the menu only.
**Verified:** 2026-11-23T23:14:01Z
**Status:** passed
**Re-verification:** No — initial verification (no previous VERIFICATION.md in the phase folder)

Scope note: Phase 14 translations are NOT published yet (production Sanity has 0 menu documents with an `it` / `zh` name, see below), so the live EN/DE/IT/ZH pages show French content inside a translated UI. 0 `data-fr-name` live is therefore expected. UI-01 (translated name first, French name visible) is evaluated through the unit tests, a render of the real component with fixtures, and 13-03's reversible live Studio probe.

## How this was verified (independence)

SUMMARY claims were not trusted. Evidence comes from these independent sources:

1. **The code** (HEAD `92ad759`; `git diff 86068ab HEAD -- src` is empty, so the source tree is exactly the deployed commit `86068ab`, which equals `origin/v2-2026`): every file named in the three PLAN frontmatters was read, and the `must_haves` artifacts and key links were checked by a script that parses the YAML (15/15 artifacts; 15/16 key links by pattern, the 16th being the deploy link `local HEAD -> VPS`, which is a procedure and is covered by behaviour below).
2. **The live site** `https://umai-ramen.fr` (GET only): redirect / status matrix with `curl` (including percent-encoded, upper-case, detection by `Accept-Language` and `NEXT_LOCALE`), response headers, raw HTML of the five menu pages, `sitemap.xml`, the compiled CSS (`@font-face` list) and the deployed Studio JS bundle.
3. **Headless Chromium** (Playwright Chromium from `~/Library/Caches/ms-playwright`, driven by `playwright-core`, mobile emulation 375 x 812 @2x): layout metrics, pills, quick-nav, language-switch clicks, order modal, screenshots that I read.
4. **Local commands:** `node --test`, `check-messages.mjs`, `npx tsc --noEmit`, and the two verifiers against the live site (`verify-routing.mjs`, `verify-live.mjs`).
5. **The real `MenuItem` component rendered server-side** with translated fixtures through `tsx` (scratchpad script, no network, no Sanity): proves UI-01 / UI-02 rules on the actual component.
6. **Client-side only DOM injection** of those rendered rows into the live pages inside my own headless browser, to judge the French line on the production CSS (nothing is sent to the site).
7. **Read-only Sanity GROQ** (public API, no token): confirms the 13-03 probe was fully reverted.
8. **Lighthouse 13.3.0 CLI** (mobile, simulated throttling): one fresh 3-run series on each of the five menu locales.

Deliberately NOT run: `probe-translation.mjs`, `sync-menu.mjs`, `apply-translations.mjs`, `revalidate.mjs`, any Sanity write, any deploy or production build, SSH. Everything I created is in the scratchpad; the repo working tree is unchanged apart from this file. (An `npx eslint` attempt found no ESLint config in the repo and only fetched eslint into the global npx cache; no repo change.)

## Goal Achievement

### Observable Truths — ROADMAP success criteria (the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | In Studio every translatable menu text offers Italian and Chinese inputs next to FR/EN/DE, and a value typed there appears on `/it/menu` or `/zh/menu` | ✓ VERIFIED | **Schema:** `localeString.ts` / `localeText.ts` define `it` (« Italien ») and `zh` (« Chinois (simplifié) ») in the collapsed « Traductions » fieldset; every menu text field uses those two types (menuItem name / description / subgroup, menuCategory name / description / footnote, priceVariant label, menuExtra and menuFormule name). **Deployed Studio:** the live bundle `/_next/static/chunks/de8bc4ad9bc35c8f.js` contains both definitions for `type:"string"` and `type:"text"`. **Read path:** `MENU_CATEGORIES_QUERY` returns the whole `name` / `description` objects; `pickLocale` reads `it` / `zh` and treats blank values as missing (40 unit tests). **End to end:** 13-03 `PROBE OK` (Studio values « 日式炸鸡块 » / « Pollo fritto giapponese » shown live with « FR Karaage » underneath, then reverted); my read-only GROQ now shows `m26-item-karaage` and `m26-cat-entrees` with FR-only names, 0 drafts, and 0 of 244 menuItem / 46 menuCategory documents with an `it` / `zh` name; live pages contain no probe string. Operational caveat (not a Phase 13 defect): an edit reaches the site only after the documented publish step (wait about 2 min, then `revalidate.mjs`), because no Sanity webhook targets umai-ramen.fr yet. |
| 2 | `/it/menu` and `/zh/menu` load; any other `/it/*` / `/zh/*` redirects to its `/en/*` equivalent; `/fr`, `/en`, `/de` unchanged; hreflang and `sitemap.xml` list IT/ZH menu URLs and only those | ✓ VERIFIED | `curl` live: `/it/menu` 200, `/zh/menu` 200; `/it` and `/zh` 307 `/en`; `/it/infos` and `/zh/infos` 307 `/en/infos`; `/zh/notre-histoire?ref=qr` 307 `/en/notre-histoire?ref=qr`; `/zh/mentions-legales` 307; `/z%68/infos` 307 `/en/infos`; `/%69t` 307 `/en`; `/ZH/infos` 307 `/en/infos`; `/%7A%68/menu` and `/zh/%6Denu` 200; `/fr`, `/en`, `/de` 200. Detection: `/` with `Accept-Language` zh-CN or it-IT, or cookie `NEXT_LOCALE=zh` / `it`, ends on `/en` in one 307; `/infos` + cookie it goes to `/en/infos`; `/menu` + cookie zh goes to `/zh/menu`; `/` alone goes to `/fr`; de-DE goes to `/de`. hreflang on `/zh/menu`: fr, en, de, it, zh-Hans + x-default `/fr/menu`; `/en/infos` has only fr, en, de + x-default. Sitemap: 38 `<loc>`, only IT/ZH entries `/it/menu` and `/zh/menu`, each with the 5 alternates; no non-menu IT/ZH alternate anywhere. No `Link` header on `/fr/menu`. `verify-routing.mjs --base https://umai-ramen.fr` run by me: `ROUTING OK checks=84`. |
| 3 | A switcher at the top of the menu (FR · EN · DE · IT · 中文) changes the language while keeping the visitor on the menu; headings, badges, units and the two notes appear in the selected language | ✓ VERIFIED | Live HTML of the 5 pages: nav `data-menu-locale-switcher` with 5 plain `<a>` to `/{l}/menu` (`lang` / `hrefLang` fr, en, de, it, zh-Hans), exactly one `aria-current="page"`, localized `aria-label`. **Click-through in a real browser** (live): from `/fr/menu` clicking 中文, IT, DE, EN, FR lands on `/zh/menu` (`lang=zh-Hans`, h2 « 菜单 »), `/it/menu` (« Il nostro menù »), `/de/menu` (« Unsere Speisekarte »), `/en/menu` (« Our Menu »), `/fr/menu` (« Notre Menu »), 0 non-GET requests. Labels per locale (live): section « Plats / Food / Speisen / Piatti / 菜品 »; units « 3 pcs / 3 pcs / 3 Stk. / 3 pz / 3个 » (and 6, 9, 2); badges « Notre best-seller / Our best-seller / Unser Bestseller / Il nostro best seller / 人气招牌 » and the vegetarian-version badge in all 5; « Prix sur demande / Price on request / Preis auf Anfrage / Prezzo su richiesta / 价格请咨询店员 »; allergens note and « service included » note translated in all 5 (e.g. « Servizio incluso », « 价格已含服务费 »). `verify-live.mjs --locale {fr,en,de,it,zh}` run by me: `VERIFY OK … checks=309` five times. Order modal opened on `/zh/menu` and `/it/menu`: « 您想如何点餐？ » / « Come desideri ordinare? ». |
| 4 | On `/en`, `/de`, `/it`, `/zh` every item shows the translated name first and the French name as clearly legible secondary text (once when identical); `/fr/menu` stays French-only without duplicate; Chinese renders in simplified glyphs with no missing characters under a simplified-Chinese `lang` | ✓ VERIFIED (translated content itself is Phase 14) | **Rule + component:** `secondaryFrenchName` (11 dedicated tests, RED before GREEN) and `MenuItem.tsx` (`frenchName = secondaryFrenchName(item.name, locale)`, `data-fr-name` line with « FR » chip and `<span lang="fr">`). **Real component rendered with fixtures** (my `tsx` script): en `Japanese fried chicken` + `FR Karaage`; de `Japanisches Brathähnchen` + FR line; it `Pollo fritto giapponese` + FR line; zh `日式炸鸡块` + FR line; fr `Karaage` with 0 `data-fr-name`; `Gyoza` identical in every language renders once; untranslated item renders once; blank translation (`"   "`, `""`) falls back to French once; a translation that contains the French name (« Tantan Ramen (spicy sesame ramen) ») renders once. **Legibility on the production CSS:** the same rows injected into the live pages in my browser (not sent anywhere) give the French line computed 14 px, weight 500, the dark text colour at 80 % opacity on `#F5F0E8` (about 8.5:1 by my own blend calculation), « FR » chip 10 px `#6B6B6B` (about 4.7:1); screenshots read: the line sits directly under the translated name, inside the same row as the price(s), page `scrollWidth` stays 375 with a long German name. **Live probe (13-03):** `PROBE OK`, « FR Karaage » under the Italian and Chinese names, 0 FR line on fr / en / de during the probe, fully reverted. **/fr:** 0 `data-fr-name` live. **Chinese glyphs:** `<html lang="zh-Hans">`, computed font stack `Outfit, … "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif`; screenshots read: 菜单, 用心烹制，选用新鲜的本地食材, 中文, 料理, 菜品, 3个, cookie banner 本网站使用 Cookie 进行访问量统计。, zh footer, all real simplified glyphs, no tofu; the compiled CSS has no CJK webfont other than the pre-existing decorative Noto Sans JP (400, 124 slices). |
| 5 | At 375 px the menu has a category quick-nav, no horizontal scroll, and Lighthouse stays above 90 on every menu locale, including `/zh/menu` | ✓ VERIFIED (performance has a measurement-variance caveat, see « UI-04 Lighthouse ») | **375 px (live, 5 locales):** `documentElement.scrollWidth` = `innerWidth` = 375 (also after tapping the « Desserts » tab and in the injected-row test), 0 off-screen elements outside the quick-nav scroller; pills 52.1 / 53.7 / 54 / 47.8 / 63.4 px wide, all 44 px high, on one row; quick-nav present (20 tabs, `aria-label` localized, food | drinks divider). Fresh load: « Entrées » active, `scrollY` 0, `nav.scrollLeft` 0 on every locale (2 loads each); tap on « Desserts » scrolls the page there (section top 132 px = header 80 + nav 51), activates the tab and centres it. **Lighthouse (my series, 3 runs per locale, live):** performance medians fr 97, en 92, de 93, it 96, zh 96; accessibility 96, best-practices 100, SEO 100 in all 15 runs. 13-03's own series had fr at 87 (88 / 87 / 86) and en 96, de 95, it 91, zh 93; see the dedicated section. |

### UI-04 Lighthouse: two sessions, one verdict

| Session | fr | en | de | it | zh | Accessibility / BP / SEO |
|---------|----|----|----|----|----|--------------------------|
| 13-03 protocol (22:07–22:18 UTC, load-gated < 3) | 88 / 87 / 86 → **87** | 96 / 97 / 81 → 96 | 96 / 84 / 95 → 95 | 91 / 97 / 91 → 91 | 93 / 95 / 91 → 93 | 96 / 100 / 100 on all |
| 13-03 interleaved fr / en diagnostic | 91 / 89 / 97 → 91 | 89 / 90 / 91 → 90 | | | | |
| **This verification** (22:57–23:07 UTC, Lighthouse 13.3.0, Chromium 1228, 1-min load 2.2–3.4 on 4 cores) | 96 / 98 / 97 → **97** | 92 / 83 / 98 → **92** | 93 / 97 / 93 → **93** | 96 / 92 / 96 → **96** | 93 / 96 / 100 → **96** | 96 / 100 / 100 on all 15 runs |

My per-run numbers for fr: LCP 2.0 / 2.3 / 2.1 s, TBT 200 / 100 / 170 ms, CLS 0. The only weighted audit failing outside the four timing metrics, in all 15 runs, is `color-contrast` (44 nodes, all pre-existing design colours: brand green on ivory 2.87:1, white on green 3.26:1, decorative JP labels, footer legal links; none of the nodes is a Phase 13 element, the pills and dietary pills pass).

Verdict: the plan's own contract (median of 3 runs at or above 90 per locale) holds in a fresh independent series on all five locales, with `/zh/menu` at or above 91 in all six recorded zh runs (93 / 95 / 91 and 93 / 96 / 100) and `/it/menu` at or above 91 in all six (91 / 97 / 91 and 96 / 92 / 96). The 13-03 miss on `/fr/menu` (median 87) did not reproduce (96 / 98 / 97 on the same page, same method), and the pooled nine fr runs (86 to 98) have a median of 91. The margin is nevertheless noisy: single runs range from 81 to 100 across both sessions (en 81 and 83, de 84 in single runs) and the swing comes from one hydration long task, as 13-03 diagnosed. I therefore treat the Lighthouse half of UI-04 as met, record the variance as a watch item (not a gap), and recommend re-measuring after Phase 14 publishes content (each translated item adds a `data-fr-name` line and translated strings to the page).

### Observable Truths — PLAN must_haves

| Plan | # | Truth (short) | Status | Evidence |
|------|---|---------------|--------|----------|
| 13-01 | 1 | `/it/menu`, `/zh/menu` return 200 with `<html lang="it">` / `<html lang="zh-Hans">`; `/fr`, `/en`, `/de` as before | ✓ | Live raw HTML: `lang="it"` and `lang="zh-Hans"`; fr / en / de `lang` fr / en / de; 200 on all |
| 13-01 | 2 | Every other `/it/*` and `/zh/*` answers 307 to the same path under `/en`, query kept | ✓ | Live matrix above (`?ref=qr` kept; encoded and upper-case prefixes also caught); `src/proxy.ts` uses `menuOnlyRedirectPath` before next-intl, 307 |
| 13-01 | 3 | Detection never lands on a non-menu IT/ZH page; `/menu` + zh cookie goes to `/zh/menu`; `/` alone to `/fr`; de-DE to `/de` | ✓ | Live matrix above; `proxy.ts` rewrites next-intl's `Location` through the same rule |
| 13-01 | 4 | `/it/menu`, `/zh/menu` read menu labels, notes, nav, common, consent, order modal, footer, `meta.menu` from `it.json` / `zh.json`; missing keys fall back to English, never a raw key | ✓ | `it.json` / `zh.json` hold exactly `common, nav, menu, consent, orderModal, footer, meta`; `request.ts` merges EN underneath (`mergeMessages`, tested); live: the EN-only `gallery.subtitle` string is in the `/it/menu` and `/zh/menu` payload, 0 raw `menu.*` / `nav.*` / `footer.*` tokens and no `MISSING_MESSAGE` on any of the 5 pages; order modal and cookie banner translated |
| 13-01 | 5 | Phase 12 findings closed: `meta.menu.description` has no formules / set menus in 5 locales; `menu.diet.*` exists in 5 locales (FR V/SG, EN and DE V/GF, IT V/SG, ZH 素/无麸质) | ✓ | Live `<meta name="description">` of the 5 pages: no « formule », « set menu », « Menüs », « 套餐 »; message files hold the golden diet values; `check-messages.mjs` `MESSAGES OK checks=1627` |
| 13-01 | 6 | hreflang with `it` and `zh-Hans` only on the menu (x-default `/fr/menu`); other pages fr/en/de + x-default; sitemap 38 URLs with only the two IT/ZH menu entries | ✓ | See SC 2 |
| 13-01 | 7 | No response carries next-intl's `Link` hreflang header | ✓ | `alternateLinks: false` in `routing.ts`; live `/fr/menu` has no `Link` header; `verify-routing.mjs` checks it on 11 pages |
| 13-01 | 8 | Non-menu pages not prerendered for it/zh (layout `generateStaticParams` = fr/en/de); choice documented | ✓ | `layout.tsx` returns `FULL_SITE_LOCALES` with the rationale in a comment; the existing local `.next/server/app/{it,zh}/` (read-only inspection) holds only `menu.*`, no `it.html`, `zh.html` or `infos` |
| 13-01 | 9 | Global CSS no longer declares Noto Sans JP 300 nor DM Serif italic | ✓ | Live CSS (2 stylesheets): `@font-face` Noto Sans JP 400 normal x 124 only, DM Serif Display 400 normal x 2 only, Outfit 300/400/500/600 normal; 2 font preloads |
| 13-02 | 1 | Pill switcher on every menu page: real links, `hrefLang` / `lang` (zh-Hans), `aria-current`, each pill at least 44 x 44, wraps at 375 | ✓ | Live 375 px metrics (SC 3 and 5); `MenuLanguageSwitcher.tsx` `min-h-11 min-w-11`, `flex-wrap` |
| 13-02 | 2 | Translated name first, French name on a smaller « FR » line (`data-fr-name`, 14 px, AA); untranslated or containing-FR renders once | ✓ | SC 4 (component render, injected-row computed style, probe) |
| 13-02 | 3 | `/fr/menu` has no secondary French line (0 `data-fr-name`) | ✓ | Live fr: 0; component render fr: 0 |
| 13-02 | 4 | Dietary pills read short label and full name from `menu.diet.*` | ✓ | Live: zh `title="素食"`, `无麸质`; en `Vegetarian` / `Gluten-free` in sr-only text and `title`; it `Vegetariano`; `DietaryBadge.tsx` uses `diet.*`; zh pill computed 12 px, en / it 10 px |
| 13-02 | 5 | eazee-link CTA gone in every locale | ✓ | Live: 0 `eazee-link.com` on the 5 pages and 0 `eazee` hrefs in the DOM; `page.tsx` no longer fetches or renders it |
| 13-02 | 6 | `/zh/menu` uses the system simplified-Chinese stack after Outfit / DM Serif, no CJK webfont | ✓ | Computed `body` and `h2` font-family on the live zh page (SC 4); `globals.css` `html:lang(zh-Hans)` in `@layer base` |
| 13-02 | 7 | Studio offers « Italien » / « Chinois (simplifié) » in the collapsed fieldset; `localized()` reads them; blank falls back to French | ✓ | SC 1; `localized.ts` delegates to `pickLocale` (blank-safe, tested) |
| 13-02 | 8 | Header and drawer switcher FR/EN/DE only; on `/it/menu` and `/zh/menu` non-menu links and the cookie link go straight to `/en/…`, « Menu » links stay on the locale | ✓ | Live `/zh/menu` links: `/zh/menu`, `/en`, `/en/notre-histoire`, `/en/infos`, `/en/galerie`, `/en/mentions-legales`, `/en/politique-confidentialite`, `/en/politique-cookies`, `/en/cgv`, and the switch buttons « Switch to FR / EN / DE »; saved `/it/menu` HTML: only `/it/menu` among `/it/*` hrefs (same for zh) |
| 13-02 | 9 | Footer from the `footer` namespace (FR identical, EN / DE no longer French, IT / ZH translated); headings are `h2` | ✓ | Live: 0 `<h5` on the 5 pages, 3 `<h2>` in each footer; zh footer screenshot read (网站导航, 关注我们, 法律声明, 隐私政策, Cookie 政策, 销售条款); en « Follow us », it « Seguici » (13-03 HTML contracts) |
| 13-02 | 10 | Quick-nav receives only slug / name / section, has an `aria-label`, shows a food / drinks divider | ✓ | `page.tsx` `navCategories` maps `{ slug, name, section }`; live HTML: 0 `isGlutenFree`, one `w-px` divider span, localized `aria-label` (« Menu categories », « Kategorien der Speisekarte », « 菜单分类 », …) |
| 13-02 | 11 | `/it/menu`, `/zh/menu` prerendered by the build, `og:locale` it_IT / zh_CN | ✓ | Live headers on `/it/menu`, `/zh/menu`: `x-nextjs-prerender: 1`; local `.next/server/app/{it,zh}/menu.html` exist; `og:locale` fr_FR / en_US / de_DE / it_IT / zh_CN |
| 13-03 | 1 | Live site runs the Phase 13 code; pre-deploy commit recorded as rollback point | ✓ | `origin/v2-2026` = `86068ab` and `src/` at HEAD is identical to it; live behaviour contains the last two code fixes (quick-nav first tab at scroll 0, zh pill 12 px); rollback commit `34748ef` exists locally and is documented in the SUMMARY and the FR hand-off. VPS HEAD itself not read (no SSH) |
| 13-03 | 2 | `verify-routing.mjs` against the live site prints `ROUTING OK` | ✓ | Run by me: `ROUTING OK base=https://umai-ramen.fr checks=84` |
| 13-03 | 3 | `verify-live.mjs --expect m26` prints `VERIFY OK` on the 5 live menu pages | ✓ | Run by me: `VERIFY OK … checks=309` for fr, en, de, it, zh |
| 13-03 | 4 | Every live page: pills with one `aria-current`, no eazee-link CTA, 0 `data-fr-name` (French fallback), translated footer, og:locale | ✓ | SC 3; extraction of the 5 pages by my own script |
| 13-03 | 5 | At 375 px: no horizontal scroll, 5 pills at least 44 px, sticky quick-nav, zh glyphs fine | ✓ | SC 5 and SC 4 (my screenshots) |
| 13-03 | 6 | Lighthouse median of 3 at or above 90 on each locale, or every miss recorded under `## Gaps` | ✓ | 13-03 recorded the fr miss under `## Gaps`; my fresh series meets the target on all five locales (section above) |
| 13-03 | 7 | Probe: it/zh values on Karaage and Entrées show on `/zh/menu`, `/it/menu` with « FR Karaage »; then removed, production back to pre-probe content | ✓ | `probe-translation.mjs` (505 lines, syntax OK, unset in `finally`, final read compared with the backup); SUMMARY transcript `PROBE OK`; 4 backups present; my GROQ read confirms FR-only names, 0 drafts, 0 it/zh anywhere in menu docs |

**Score:** 32/32 truths verified (5 ROADMAP + 9 + 11 + 7 plan truths)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/i18n/locales.ts` | single source of locale rules | ✓ VERIFIED | 140 lines, `menuOnlyRedirectPath`, `mergeMessages`, `htmlLang`, `ogLocale`, `localesForPath`; no runtime imports; imported by routing, request, proxy, layout, seo, sitemap, switcher, chrome |
| `src/i18n/locales.test.mjs` | node:test suite | ✓ VERIFIED | 204 lines, 19 tests pass |
| `scripts/i18n/check-messages.mjs` | message contract | ✓ VERIFIED | `MESSAGES OK checks=1627` |
| `src/messages/it.json`, `zh.json` | menu + chrome strings | ✓ VERIFIED | 73 lines each, 7 namespaces, `title` « Il nostro menù » / « 菜单 » |
| `scripts/i18n/verify-routing.mjs` | routing verifier | ✓ VERIFIED | 279 lines, `ROUTING OK` live |
| `src/components/menu/MenuLanguageSwitcher.tsx` | pill switcher | ✓ VERIFIED | `data-menu-locale-switcher`, `LOCALES.map`, rendered by `menu/page.tsx` |
| `src/lib/menu.ts` | it/zh `LocaleField`, `pickLocale`, `secondaryFrenchName` | ✓ VERIFIED | 224 lines, 40 tests pass |
| `src/components/menu/MenuItem.tsx` | bilingual row | ✓ VERIFIED | `data-fr-name`, `secondaryFrenchName(item.name, locale)` |
| `src/app/globals.css` | zh font stack | ✓ VERIFIED | `html:lang(zh-Hans)` block; computed live |
| `src/sanity/schemaTypes/localeString.ts`, `localeText.ts` | it / zh inputs | ✓ VERIFIED | present in the deployed Studio bundle |
| `src/components/layout/Footer.tsx` | translated footer, site-locale links | ✓ VERIFIED | `useTranslations('footer')`, `siteLocaleFor` |
| `scripts/menu-2026/verify-live.mjs` | covers it / zh | ✓ VERIFIED | `LOCALES = ['fr','en','de','it','zh']`, 5 live passes |
| `scripts/i18n/probe-translation.mjs` | reversible probe | ✓ VERIFIED | not executed by me (forbidden), syntax checked, revert in `finally` |
| `…/13-…/backup/` | pre-probe backups | ✓ VERIFIED | 4 JSON files |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `proxy.ts` | `locales.ts menuOnlyRedirectPath` | pre-intl redirect + Location rewrite | ✓ WIRED | live redirects behave as coded |
| `request.ts` | `en.json` + `it.json` / `zh.json` | `mergeMessages` | ✓ WIRED | EN-only string present in the live zh / it payload |
| `routing.ts` | `locales.ts` | `LOCALES`, `alternateLinks: false` | ✓ WIRED | no `Link` header live |
| `seo.ts buildAlternates` / `sitemap.ts` | `localesForPath` | per-path locale list | ✓ WIRED | live hreflang and sitemap |
| `layout.tsx` | `htmlLang`, `FULL_SITE_LOCALES` | `<html lang>`, static params | ✓ WIRED | live `lang`; `.next` has no non-menu it/zh pages |
| `MenuItem.tsx` | `menu.ts secondaryFrenchName` | FR line | ✓ WIRED | component render |
| `menu/page.tsx` | `MenuLanguageSwitcher` | rendered under the header | ✓ WIRED | live DOM |
| `localized.ts` | `pickLocale` | single fallback | ✓ WIRED | tests |
| Header / MobileMenu / Footer / CookieBanner | `siteLocaleFor` | `locale` prop on non-menu links | ✓ WIRED | live hrefs |
| `LanguageSwitcher.tsx` | `FULL_SITE_LOCALES` | header offers FR/EN/DE only | ✓ WIRED | live buttons « Switch to FR / EN / DE » |
| `DietaryBadge.tsx` | `menu.diet.*` | short label + sr-only name | ✓ WIRED | live DOM |
| `verify-live.mjs` | message files + `menu-2026.json` | per-locale expectations | ✓ WIRED | 309 checks x 5 |
| `probe-translation.mjs` | `revalidate.mjs` | signed revalidate after each write | ✓ WIRED | pattern present; SUMMARY transcript |
| local HEAD | VPS container | push + manual SSH deploy | ✓ (behavioural) | `origin/v2-2026` = deployed `86068ab`, live behaviour matches the source; not checkable by pattern or without SSH |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|----------|---------------|--------|--------------------|--------|
| `menu/page.tsx` → `MenuCategory` → `MenuItem` | `categories[].items[].name` (all locale keys) | `MENU_CATEGORIES_QUERY` on production Sanity (244 menuItem, 46 menuCategory) | Yes: 309 `verify-live` checks per locale, 77 items live | ✓ FLOWING |
| `MenuItem` French line | `frenchName` | `item.name.fr` through `secondaryFrenchName` | Yes: renders for any translated fixture and in the 13-03 live probe; inactive live only because Sanity has no it/zh/en/de names yet | ✓ FLOWING (idle until Phase 14 content) |
| `MenuStickyNav` | `categories` (slug / name / section) | `orderedCategories` of the same query | Yes: 20 live tabs | ✓ FLOWING |
| `MenuLanguageSwitcher` | `LOCALES`, labels | `locales.ts`, `menu.languageSwitcherLabel` | Yes | ✓ FLOWING |
| UI labels / notes | `messages` | `request.ts` (fr / en / de as is; it / zh over EN) | Yes: live text per locale, 0 raw keys | ✓ FLOWING |
| Studio fields | `name.it`, `name.zh` | Sanity documents | Reachable (probe), currently empty by design | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Locale rules, FR-fallback and secondary-name rules | `node --test src/lib/menu.test.mjs src/i18n/locales.test.mjs` | 59 tests, 0 fail | ✓ PASS |
| Message contract | `node scripts/i18n/check-messages.mjs` | `MESSAGES OK checks=1627` | ✓ PASS |
| Type safety | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Routing / SEO on the live site | `node scripts/i18n/verify-routing.mjs --base https://umai-ramen.fr` | `ROUTING OK checks=84` | ✓ PASS |
| Menu fidelity and labels, 5 locales | `node scripts/menu-2026/verify-live.mjs --locale <l>` | `VERIFY OK … checks=309` x 5 | ✓ PASS |
| Real `MenuItem` with fixtures (fr, en, de, it, zh) | `tsx` scratch render | rules hold (see SC 4) | ✓ PASS |
| 375 px layout on 5 live pages | Playwright Chromium | no horizontal scroll, pills 44 px, nav present | ✓ PASS |
| Language switch by clicking pills | Playwright Chromium | 5 clicks land on the right `/{l}/menu`, 0 non-GET | ✓ PASS |
| Quick-nav initial state and tap | Playwright Chromium | first tab at scroll 0 in all locales, tap to Desserts works | ✓ PASS |
| Simplified-Chinese rendering | screenshots read (top, items, footer, injected row) | real simplified glyphs, no tofu | ✓ PASS |
| Lighthouse mobile, 3 runs x 5 locales | Lighthouse 13.3.0 CLI | perf medians 92 to 97, a11y 96, BP 100, SEO 100 | ✓ PASS (variance caveat) |
| Production content back to pre-probe state | read-only GROQ | Karaage / Entrées FR-only, 0 drafts, 0 it/zh names | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| I18N-01 | 13-02, 13-03 | Sanity `localeString` / `localeText` carry `it` and `zh`, editable in Studio | ✓ SATISFIED | SC 1 |
| I18N-02 | 13-01, 13-03 | `/it/menu` and `/zh/menu` open; other `/it/*`, `/zh/*` redirect to `/en/*` | ✓ SATISFIED | SC 2, `ROUTING OK checks=84` |
| I18N-03 | 13-01, 13-03 | Menu UI labels translated in FR/EN/DE/IT/ZH | ✓ SATISFIED | SC 3, `MESSAGES OK`, 309 live checks x 5 |
| I18N-04 | 13-02, 13-03 | Switcher at the top of the menu, FR · EN · DE · IT · 中文, stays on the menu | ✓ SATISFIED | SC 3 click-through |
| I18N-05 | 13-01, 13-02, 13-03 | Simplified-Chinese glyphs, right `lang`, hreflang + sitemap with the IT/ZH menu URLs | ✓ SATISFIED | SC 2 and SC 4 |
| UI-01 | 13-02, 13-03 | Translated name primary, FR name legible secondary next to the price | ✓ SATISFIED | SC 4 (unit tests, component render, live probe); live content awaits Phase 14 |
| UI-02 | 13-02, 13-03 | `/fr/menu` FR only, no duplicate name | ✓ SATISFIED | 0 `data-fr-name` live fr; rule returns null for `fr` |
| UI-03 | 13-02, 13-03 | Allergen-on-request and service-included notes translated | ✓ SATISFIED | SC 3 |
| UI-04 | 13-01, 13-02, 13-03 | Comfortable at 375 px (quick-nav, no horizontal scroll) and Lighthouse > 90 | ✓ SATISFIED (see caveat) | 375 px half proven live; Lighthouse medians 92 to 97 in my series; 13-03's fr median 87 not reproduced |

**Cross-reference:** the union of the `requirements:` lists of the three PLAN frontmatters is I18N-01..05 and UI-01..04 (13-01: I18N-02, I18N-03, I18N-05, UI-04; 13-02: I18N-01, I18N-04, I18N-05, UI-01, UI-02, UI-03, UI-04; 13-03: all nine). `REQUIREMENTS.md` defines all nine (lines 28–32, 42–45) and its traceability table maps exactly these nine to Phase 13 (lines 86–90, 94–97). **Orphaned requirements: none.** Bookkeeping note: `REQUIREMENTS.md` still shows UI-04 unticked / « Pending » (set by 13-03 because of the fr miss); this verification supports ticking it.

### Anti-Patterns Found

No TODO / FIXME / placeholder / « coming soon » markers, no `console.log`, no empty handlers and no em-dash in user-facing copy in any Phase 13 file. No blocker. Notes:

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/sanity/lib/client.ts` | 25 | tagged fetches use `revalidate: false` with `useCdn: true`; no Sanity webhook targets umai-ramen.fr | ⚠️ Warning | A Studio edit (it / zh values included) reaches the site only after waiting about 2 min and running `revalidate.mjs`; revalidating earlier re-caches the old menu. Known, documented (`deferred-items.md` #3, STATE); durable fix is `useCdn: false` or a webhook. Not a Phase 13 truth |
| `MenuStickyNav.tsx` (active tab), `MenuItem.tsx` (best-seller badge), cookie banner, footer | n/a | brand green `#77967A` 2.87:1 on ivory, white on green 3.26:1; decorative JP labels about 2.3:1 | ⚠️ Warning | Pre-existing design colours (44 `color-contrast` nodes, accessibility 96); handed to EK as a design decision in the 13-03 hand-off; no Phase 13 element fails |
| `src/components/ui/SectionHeader.tsx` | 21 | the menu page has no `<h1>` (the page title is rendered as `h2` by the shared component, unchanged since Phase 1) | ℹ️ Info | Pre-existing shared component; SEO audit 100, nothing to do for Phase 13 |
| `src/messages/{fr,en,de}.json` | n/a | dead key `menu.eazeeLinkCta` kept (excluded in `DEAD_KEYS`) | ℹ️ Info | Harmless cleanup for later |
| `/it/menu/qr`, `/zh/menu/qr` | n/a | 404 today | ℹ️ Info | Phase 15 page; the proxy already lets `/{it,zh}/menu/*` through |

Phase 12's informational findings (stale « extras et formules » meta description, hard-coded « V » / « SG », eazee-link CTA) are all closed by this phase (SC 3, plan truths 13-01 #5 and 13-02 #4, #5).

### Human Verification (optional, non-blocking)

Status is `passed` and not `human_needed`: every phase truth was verified programmatically or from screenshots that I read, and the phase's own acceptance method for glyphs is a headless-Chromium proxy (CONTEXT: « headless Chromium screenshot on macOS as proxy »). The items below are not gates; they are listed so none is lost.

#### 1. Real-phone glance at `/zh/menu` and one other locale
**Test:** open `https://umai-ramen.fr/zh/menu` and `/it/menu` on an iPhone (Safari) and an Android phone (Chrome).
**Expected:** same layout as in headless Chromium (five pills on one row, no horizontal scroll, simplified glyphs without empty boxes, quick-nav starting on « Entrées »).
**Why human:** real-device font fallback (PingFang SC on iOS, system CJK font on Android) and feel.

#### 2. After Phase 14 publishes translations
**Test:** open `/en/menu`, `/zh/menu` on a phone, and re-run Lighthouse (3 runs per locale).
**Expected:** translated name first, « FR » line under it (once when identical), performance still above 90 despite the extra lines.
**Why human:** the bilingual row with real content cannot exist live before Phase 14; this closes the loop that 13-03's probe proved with two fixtures.

#### 3. Native-speaker skim of the IT and ZH UI labels (optional)
**Test:** read `src/messages/it.json` and `zh.json` (menu, notes, footer, cookie banner, order modal). I read them side by side with English and found no error (« Il nostro menù », « Servizio incluso », « 价格已含服务费 », « 如需过敏原清单，请向店员索取。 » are natural), but they were not written by a native speaker. STATE already lists a native review for Phase 14 as optional.
**Why human:** translation quality.

#### 4. EK decisions already handed over
Brand-green contrast (suggested `#567058`), and optionally a Sanity webhook to `https://umai-ramen.fr/api/revalidate` so Studio edits publish themselves.

### Gaps Summary

No gaps. Phase 13 delivers the goal on the live site: a tourist can open `/en`, `/de`, `/it` or `/zh` `/menu` on a 375 px phone, switch language with the five pills without rescanning and without leaving the menu, and read the menu with its UI, section headings, units, badges and notes in the chosen language; the row component shows the translated name first and the French name on its own legible line (proven with the real component, unit tests and 13-03's live probe, and inactive today only because Phase 14 has not published any translation); IT and ZH exist for the menu only (every other `/it/*` and `/zh/*` redirects to `/en/*`, hreflang and the 38-URL sitemap list the two menu URLs alone, `<html lang="zh-Hans">`, simplified glyphs render).

The one item 13-03 left open, UI-04 Lighthouse performance on `/fr/menu` (median 87), did not reproduce in a fresh independent series (96 / 98 / 97, and 92 to 96 medians on the other four locales, accessibility 96 / best-practices 100 / SEO 100 everywhere). It is recorded as a variance watch item, to be re-measured after Phase 14 content lands, rather than as a gap. The site-wide hardening ideas in 13-03's `## Gaps` (self-hosted subset fonts, lighter hydration) remain worthwhile but are not needed to meet the requirement.

---

_Verified: 2026-11-23T23:14:01Z_
_Verifier: Claude (gsd-verifier)_
