# Phase 08 — Go-live Audit & Gap List

**Milestone:** v2.1 — Mise en ligne production & bascule umai-ramen.fr
**Date:** 2026-07-09
**Audited target:** https://umai.turfu.in (staging) + repo `umai2026` + Sanity `c7twe801/production` + DNS/Caddy
**Method:** live fetch of all pages, Sanity public-read GROQ, repo inspection, VPS config read, parallel review agents.
**Severity legend:** 🔴 BLOCKING (must fix before go-live) · 🟠 MAJOR (should fix) · 🟡 MINOR (nice-to-have / post-launch)

> Sections marked _(agent)_ are filled from the content/i18n and perf/build review agents.

---

## 0. Executive summary

The cutover **mechanics** are simple and low-risk: the old site is a single-page GitHub Pages site (no deep URLs to redirect), the base URL is a single env var (rebuild needed), `/ig-studio` auth is host-agnostic, and the production build is healthy. **No architectural or performance blockers.**

The real go-live work is **content & legal**: the 4 legal pages are unfilled `[PLACEHOLDER]` templates (legal blocker), several EN/DE strings still show FR, the OG share image 404s, and the gallery is empty.

**Go-live blockers:** (1) legal pages unfilled, (2) EN/DE untranslated strings (reservation subtitle + Infos FAQ; hero to confirm), (3) `/og-image.jpg` 404, (4) empty Galerie, (5) staging→prod canonical strategy. Most need EK inputs (legal values, assets); the translation plumbing I can fix once values/decisions land.

---

## 1. Cutover mechanics — dossier (AUDIT-05, AUDIT-07)

### 1.1 Current state (verified 2026-07-09)
| Item | Value |
|------|-------|
| Old site (umai-ramen.fr apex + www) | **GitHub Pages** — A `185.199.108–111.153`, www → `umairamenchef.github.io`. One-page site (title "UMAI Ramen noodle shop", anchors `#menu`/`#story`/`#social`). Uses **obypay** ordering (replaced by Gusty on new site). No sitemap.xml (404). |
| New site | VPS `srv1417179` / `76.13.61.239`, Docker `umai` (web/caddy/deployer), served on umai.turfu.in |
| Caddyfile (VPS) | Single block `umai.turfu.in { handle /webhook/* → deployer:9000 ; handle → web:3000 }` |
| Base URL | `NEXT_PUBLIC_BASE_URL` — VPS sets `https://umai.turfu.in` (in docker-compose.yml **and** .env.local). Default in `src/lib/seo.ts` = `https://umai-ramen.fr`. **NEXT_PUBLIC_ = build-time inlined → changing it requires a REBUILD, not a restart.** |
| Root redirect | `/` → 307 `/fr` ✓ (works on any host) |
| `/ig-studio` auth | `src/proxy.ts` matcher is path-based / host-agnostic → protection carries to umai-ramen.fr automatically (CUTOVER-03 = no work) |

### 1.2 Redirect map (AUDIT-05)
Old site is a **one-pager** → the only real inbound URL is `/` (plus in-page `#anchors`, which are not separate URLs). **No per-path 301 map needed.** `/` → `/fr` already handled by next-intl. External deep links to the old site do not exist. → CUTOVER-04 is effectively trivial (just ensure `/` resolves; optionally map a couple of legacy anchor links if any are advertised).

### 1.3 Cutover runbook (for Phase 11)
1. **Lower TTL** on umai-ramen.fr apex + www DNS records to 300s, ≥1h before cutover.
2. **Caddy** — add to `/home/ek/apps/umai/Caddyfile` (edit on host, not git-tracked):
   ```
   www.umai-ramen.fr {
       redir https://umai-ramen.fr{uri} permanent
   }
   umai-ramen.fr {
       handle /webhook/* { reverse_proxy deployer:9000 }   # keep or drop; webhook can stay on turfu.in only
       handle { reverse_proxy web:3000 }
   }
   ```
   (Caddy auto-provisions TLS once DNS points at the VPS — CUTOVER-01/-02.)
