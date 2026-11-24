# Phase 13: deferred items

Out-of-scope discoveries logged during execution. Not fixed (scope boundary: only issues caused by a plan's own changes are fixed in that plan).

## 1. Quick-nav highlights and scrolls to an arbitrary category on load (pre-existing, found in 13-02)

> **RESOLVED in 13-03** (commit `8f569fc`, live since deploy `86068ab`): non-intersecting entries leave the ratio map, an empty band keeps the first tab above the first section (the current tab in gaps / below the last section), no nav auto-scroll on the initial render. 375 px probe live: « Entrées » active and `nav.scrollLeft` 0 on fresh loads of all 5 locales, wheel-scroll to Desserts activates « Desserts ».

- **Where:** `src/components/menu/MenuStickyNav.tsx`, the `IntersectionObserver` block and the auto-centering effect. Plan 13-02 deliberately left both unchanged.
- **Symptom:** on a fresh load of `/{locale}/menu` at scroll position 0, the horizontal category bar is already scrolled to a random later tab (for example « Desserts », « Bières », « Vins », « Whiskies & Rhums ») and that tab is underlined, so the first tabs (« Entrées », « Tantan Umaï »…) are out of view when the tourist arrives.
- **Not caused by Plan 13-02:** reproduced on the live site, which still runs the Phase 12 code, with headless Chrome at 375 px, 3 fresh loads of `https://umai-ramen.fr/fr/menu` (read-only GETs): active tab « Desserts » (index 7), « Vins » (index 18), « Bières » (index 8), page `scrollY` 0 each time. The same spread on the 13-02 build: « Whiskies & Rhums », « Bières », « Bières ».
- **Likely cause (read from the code; the callback arrival order itself was not instrumented):** at scroll 0 no section crosses the observer band (`rootMargin: '-20% 0px -60% 0px'`), so each category observer fires its initial callback with `intersectionRatio` 0. The callback does not look at `isIntersecting`, adds the 0 to `sectionMap`, and picks the best entry with `reduce((a, b) => (a[1] > b[1] ? a : b))`. On a tie that returns the later entry, and the order in which the initial callbacks arrive is not guaranteed, so the « winner » is arbitrary. `setActiveSlug` then triggers the smooth `scrollBy` that centres that tab.
- **Suggested fix (about 6 lines, same file):** ignore entries that are not intersecting (`if (!entry.isIntersecting) sectionMap.delete(slug); else sectionMap.set(slug, entry.intersectionRatio);`), only call `setActiveSlug` when the map is non-empty, and keep the first category active otherwise. Verify with the `nav-probe` approach: fresh load at scroll 0 must leave « Entrées » active and `nav.scrollLeft` at 0, on `/fr|en|de|it|zh/menu`.
- **Suggested home:** Plan 13-03 (Lighthouse / mobile pass on the tourist page) or a `/gsd:quick` task. It affects the first screen a tourist sees after scanning a QR code.

## 2. Dietary pill text is 10 px in Chinese (design question, found in 13-02)

> **RESOLVED in 13-03** (commit `486d0b2`, live): `[&:lang(zh-Hans)]:text-[12px]` on `DietaryBadge`; computed 12 px on /zh/menu, 10 px unchanged on fr/en/de/it.

- **Where:** `src/components/menu/DietaryBadge.tsx` (`text-[10px]`, unchanged from Phase 12 on purpose).
- **Observation:** « 素 » and « 无麸质 » are legible at 3x zoom but small on a real phone at 10 CSS px; CJK glyphs normally want 12 px or more. The full name is still available to screen readers and as a tooltip.
- **Option:** a `:lang(zh-Hans)` size bump for the pill (for example 12 px) once EK has seen the page on a phone. Left as is because Plan 13-02 fixes pill size and colours.

## 3. Revalidating right after a Sanity write can re-cache the OLD menu for good (found in 13-03)

> **RESOLVED in 15-03 / 15-04** (commit `c23653a`, live since deploy `475c880`): `useCdn: false` in `src/sanity/lib/client.ts`; live proof `FRESHNESS OK check-on-attempt=1 control-cdn-stale=true` (`scripts/i18n/probe-freshness.mjs`, 2026-11-24: the marker written on Karaage `name.it` showed on /it/menu on the first request after an immediate revalidation, `x-nextjs-cache MISS`, while the API CDN still served the old value 7 s after the write; then restored, final read identical to the backup). Publishing no longer needs the 2-minute wait: write, then `revalidate.mjs`.

- **Where:** `src/sanity/lib/client.ts` (`useCdn: true`) together with `sanityFetch` (tagged fetches use `revalidate: false`), and every publish procedure that calls `scripts/menu-2026/revalidate.mjs` (Phase 14 publish, Studio edits, a future Sanity webhook).
- **Symptom (live, 2026-11-23):** the first probe run wrote it/zh names, revalidated 34 s later (`revalidate.mjs --delay 30`), and the pages never showed the new values in 10 checks over 4.5 min. After `revalidateTag` the next request is a blocking `MISS` render that re-fetches the menu through the Sanity API CDN. That fetch still got the pre-write menu, and the tagged data cache then keeps it until the next `revalidateTag` (every 60 s page regeneration reuses it).
- **Measured:** the site's exact menu query through `apicdn.sanity.io` reflected the write after **111 s** and the revert after **86 s** (CDN headers: `s-maxage=60, stale-while-revalidate=15`). Phase 12-03 never hit this because it revalidated more than 4 minutes after its write.
- **Workaround in place:** `scripts/i18n/probe-translation.mjs` polls the site's menu query through the CDN until it shows the expected state, then revalidates (and re-sends the revalidation if a check stalls). By hand: wait about 2 minutes after a write (or until `verify-live.mjs` agrees), then run `revalidate.mjs`; if a page still shows old content afterwards, run `revalidate.mjs` again.
- **Durable fix (suggested, outside Phase 13 scope):** fetch the tagged queries with `useCdn: false` (Sanity's recommendation for tag-based revalidation). The tagged results are cached by Next until revalidation, so the origin API is only hit on revalidation (negligible quota). Without it, a Sanity webhook to `/api/revalidate` (EK todo) would race the CDN the same way, because it fires within seconds of the publish.
- **Phase 14 impact:** the production publish (`sync-menu.mjs --apply`, then `revalidate.mjs`) must wait for the CDN (about 2 min) before revalidating, or re-run `revalidate.mjs` until `verify-live.mjs` passes.
