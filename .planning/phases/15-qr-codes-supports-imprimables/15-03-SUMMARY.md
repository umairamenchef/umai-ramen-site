---
phase: 15-qr-codes-supports-imprimables
plan: 03
subsystem: qr
tags: [next-intl, server-component, noindex, x-robots-tag, sanity, usecdn, probe, playwright, verify]

requires:
  - phase: 15-qr-codes-supports-imprimables
    provides: "15-01: src/lib/qr.ts (QR_LOCALES, QR_LABELS, QR_PDFS, qrAssetPath, qrDisplayUrl, qrLabelLang, qrMenuUrl, qrAllAssetPaths) and the 10 code files; 15-02: the A4 / A6 PDFs, QR_TENT_BLEED_MM and QR_TENT_VARIANTS (1 mm / 2 mm Exaprint variants)"
  - phase: 13-fondations-multilingues-page-menu-touriste
    provides: "menu-path routing for it/zh (isMenuPath('/menu/qr')), the EN merge under it/zh messages, check-messages.mjs, verify-routing.mjs, the menu page prerender rule, probe-translation.mjs helpers, deferred item 3 (stale API CDN)"
provides:
  - "/{fr,en,de,it,zh}/menu/qr: prerendered server page, noindex/nofollow, no hreflang, out of the sitemap; 5 labelled codes with SVG + PNG downloads, the A4, the A6 3 mm card and its 1 mm / 2 mm Exaprint variants (14 downloads)"
  - "X-Robots-Tag: noindex, nofollow on every /qr/* file (next.config.ts headers)"
  - "qrPage / meta.qrPage strings in fr/en/de (14 + 2 keys) and check-messages.mjs rule (h); rule (d) now formats messages with placeholders"
  - "src/sanity/lib/client.ts useCdn: false (Phase 13 deferred item 3, not live until the 15-04 deploy)"
  - "scripts/i18n/probe-freshness.mjs: reversible live probe of write -> immediate revalidation -> visible (Plan 04 runs it live)"
  - "scripts/qr/verify-site.mjs: HTTP contract of the page and of the 14 files on any base URL (QR SITE OK)"
affects: [15-04 deploy and live proof, future Studio edits (publish without the 2-minute CDN wait once deployed)]

tech-stack:
  added: []
  patterns:
    - "Tool pages: metadata robots { index: false, follow: false }, no alternates, never in sitemap.ts, X-Robots-Tag on their static files"
    - "Download attribute derived from the public path (fileName()), so the page holds no literal URL or file name"
    - "Message contract formats every ICU message with a sample value per argument (AST walk), not only { count }"
    - "Sanity tagged fetches read the origin API: Next's tagged data cache is the only cache, revalidateTag right after a write is fresh"

key-files:
  created:
    - src/app/(site)/[locale]/menu/qr/page.tsx
    - scripts/qr/verify-site.mjs
    - scripts/i18n/probe-freshness.mjs
  modified:
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json
    - scripts/i18n/check-messages.mjs
    - src/sanity/lib/client.ts
    - next.config.ts

key-decisions:
  - "Phase 15-03: /menu/qr lists the 3 mm A6 card plus the 1 mm / 2 mm Exaprint variants from QR_TENT_VARIANTS (orchestrator addition): 14 downloads; two message keys (tentVariantsHint with {defaultMm} = QR_TENT_BLEED_MM, tentVariant with {mm}) keep the bleed values single-sourced"
  - "Phase 15-03: the site's Sanity client reads the origin API (useCdn: false). All 10 site fetches are tagged and cached by Next until revalidateTag, so origin requests happen only at build, on a cold cache or after a revalidation (negligible against the free-tier quota)"
  - "Phase 15-03: check-messages.mjs rule (d) formats each message with a sample value for every ICU argument (it threw MissingValueError on {url} / {label}); rule (h) guards the fr/en/de-only qrPage namespace (presence, same placeholders as fr, FR leak)"

patterns-established:
  - "verify-site.mjs CLI: one FAIL line per failure (last run), QR SITE OK / FAILED line, --retries N --interval S for a server still starting, exit 2 on usage errors"

requirements-completed: []  # QR-04 capability; ticked by Plan 04 after the live proof

duration: 18min
completed: 2026-11-24
---

# Phase 15 Plan 03: /menu/qr download page, Sanity origin API and freshness probe Summary

