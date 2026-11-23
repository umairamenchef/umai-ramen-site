# Phase 13: Fondations multilingues & page menu touriste - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning (after Phase 12 lands — shared menu components)
**Mode:** Autonomous (EK, 2026-11-23: « Avance en autonome jusqu'à livraison déployé ») — decisions taken by Claude within EK's locks (IT/ZH menu-only, simplified Chinese, mobile web page).

<domain>
## Phase Boundary

Add Italian (`it`) and simplified Chinese (`zh`) as **menu-only** locales, a prominent language switcher on the menu page, and the bilingual tourist rendering (translated name primary + French name secondary) on `/{en,de,it,zh}/menu`. FR stays untouched; EN/DE remain full-site locales. Content translations themselves are Phase 14 — this phase must work (with FR fallback) before they exist, and must make every menu UI label translatable in 5 languages. The QR page `/menu/qr` is Phase 15 (but the routing rule must allow `/{it,zh}/menu/*`).

</domain>

<decisions>
## Implementation Decisions

### Locales & routing
- `routing.locales = ['fr', 'en', 'de', 'it', 'zh']` (URL code `zh`; default `fr`; `localePrefix: 'always'` unchanged). Keep a single exported constant for "menu-only locales" (`['it', 'zh']`) and "full-site locales" (`['fr','en','de']`) and use it everywhere (proxy, sitemap, alternates, switchers).
- **Proxy rule** (`src/proxy.ts`, before handing to next-intl): any request whose first segment is `it` or `zh` and whose remaining path is NOT `/menu` or `/menu/*` → **307/308 redirect to the same path under `/en`** (`/it` → `/en`, `/zh/infos` → `/en/infos`, query preserved). Also make sure next-intl's locale *detection* on `/` (Accept-Language / NEXT_LOCALE cookie = it/zh) never lands a visitor on a non-menu IT/ZH page: final landing must be `/en` (cookie/negotiation fix or a post-intl redirect rewrite — planner's choice, test both header and cookie paths).
- Avoid statically generating non-menu `it`/`zh` pages if a clean mechanism exists; if not, it is acceptable that they exist but are unreachable (proxy redirect) — document the choice.
- `<html lang>`: `zh` → `zh-Hans`; others = locale code. OG locale: `fr_FR`, `en_US`, `de_DE`, `it_IT`, `zh_CN`.
- **SEO:** `buildAlternates(locale, path)` includes `it`/`zh` (hreflang `it`, `zh-Hans`) **only for `/menu`**; `x-default` stays `/fr`. `sitemap.ts` lists `/it/menu` and `/zh/menu` (and no other IT/ZH URL) with matching alternates. `/menu/qr` (Phase 15) will be noindex and excluded.

### Messages (UI strings)
- New `src/messages/it.json` and `src/messages/zh.json` containing: `menu.*` (all menu labels incl. new Phase 12 keys: section headings « Plats/Boissons », units, badges, « Prix sur demande », page notes « allergènes sur demande », « service compris », « fait maison… », sub-labels), `meta.menu`, `nav`, `common`, `consent` (cookie banner — legal text must be understood), `orderModal`, and footer strings.
- `src/i18n/request.ts`: for `it`/`zh`, **deep-merge EN messages as the base** with the IT/ZH file on top, so any key not translated (site chrome) falls back to English instead of erroring. FR/EN/DE behaviour unchanged.
- EN/DE `menu.*` keys added in Phase 12 get proper EN/DE strings here (FR-only keys must not leak).