3. **Base URL flip** — set `NEXT_PUBLIC_BASE_URL=https://umai-ramen.fr` in docker-compose.yml + .env.local, then **rebuild** web (`docker compose -p umai up -d --build web`). This makes sitemap `<loc>`, robots `Sitemap:`, canonical, hreflang, and og:url all use umai-ramen.fr.
4. **DNS switch** — apex A → `76.13.61.239` (remove the 4 GitHub Pages A records); www → A `76.13.61.239` or CNAME apex. Short maintenance window acceptable (EK).
5. **Post-cutover** (CUTOVER-06): verify TLS valid, Lighthouse>90, CWV, sitemap/robots resolve on the new host, JSON-LD validates, reserve (Gusty) + order (Uber Eats/C&C) CTAs work, `/ig-studio` login reachable, no mixed content.
6. **Staging hygiene** — after cutover, **301 umai.turfu.in → umai-ramen.fr** (or noindex it) to avoid duplicate-content indexing. See §2.
7. **Search Console** (CUTOVER-07) — add umai-ramen.fr property, submit sitemap, request reindex.
8. **Rollback** — revert apex A + www to GitHub Pages IPs `185.199.108–111.153` and disable the Caddy block. TTL 300s makes revert fast.

---

## 2. SEO / metadata (AUDIT-04)

| # | Sev | Finding | Remediation |
|---|-----|---------|-------------|
| SEO-1 | 🔴 | **`/og-image.jpg` returns 404** (no `public/og-image.jpg` in repo) — every social/OG share references a broken image (`og:image` = `{BASE_URL}/og-image.jpg`). | Create a real 1200×630 on-brand `public/og-image.jpg` (CONTENT-06). |
| SEO-2 | 🟠 | **Staging umai.turfu.in is fully indexable** and its sitemap `<loc>`/canonical currently point to turfu.in → duplicate-content risk with umai-ramen.fr. | Part of cutover: after switch, 301 turfu.in → umai-ramen.fr (preferred) or noindex. Until then, consider a temporary `X-Robots-Tag: noindex` on turfu.in. |
| SEO-3 | 🟡 | **Live `robots.txt` lacks `Disallow: /studio`** although `src/app/robots.ts` includes it → the deployed robots is stale vs source. | Auto-resolves on next rebuild (cutover rebuild covers it). Verify post-cutover. |
| SEO-4 | 🟡 | `/studio` (Sanity Studio SPA) returns 200 publicly (edit still requires Sanity login). | Already `Disallow`-ed in robots source; acceptable. Optionally gate at Caddy. |
| ✓ | — | JSON-LD **Restaurant + PostalAddress + 6×OpeningHours** on home; **Menu + 17 MenuItem + 8 MenuSection + 17 Offer** on /menu. hreflang alternates + canonical present. sitemap lists all 11 pages × 3 locales. | No action — solid. |

---

## 3. Content — from Sanity `production` (AUDIT-01/02/03, feeds Phase 09)

Sanity is public-read. Verified counts & fields:

| Item | State | Sev | Note |
|------|-------|-----|------|
| siteSettings NAP | ✓ complete | — | address 5 rue des Orphelins 67000 Strasbourg, phone 09 52 34 34 38, hours present, catchphrase FR/EN/DE, accentColor #77967A |
| Home hero image | ✓ present | — | `heroImage.asset` defined |
| menuItem | 17 items, **all priced, all available**, **13/17 with image** | 🟠 | **4 menu items have no photo** — identify & supply (CONTENT-01/02). Also EK must confirm this is the **current (summer) menu** with correct prices — needs human ground truth (AUDIT-02). |
| menuCategory | 8 | — | matches JSON-LD sections |
| **galleryImage** | **0 — EMPTY** | 🔴 | **/galerie has no photos.** Populate with the final Nis&For selection (CONTENT-05). Blocking for that page. |
| **Notre Histoire** (`page` doc) | exists, **no hero image**, slug `notre-histoire` | 🟠 | Add hero + validate body copy with Loan (CONTENT-05). |
| Legal pages (4) | **UNFILLED `[PLACEHOLDER]` templates in FR/EN/DE** — source is `src/messages/{fr,en,de}.json`, NOT Sanity. Shows literal `[COMPANY NAME]`, `[SIRET NUMBER]`, `[DIRECTOR NAME]`, `[HOSTING PROVIDER/ADDRESS/PHONE]`, `[CONTACT EMAIL]`, `[LEGAL FORM]`, `[RCS CITY]`, `[SHARE CAPITAL]` | 🔴 | **Legal blocker.** EK must supply the real values; then fill the 3 message files. (My earlier "SIRET present" grep was a false positive — the 14-digit match was a fragment of the Gusty booking ID, not a SIRET.) |

---

## 4. Content & i18n — rendered pages

| # | Sev | Finding | Location / fix |
|---|-----|---------|----------------|
| C-1 | 🔴 | **4 legal pages show unfilled `[PLACEHOLDER]` templates** in all 3 locales (see §3). | `src/messages/{fr,en,de}.json` — fill with EK-supplied legal values. |
| C-2 | 🔴 | **EN & DE home hero shows FR** `"Nouilles fraiches. Bouillons maison."` although `page.tsx:98` DOES call `localized(settings.catchphrase, locale, frFallback)` and Sanity HAS en/de values. → root cause is either a **stale build/ISR** on the live container or a bug in `localized()` returning the FR fallback. | Diagnose `localized()` + force revalidate; verify on a fresh build. |
| C-3 | 🔴 | **EN & DE `/reservation` subtitle shows FR** `"Gratuit, sans commission"`. | `messages/{en,de}.json` — add translation. |
| C-4 | 🔴 | **EN & DE `/infos` FAQ — all 3 answers in FR** (allergens / groups / vegetarian). | `messages/{en,de}.json` FAQ keys — translate. |
| C-5 | 🟠 | **/galerie** renders the lightbox with an empty array and **no empty-state message** (0 Sanity images). | Add images (CONTENT-05) + optionally an empty-state guard in the gallery component. |
| C-6 | 🟠 | **/notre-histoire** has no hero image; if any section image is missing it shows a grey `bg-umai-line` box. | Add hero + section images (CONTENT-05). |
| C-7 | 🟡 | **/commander** Click & Collect card shows "Bientôt disponible" — `clickCollectUrl` unset in Sanity. | Set the Gusty C&C URL in Sanity when available (already a known pending todo). |
| C-8 | 🟠 | **Site-wide missing diacritics in UI strings.** `src/messages/fr.json` has **1** accented char total, `de.json` **2** — French shows "Reservez / equipe / fraiches", German "Offnungszeiten / Haufig". Unprofessional for a FR restaurant; also affects readability/search. (Sanity editorial content keeps its accents — this is only the hardcoded dictionaries.) | Dedicated re-accentuation pass over `messages/fr.json` + `de.json` (mechanical, correctness-only). Phase 10. |

**Note:** legal placeholders and EN/DE strings live in the **repo** (`src/messages/*.json` + hero component), so I can fix the translation *plumbing* myself once EK provides the legal values and confirms the EN/DE catchphrase should be localized (vs. keeping the FR tagline as a brand constant).

---

## 5. Performance & build