**A prerendered, noindex `/menu/qr` page in five locales (5 labelled codes with SVG/PNG downloads, the A4 sheet, the 3 mm A6 card and its two Exaprint bleed variants), `X-Robots-Tag: noindex` on every `/qr/*` file, the Sanity client switched to the origin API, a reversible live freshness probe for Plan 04, and a full local production gate (`QR SITE OK checks=248`, `ROUTING OK checks=84`, `VERIFY OK` ×5, `QR MOBILE OK`).**

## Performance

- **Duration:** 18 min
- **Started:** 2026-11-24T00:07:24Z
- **Completed:** 2026-11-24T00:25:30Z
- **Tasks:** 3
- **Files modified:** 9 (3 created, 6 modified), exactly the plan's `files_modified`

## Accomplishments

- QR-04 capability: EK or Loan can open `/fr/menu/qr` (or any locale) on a phone, see the 5 codes with their labels and URLs, and download each code as SVG or PNG plus the A4 and the A6 PDFs, including the 1 mm and 2 mm Exaprint variants.
- The page stays out of search engines: `noindex, nofollow` meta, no hreflang, not in the sitemap (still 38 URLs), not linked from the menu, and every `/qr/*` file answers `X-Robots-Tag: noindex, nofollow`.
- The Sanity freshness fix (Phase 13 deferred item 3) ships with this phase's deploy, and `probe-freshness.mjs` is ready to prove it live.

## Page anatomy (selectors for Plan 04)

`src/app/(site)/[locale]/menu/qr/page.tsx`, a server component with no `'use client'`. Everything comes from `@/lib/qr`. `grep -c "umai-ramen.fr\|/qr/umai"` on the file gives 0.

- `generateStaticParams`: copied from the menu page, so all five locales are prerendered (`.next/server/app/{fr,en,de,it,zh}/menu/qr.html`; it/zh come from the `fr` branch).
- `generateMetadata`: `meta.qrPage` title + description and `robots: { index: false, follow: false }`. There are no `alternates` and no `openGraph`.
- The wrapper is `<div lang={it/zh ? 'en' : undefined}>`, because it/zh get the English strings through the Phase 13 merge. Inside it:
  - one `<h1>` (`qrPage.title`), the dashed divider and the intro;
  - `section[aria-labelledby=qr-codes-heading]`, then `ul > li[data-qr-card=<locale>]` ×5 in the order fr, en, de, it, zh. Each card holds:
    - `<h3 lang=qrLabelLang>` with the label;
    - `<img src=/qr/umai-menu-<l>.svg alt="QR code vers umai-ramen.fr/<l>/menu">` (localized alt);
    - the URL as a link to `qrMenuUrl(l)`;
    - two `a[download]` links, SVG and PNG, with `aria-label` « Télécharger en SVG : <label> »;
  - `section[aria-labelledby=qr-print-heading]` with two cards:
    - `li[data-qr-pdf=a4]`: a primary button and the hint;
    - `li[data-qr-pdf=tent]`: a primary button for the 3 mm card, the hint, the variants hint (« Ce fichier a un fond perdu de 3 mm… ») and one `a[download][data-qr-pdf-variant=<1|2>]` per `QR_TENT_VARIANTS` entry (« Fond perdu 1 mm (PDF) », « Fond perdu 2 mm (PDF) »).
- The `download` file name is the last segment of the public path (`fileName()`), so there are no literals. In total the page has 14 `a[download]`: 10 code files, A4, A6 card, 2 variants.
- On /it and /zh the chrome links to non-menu pages are `<a hrefLang="en">` (11 per page, Phase 13 behaviour). There are 0 `<link rel="alternate">` on all five pages.

## Messages

`qrPage` (after `footer`) and `meta.qrPage` (after `meta.cgv`) in fr/en/de. it.json and zh.json are unchanged (`git diff --quiet` OK). The 12 planned keys are `title, intro, codesHeading, qrAlt {url}, downloadSvgLabel {label}, downloadPngLabel {label}, formatsHint, printHeading, a4, a4Hint, tent, tentHint`. Two keys were added for the variants:

| key | fr | en | de |
|---|---|---|---|
| qrPage.tentVariantsHint | Ce fichier a un fond perdu de {defaultMm} mm. Si la commande Exaprint demande un autre fond perdu, prenez la même carte dans la bonne version : | This file has a {defaultMm} mm bleed. If the Exaprint order asks for a different bleed, take the same card in the matching version: | Diese Datei hat {defaultMm} mm Beschnittzugabe. Verlangt die Exaprint-Bestellung eine andere Beschnittzugabe, gibt es hier dieselbe Karte in der passenden Version: |
| qrPage.tentVariant | Fond perdu {mm} mm (PDF) | {mm} mm bleed (PDF) | {mm} mm Beschnittzugabe (PDF) |

The files round-trip byte-identically through `JSON.stringify(…, null, 2)`, so the insertion kept their formatting. They contain 0 em-dashes.

`check-messages.mjs` result: `MESSAGES OK checks=1818` (was 1627).
- **Negative control (plan):** `qrPage.tent` deleted from de.json gives `[h] de: missing or empty qrPage.tent` / `MESSAGES FAILED failures=1` (exit 1). After restoring the file, MESSAGES OK again.
- **Extra control:** an en file with `qrAlt` = `{link}`, the French title and a broken ICU `tentVariant` gives:
  - `[d] en qrPage.tentVariant: invalid ICU message (EXPECT_ARGUMENT_CLOSING_BRACE)`;
  - `[h] en qrPage.qrAlt: placeholders {link} differ from fr {url}`;
  - `[h] en qrPage.tentVariant: placeholders {bad,mm} differ from fr {mm}`;
  - `[h] en qrPage.title: identical to the French value (FR leak)`.

  The file was restored afterwards.

## Sanity origin API (`useCdn: false`)

`src/sanity/lib/client.ts`: `useCdn: true` became `useCdn: false`, with the planned comment. Nothing else in the file changed (`sanityFetch`, cache options, exports). `src/sanity/lib/image.ts` only builds image URLs (always cdn.sanity.io), so it is unaffected.

**Quota:** all 10 site fetches pass tags (layout siteSettings; home; menu ×3; commander, reservation, infos (siteSettings); galerie; notre-histoire). `sanityFetch` turns tags into `revalidate: false` + `force-cache`, so Next's data cache is the only cache. The origin API is queried:
- at build (one fetch per query);
- on a cold cache (new container);
- right after a `revalidateTag`.

The 60 s page ISR reuses the cached data. That is a few hundred requests a month at most, far below the free tier. Not live yet: Plan 04 deploys it.

## Freshness probe (`scripts/i18n/probe-freshness.mjs`)

**Target:** `m26-item-karaage`, field `name.it`, shown on `/it/menu`. The helpers are copied from `probe-translation.mjs`, which is not imported and not modified.

**Steps:**
1. env check (exit 2);
2. origin client (token, raw) and API CDN client (no token: the pre-Phase-15 site configuration);
3. read the document, refuse a leftover `PROBE-`, warn on drafts;
4. BASELINE GET of `/it/menu`: 200 and no `PROBE-`;
5. backup;
6. `--dry-run` stops here;
7. prime the API CDN with the site's exact `MENU_CATEGORIES_QUERY`;
8. `ifRevisionId(doc._rev).set({'name.it': '<before> PROBE-<stamp>'})`;
9. `revalidate.mjs … '--delay', '0'`;
10. CHECK-ON: 3 GETs, 10 s apart, no re-revalidation;
11. CONTROL through the API CDN (`stale=<bool>`);
12. `finally`: restore with `ifRevisionId(<written rev>)`, either `set` of the previous value or `unset`;
13. immediate revalidation, then CHECK-OFF on the whole HTML (3 × 10 s). If that fails: CDN wait (max 180 s), revalidation, 10 × 30 s with re-revalidation after attempts 3 and 6;
14. FINAL READ against the backup.

**Exit codes and output:** 0, 1, 2 or 4 (`FRESHNESS REVERT FAILED` prints the manual Studio restore). The last line is `FRESHNESS OK check-on-attempt=<a> control-cdn-stale=<bool>`.

Extra safety: if a write gets no response, the probe re-reads the document to detect a committed write and restore it, and it checks `name.fr` and the type of `name.it` before writing.

Read-only dry run (backup written to the scratch folder, nothing created under `.planning/`):