### Language switchers
- **Menu-page switcher (I18N-04):** a prominent pill bar at the top of the menu page (under the page title, above the category nav): `FR · EN · DE · IT · 中文` (native labels; current one highlighted; ≥44 px tap targets; `hrefLang`/`lang` attributes on links; real `<a>` links to `/{locale}/menu` preserving the `#category` hash if cheap). Must not create horizontal scroll at 375 px (wrap or fit).
- **Header `LanguageSwitcher`:** shows only FR/EN/DE on non-menu pages; on the menu route shows all five (or keep FR/EN/DE + rely on the menu-page switcher — planner's choice, but never offer IT/ZH links that redirect away from the current page). Labels map gets `it: 'IT'`, `zh: '中文'`.

### Bilingual item rendering (UI-01/UI-02)
- On `/{en,de,it,zh}/menu`: primary line = translated name (`localized(name, locale)`), secondary line = **French name** (`name.fr`) in a smaller, muted but clearly legible style (≥ 13–14 px, WCAG AA contrast), e.g. prefixed by a tiny « FR » tag or set in italic — it is what the tourist shows/says to the server. Hide the secondary line when the primary already contains the FR name (case-insensitive) — Japanese names identical across languages render once.
- Descriptions: translated only (no FR description duplicate). Prices/variants as Phase 12 with translated units. Badges, notes, subgroups, footnotes, category names/descriptions all via `localized()` / message keys.
- `/fr/menu`: no secondary line, nothing changes visually except what Phase 12 introduced.
- Category headings on non-FR pages: translated heading primary; FR heading optional small secondary (helps staff) — planner's discretion, keep it light.
- `localized()` and all menu prop types extended to `{ fr; en?; de?; it?; zh? }` (fallback chain: requested locale → FR for content; consider `→ en → fr` for it/zh UI only if it does not hide missing data — content fallback stays FR so the server-readable name is always there).

### Chinese typography
- **No Chinese webfont download.** Use a system font stack for `zh` (`"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif`) applied when `lang="zh-Hans"` (e.g. `:lang(zh-Hans)` on body text) — phones ship these fonts; protects Lighthouse/LCP. Latin parts keep Outfit/DM Serif via fallback order. Verify no tofu on iOS Safari/Android Chrome-class renderers (headless Chromium screenshot on macOS as proxy).
- Noto Sans JP (decorative `nameJp`) unchanged.

### Tourist page polish (mobile-first, 375 px)
- Category quick-nav (existing `MenuStickyNav`) grouped/ordered with Phase 12 `section` (Plats/Boissons); horizontal scroll inside the nav is fine, **no page-level horizontal scroll**.
- Page-level notes (allergens on request, service included, homemade line) visible near the top or bottom in every language (UI-03).
- **Remove the eazee-link CTA** at the bottom of the menu page: the eazee digital menu is outdated (old prices) and now contradicts the web menu (decision under the autonomy grant; `siteSettings.eazeeLinkUrl` stays in Sanity untouched; report to EK).
- Lighthouse > 90 (performance/accessibility/SEO/best-practices) on `/fr|en|de|it|zh/menu` — measure on a production build (local `next start` or live after deploy).

### Studio (I18N-01)
- `localeString` / `localeText` get `it` (« Italien ») and `zh` (« Chinois (simplifié) ») fields in the existing collapsed « Traductions » fieldset. They will also appear on non-menu documents — accepted (collapsed, harmless).

### Deploy
- Build locally (`npm run build`), commit, push `origin v2-2026`, manual SSH deploy (see STATE), then verify live: `/it/menu`, `/zh/menu` 200; `/it/infos` → `/en/infos`; `/zh` → `/en`; switcher works; hreflang + sitemap; `<html lang="zh-Hans">`.

### Claude's Discretion
- Component structure, exact styling of the FR secondary line and switcher pills, how header switcher adapts, redirect status code (308 permanent preferred for SEO once stable, 307 acceptable), test approach.

</decisions>

<specifics>
## Specific Ideas

- Native switcher labels: `FR`, `EN`, `DE`, `IT`, `中文` (or `Français · English · Deutsch · Italiano · 中文` if space allows on desktop).
- Menu-page title per locale via `meta.menu` / `menu.title` (e.g. IT « Il nostro menù », ZH « 菜单 »).
- Price format stays `9,90 €` in every locale (it is the restaurant's price; avoid locale number formats that confuse staff) — planner may use `Intl.NumberFormat('fr-FR')` everywhere.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/phases/12-synchronisation-menu-print-2026-sanity/12-CONTEXT.md` + Phase 12 SUMMARY files — data model (variants, badges, subgroups, sections, notes) this phase renders
- `src/i18n/{routing,request,navigation}.ts`, `src/proxy.ts`
- `src/lib/seo.ts` (`LOCALES`, `buildAlternates`), `src/app/sitemap.ts`
- `src/app/(site)/[locale]/layout.tsx` (fonts, `<html lang>`, generateStaticParams), `src/app/(site)/[locale]/menu/page.tsx`
- `src/components/ui/LanguageSwitcher.tsx`, `src/components/layout/{Header,MobileMenu,Footer}.tsx`, `src/components/menu/*`
- `src/lib/localized.ts`, `src/messages/{fr,en,de}.json`
- `src/sanity/schemaTypes/{localeString,localeText}.ts`
- `.planning/STATE.md` — deploy procedure, autonomy grant

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LanguageSwitcher` (client, uses next-intl `useRouter/usePathname`), `MenuStickyNav` (IntersectionObserver active tab), `SectionHeader`, `DietaryBadge`.
- `LOCALES` constant in `seo.ts` drives sitemap + alternates.

### Established Patterns
- next-intl v4 with `localePrefix: 'always'`; messages loaded per locale in `request.ts`; Server Components translate with `getTranslations`.
- Fonts via `next/font/google` self-hosted; Noto Sans JP lazy (`preload: false`).

### Integration Points
- `proxy.ts` already special-cases `/ig-studio`; add the IT/ZH menu-only rule in the same style.
- Layout `generateStaticParams` returns all `routing.locales`.

</code_context>

<deferred>
## Deferred Ideas

- IT/ZH for the rest of the site; Traditional Chinese; "Montrer au serveur" mode; per-language scan analytics (all deferred in REQUIREMENTS.md).

</deferred>

---

*Phase: 13-fondations-multilingues-page-menu-touriste*
*Context gathered: 2026-11-23 (autonomous)*