Production build **succeeds** (81s, Turbopack, 40 static pages, standalone). **No perf blocker for go-live.**

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| P-1 | 🟠 | **`@next/bundle-analyzer` not wired** into next.config.ts (installed, unused). | DEBT-02: wrap config with `withBundleAnalyzer` (ANALYZE env, dev-only) → get the exact First-Load-JS table. |
| P-2 | 🟡 | **`/studio` (Sanity, ~4.2 MB chunk) not `dynamic()`-wrapped** — but it's a separate route group, NOT on the public critical path. | Optional: `dynamic(import, {ssr:false})` on the Studio page. Non-blocking. |
| P-3 | 🟡 | **PERF-05 number stale.** Old note "~220KB" = just the React/Next runtime. Real shared baseline ≈ 511 KB uncompressed (~160 KB gzip); public page transfer ≈ 0.5 MB gzip (agent estimate — reconcile exact figure via P-1). | Update PERF-05 with the real gzip figure once the analyzer is wired. |
| ✓ | — | Route groups isolate `/studio` and `/ig-studio` from the public bundle ✓. Images via Sanity CDN, quality tiers, responsive sizes ✓. LazyMotion (motion) ✓. Footer/MobileBar are server components ✓. | No action. |

**Verdict:** architecture is sound; the only real debt item is wiring the analyzer (DEBT-02) and refreshing the PERF-05 number. Studio `dynamic()` is a nice-to-have, not a launch blocker.

---

## 6. Prioritized go-live gap list

### 🔴 Blocking (before public cutover)
- **C-1 / Legal** Fill the 4 legal pages (mentions légales, confidentialité, cookies, CGV) in FR/EN/DE — currently `[PLACEHOLDER]` templates. _(EK supplies legal values → I fill `messages/*.json`.)_
- **C-2/C-3/C-4 / i18n** Translate FR strings leaking on EN/DE: home hero catchphrase, reservation subtitle, Infos FAQ (×3). _(I can fix in `messages/{en,de}.json` + hero component.)_
- **SEO-1** Create real `public/og-image.jpg` (1200×630) — currently 404.
- **Galerie** Populate Sanity `galleryImage` (currently 0). _(EK assets)_ + empty-state guard.
- **SEO-2 strategy** Post-cutover 301 turfu.in→umai-ramen.fr (avoid duplicate indexing).

### 🟠 Major (should fix for a clean launch)
- 4 menu items missing photos _(EK assets)_.
- Notre Histoire hero image + copy validation _(EK)_.
- Confirm menu = current summer menu, prices correct _(EK ground truth)_.
- **P-1** Wire `@next/bundle-analyzer` (DEBT-02) + refresh the PERF-05 number.
- Confirm C-2 hero EN/DE (my re-check was inconclusive).
- **C-8** Site-wide re-accentuation of `messages/fr.json` + `de.json` (French/German diacritics stripped).

### 🟡 Minor (post-launch OK)
- C-7 Click & Collect URL unset ("Bientôt disponible") — set Gusty C&C URL in Sanity when ready.
- robots `/studio` disallow (auto on rebuild); /studio public SPA (optional Caddy gate).
- _(+ perf minors)_

---

## 7. Decisions / inputs needed from EK (batched)
1. **Legal values (blocking):** company legal name, forme juridique, **SIRET**, RCS city, share capital, directeur de publication, hébergeur (name/address/phone) — hébergeur is Hostinger; I can pre-fill that. Contact email for legal notices.
2. **Canonical host:** apex `umai-ramen.fr` (recommended) with `www`→apex 301 — confirm.
3. **EN/DE hero catchphrase:** localize it (use Sanity "FRESH NOODLES…" / "FRISCHE NUDELN…") or keep the FR tagline as a brand constant across locales? _(Recommend localize.)_
4. **Menu ground truth:** is the 17-item Sanity menu the current in-restaurant (summer) carte with correct prices? Which 4 items still need photos?
5. **Gallery:** which photos for /galerie (final Nis&For selection)?
6. **Assets to supply:** og-image (or I generate one on-brand), Notre Histoire hero, missing menu photos.

---
*Audit compiled by Claude — Phase 08, milestone v2.1.*