```
Target: Sanity c7twe801/production, page https://umai-ramen.fr/it/menu, field m26-item-karaage name.it
BEFORE name.it = "Karaage" (rev lWwPwzVj4paFn3vV2NnUyI)
BASELINE OK /it/menu 200, no PROBE- (x-nextjs-cache STALE)
BACKUP …/scratchpad/umai-15/probe-dry/freshness-backup-20261124-001628.json
PLAN set name.it = "Karaage PROBE-20261124-001628"
PLAN restore name.it = "Karaage"
FRESHNESS DRY-RUN done (nothing written)
```

`--help` exits 2 with the usage line. Without env it prints the 4 missing names (exit 2), and `--base https://umai-ramen.fr/it` exits 2. The backup and the script contain none of the `.env.local` secrets (0 hits for SANITY_TOKEN and SANITY_WEBHOOK_SECRET).

## Local production gate (purged build of the code Plan 04 deploys)

```
npx tsc --noEmit                                       exit 0
node --test src/lib/qr.test.mjs src/lib/menu.test.mjs src/i18n/locales.test.mjs   72/72 pass
MESSAGES OK checks=1818
QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15 variants=2 variantCodes=20 checks=337
rm -rf .next/cache/fetch-cache && npx next build       success, first try (61 s, no font flake)
  ● /[locale]/menu/qr -> /fr/menu/qr, /it/menu/qr, /zh/menu/qr [+2 more paths]
  .next/server/app/{fr,en,de,it,zh}/menu/qr.html: 70,514 / 68,647 / 70,535 / 68,978 / 68,802 B, each 1 x content="noindex, nofollow"
VERIFY OK target=.next/server/app/fr/menu.html locale=fr expect=m26 checks=309   (same for en, de, it, zh)
QR SITE OK base=http://localhost:3100 checks=248      (run 1 = ECONNREFUSED while next start booted, run 2 OK)
ROUTING OK base=http://localhost:3100 checks=84
QR MOBILE OK                                          (375 px, all 5 locales)
```

- `fr/menu.html` is 238,317 B (13-02 measured 234,945 B). This plan's share is the `qrPage` + `meta.qrPage` namespaces passed to the client provider, 1,236 B escaped in the RSC payload of every fr/en/de page. The remaining ~2.1 KB comes from Phase 14's translated names in the quick-nav props.
- `next start` headers: `/qr/umai-qr-chevalet-a6-fp1mm.pdf` answers `200`, `application/pdf`, `X-Robots-Tag: noindex, nofollow`; `.svg` answers `image/svg+xml` and `.png` answers `image/png`, both with the same X-Robots-Tag. `/menu/qr` with `accept-language: fr-FR` answers `307` to `/fr/menu/qr`. The header rule is compiled into `.next/routes-manifest.json` and into the standalone copy the Docker image runs, so the X-Robots-Tag block stays.
- `verify-site.mjs` checks per locale:
  - 200, `<html lang>`, one robots meta, 0 hreflang alternates;
  - the `<h1>`, and the `lang="en"` wrapper only on it/zh;
  - the card order, each label in its `lang` element, each display URL, each `<img>` with its localized alt;
  - exactly the 14 download hrefs.

  It also checks the `/menu/qr` 307, then for each of the 14 files: 200, content type, X-Robots-Tag and sha256 equal to `public/`. Finally, the sitemap (38 URLs, no `/menu/qr`) and `/fr/menu` (no link to, nor alternate / canonical for, a `/menu/qr` URL).
- Live negative control (production still runs the Phase 13/14 code): `QR SITE FAILED base=https://umai-ramen.fr failures=19` (5 pages and 14 files answer 404; the 307, the sitemap and the menu checks already pass).
- Mobile numbers (all 5 locales): `scrollWidth` 375 = `clientWidth`, 5 images loaded, 14 targets. SVG/PNG are 98-99 × 46 px, A4 277 × 44, A6 card 277 × 64 (two lines), variants 277 × 46 (de 277 × 66). Robots `noindex, nofollow`.

## Screenshots (375 px, read)

- **`qr-fr-375.png`** (750 × 8698):
  - « QR CODES DU MENU » in DM Serif, the dashed divider and the intro;
  - the 5 cards stacked in one column, each with a sharp code, the underlined `umai-ramen.fr/<l>/menu` and the SVG / PNG outline buttons side by side;
  - the « 中文菜单 » card shows real CJK glyphs (no tofu);
  - the formats hint, then « SUPPORTS À IMPRIMER » with the green « FEUILLE A4 (PDF) » button and its hint, and the green « CHEVALET A6 RECTO VERSO (PDF) » button (two lines) with its hint;
  - « Ce fichier a un fond perdu de 3 mm. Si la commande Exaprint demande un autre fond perdu, prenez la même carte dans la bonne version : », then two full-width outline buttons « FOND PERDU 1 MM (PDF) » and « FOND PERDU 2 MM (PDF) ».

  Nothing is cut or overflowing.
