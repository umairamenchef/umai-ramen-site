# Phase 13: deferred items

Out-of-scope discoveries logged during execution. Not fixed (scope boundary: only issues caused by a plan's own changes are fixed in that plan).

## 1. Quick-nav highlights and scrolls to an arbitrary category on load (pre-existing, found in 13-02)

- **Where:** `src/components/menu/MenuStickyNav.tsx`, the `IntersectionObserver` block and the auto-centering effect. Plan 13-02 deliberately left both unchanged.
- **Symptom:** on a fresh load of `/{locale}/menu` at scroll position 0, the horizontal category bar is already scrolled to a random later tab (for example « Desserts », « Bières », « Vins », « Whiskies & Rhums ») and that tab is underlined, so the first tabs (« Entrées », « Tantan Umaï »…) are out of view when the tourist arrives.
- **Not caused by Plan 13-02:** reproduced on the live site, which still runs the Phase 12 code, with headless Chrome at 375 px, 3 fresh loads of `https://umai-ramen.fr/fr/menu` (read-only GETs): active tab « Desserts » (index 7), « Vins » (index 18), « Bières » (index 8), page `scrollY` 0 each time. The same spread on the 13-02 build: « Whiskies & Rhums », « Bières », « Bières ».
- **Likely cause (read from the code; the callback arrival order itself was not instrumented):** at scroll 0 no section crosses the observer band (`rootMargin: '-20% 0px -60% 0px'`), so each category observer fires its initial callback with `intersectionRatio` 0. The callback does not look at `isIntersecting`, adds the 0 to `sectionMap`, and picks the best entry with `reduce((a, b) => (a[1] > b[1] ? a : b))`. On a tie that returns the later entry, and the order in which the initial callbacks arrive is not guaranteed, so the « winner » is arbitrary. `setActiveSlug` then triggers the smooth `scrollBy` that centres that tab.
- **Suggested fix (about 6 lines, same file):** ignore entries that are not intersecting (`if (!entry.isIntersecting) sectionMap.delete(slug); else sectionMap.set(slug, entry.intersectionRatio);`), only call `setActiveSlug` when the map is non-empty, and keep the first category active otherwise. Verify with the `nav-probe` approach: fresh load at scroll 0 must leave « Entrées » active and `nav.scrollLeft` at 0, on `/fr|en|de|it|zh/menu`.
- **Suggested home:** Plan 13-03 (Lighthouse / mobile pass on the tourist page) or a `/gsd:quick` task. It affects the first screen a tourist sees after scanning a QR code.

## 2. Dietary pill text is 10 px in Chinese (design question, found in 13-02)

- **Where:** `src/components/menu/DietaryBadge.tsx` (`text-[10px]`, unchanged from Phase 12 on purpose).
- **Observation:** « 素 » and « 无麸质 » are legible at 3x zoom but small on a real phone at 10 CSS px; CJK glyphs normally want 12 px or more. The full name is still available to screen readers and as a tooltip.
- **Option:** a `:lang(zh-Hans)` size bump for the pill (for example 12 px) once EK has seen the page on a phone. Left as is because Plan 13-02 fixes pill size and colours.