- **`qr-zh-375.png`** (750 × 8480): « MENU QR CODES », with the intro and all page strings in English (`lang="en"`). The site chrome is Chinese: the cookie banner reads « 本网站使用 Cookie 进行访问量统计。 Cookie 政策 / 拒绝 / 接受 ». The cards and labels are the same as on fr. « PRINT FILES » shows « A4 SHEET (PDF) », « A6 TABLE CARD, BOTH SIDES (PDF) », « This file has a 3 mm bleed… » and « 1 MM BLEED (PDF) » / « 2 MM BLEED (PDF) ».
- In both full-page shots the fixed cookie banner overlaps the first card. That is a full-page screenshot artifact: on a phone the banner sits at the bottom of the viewport until it is answered.

## Task Commits

1. **Task 1: /menu/qr page strings (fr/en/de) and message contract** - `46d1145` (feat)
2. **Task 2: Sanity origin API for tagged fetches + freshness probe** - `c23653a` (fix)
3. **Task 3: /menu/qr download page, X-Robots-Tag on /qr/*, site verifier** - `76c2d99` (feat)

**Last code commit of this plan (Plan 04 compares against it): `76c2d99f1f4ac4606851aff9633cbc731f377811`.**

`git diff --name-only 616daba..76c2d99` lists exactly the 9 `files_modified`. These files are unchanged: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/proxy.ts`, `src/i18n/*`, `src/lib/seo.ts`, the menu page, `src/messages/it.json` / `zh.json`, `scripts/i18n/probe-translation.mjs`. No push, no deploy, no Sanity write.

## Files Created/Modified

- `src/app/(site)/[locale]/menu/qr/page.tsx`: the download page (server component, no client JS of its own)
- `next.config.ts`: `headers()` adds X-Robots-Tag on `/qr/:path*`
- `scripts/qr/verify-site.mjs`: page / files / sitemap / menu contract (`QR SITE OK`)
- `src/messages/{fr,en,de}.json`: `qrPage` (14 keys), `meta.qrPage` (2 keys)
- `scripts/i18n/check-messages.mjs`: rule (h), and rule (d) with sample values
- `src/sanity/lib/client.ts`: `useCdn: false`
- `scripts/i18n/probe-freshness.mjs`: the reversible freshness probe

## Decisions Made

See `key-decisions` above. The bleed values on the page come from `QR_TENT_BLEED_MM` / `QR_TENT_VARIANTS` through ICU placeholders. The Exaprint product rule (1 mm flyers, 2 mm other products) stays in the hand-off rather than in the UI, since product names on Exaprint's order page can vary.

## Deviations from Plan

### Orchestrator addition (in scope by instruction)

**1. The two Exaprint A6 variants are listed on the page**
- **Asked by:** the orchestrator (15-02 note): list the A4, the 3 mm A6 card and `umai-qr-chevalet-a6-fp1mm.pdf` / `-fp2mm.pdf`, imported from `@/lib/qr`, and count them in `verify-site.mjs` and in 15-04's live `/qr/*` checks.
- **Done:**
  - **Messages:** two keys `qrPage.tentVariantsHint` (`{defaultMm}`) and `qrPage.tentVariant` (`{mm}`) in fr/en/de. `qrPage` therefore has 14 keys, and the Task 1 verify was run with `length !== 14` instead of 12 (`QRPAGE MESSAGES OK`). Rule (h) requires 16 keys (14 + 2 meta) instead of 14, and its FR-leak list has the 2 new keys.
  - **Download count:** `verify-site.mjs` expects 14 downloads (`qrAllAssetPaths()` + `QR_TENT_VARIANTS` paths) and checks the 14 files. The scratch mobile check expects 14 instead of 12.
- **Files:** the planned ones only.

### Auto-fixed Issues

**2. [Rule 3 - Blocking] check-messages.mjs rule (d) rejected every message with a placeholder**
- **Found during:** Task 1 (first run after adding the strings: `MESSAGES FAILED failures=15`).
- **Issue:** (d) formatted every message with `{ count: 2 }` only. intl-messageformat throws `MissingValueError` for any other argument, so the plan's own `qrAlt {url}` and `download*Label {label}` (and the variant keys) failed in fr, en and de.
- **Fix:** `sampleValues(ast)` walks the parsed message (`getAst()`) and gives every argument a sample value: plain / select get 'x', number / plural get 2, date / time get the epoch, tags get an identity function. `count` stays 2. Existing messages behave exactly as before.
- **Verification:** `MESSAGES OK checks=1818`. A broken ICU message is still reported (`EXPECT_ARGUMENT_CLOSING_BRACE`, see the extra control).
- **Committed in:** `46d1145`

**3. [Rule 2 - Single source] `download` file names derived from the path**
- **Issue:** the plan wrote two literal `download="umai-qr-…pdf"` names, plus `umai-menu-${l}.svg` template literals. These would go stale if `src/lib/qr.ts` renamed a file.
- **Fix:** `fileName(path)` (the last path segment) for all 14 links. The page holds no URL, file name or label literal.
- **Committed in:** `76c2d99`

**4. [Rule 2 - Safety] Probe hardening beyond the spec**
- After a write that gets no response, the probe re-reads the document so a committed marker is still restored.
- It refuses to write when `name.fr` is missing or `name.it` is not a string.
- It prints `BEFORE` / `BASELINE OK` lines and shows repo-relative backup paths.
- The revalidation helper always passes `'--delay', '0'` (no delay parameter).
- **Committed in:** `c23653a`

**5. [Rule 2 - Strictness] verify-site.mjs checks beyond the spec**
- **Images:** each `<img>` alt is the localized `qrAlt`.
- **Downloads:** the set of hrefs must be exactly the 14 expected (no extra link).
- **Menu page:** `/fr/menu` must not link to any `/menu/qr` URL, which is broader than `href="/fr/menu/qr"`.
- **Committed in:** `76c2d99`

### Process

**6. Scratch folder.** Logs, screenshots, the dry-run backup and `qr-mobile-check.mjs` are in the session scratchpad. The full path is `/private/tmp/claude-501/-Users-ekitcho-Desktop-dev-claude-lab-umai2026/138dd2fa-f644-4f9d-8363-b9a38aa26c48/scratchpad/umai-15/`, used instead of `${TMPDIR:-/tmp}/umai-15/` because the environment requires the scratchpad for temporary files. Plan 04 uses the same folder.

---

**Total deviations:** 1 orchestrator addition, 4 auto-fixed (Rule 3: 1, Rule 2: 3), 1 process note. **Impact on plan:** all planned outputs, selectors and success lines hold. The variants add downloads and checks without changing the planned ones.

## Issues Encountered

- Node prints the known `[MODULE_TYPELESS_PACKAGE_JSON]` warning on stderr when `verify-site.mjs` imports `src/lib/qr.ts` (same as 15-01/15-02). stdout is unaffected.
- `next start` warns that it « does not work with output: standalone », and also about the workspace root (a parent `package-lock.json`). It served everything correctly, as in 13-03. Production runs the standalone `server.js`, and its `routes-manifest.json` carries the X-Robots-Tag rule.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 04 deploys `76c2d99` (or later Phase 15 docs commits).** It then runs these live:
  - `node scripts/qr/verify-site.mjs --base https://umai-ramen.fr --retries 3 --interval 20`;
  - `PW_DIR=/Users/ekitcho/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright node <scratch>/umai-15/qr-mobile-check.mjs https://umai-ramen.fr <scratch>/umai-15/live`;
  - `node --env-file=.env.local scripts/i18n/probe-freshness.mjs --backup-dir .planning/phases/15-qr-codes-supports-imprimables/backup` (it will restore `name.it = "Karaage"`).
- QR-01..04 are NOT ticked: Plan 04 ticks them after the live proof.

## Self-Check: PASSED

- FOUND: `src/app/(site)/[locale]/menu/qr/page.tsx`, `scripts/qr/verify-site.mjs`, `scripts/i18n/probe-freshness.mjs`, and the 6 modified files (all tracked, `git status --porcelain -- src scripts public next.config.ts` empty)
- FOUND commits: `46d1145`, `c23653a`, `76c2d99`
