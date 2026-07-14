---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Production go-live & umai-ramen.fr cutover
status: in_progress
stopped_at: Roadmap v2.1 created — Phase 08 is next to plan
last_updated: "2026-07-08T00:00:00.000Z"
last_activity: 2026-07-08 — Roadmap v2.1 written (phases 08–11, 24 requirements mapped)
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-08 after v2.1 milestone opening)

**Core value (v2.1):** Publish the new Next.js site on umai-ramen.fr (today the old GitHub Pages site) with complete production content and a controlled, low-risk domain/DNS cutover.
**Current focus:** v2.1 — go-live audit → content/debt → cutover. Target week of 2026-07-11.

## Current Position

Phase: **08 — Audit go-live & gap analysis → COMPLETE** (deliverable: `phases/08-audit-go-live/08-AUDIT-GAP-LIST.md`)
Plan: —
Status: Audit done (AUDIT-01..07). Next: Phase 09 (content) ∥ Phase 10 (debt). Awaiting EK inputs (legal values, assets, menu confirmation) — batched in the gap-list §7.
Last activity: 2026-07-09 — Go-live audit executed autonomously; prioritized gap list produced

Progress (v2.1): [██░░░░░░░░] 25% (1/4 phases complete — audit)

Next action: EK to supply legal values + photos + menu confirmation (gap-list §7); meanwhile continue no-input fixes (re-accentuation C-8 next) then `/gsd:plan-phase 9`/`10`.

### Deployed autonomously 2026-07-14 (commit 64378b7, verified live on umai.turfu.in)
- EN/DE i18n leaks fixed (reservation microcopy + Infos FAQ ×3) ✓
- og-image.jpg 1200×630 on-brand created — 404→200 ✓ (fallback; EK may replace with a photo)
- DEBT-02 bundle-analyzer wired (ANALYZE=true) ✓ COMPLETE
- /galerie empty-state guard ✓
- C-2 (EN/DE hero) resolved as false alarm — hero correctly localized
- C-8 (commit 5162dd4): re-accentuated fr.json (188 accents) + de.json (ä/ö/ü/ß, "Straßburg") — site-wide FR/DE diacritics restored ✓
- Decisions from EK: canonical = apex umai-ramen.fr (www→apex 301); catchphrase localized EN/DE; og fallback approved

### Legal pages FILLED (commit 7a34316, verified live)
- Registry-verified MOKORITA SAS data (SIREN 892 691 619, capital 20 000 €, RCS Strasbourg, APE 5610A) via annuaire-entreprises.data.gouv.fr; directeur de publication Christopher Keopraseuth (DG & co-fondateur, per EK); hébergeur Hostinger; contact@umai-ramen.fr. FR/EN/DE. → CONTENT-04 COMPLETE.
- OPEN (minor confirms, non-blocking): EK-SARL treatment (affiliation vs distinct éditeur entity needing its own SIREN); confirm contact@umai-ramen.fr mailbox exists.

### Content populated autonomously 2026-07-14 (Sanity production, via write token)
- **Gallery**: was NOT empty (9 `gallery` docs — earlier "0" was a wrong-type query on `galleryImage`). Renders live ✓.
- **Notre Histoire**: 4 sections had no images → uploaded 4 Nis&For photos (umai_009 passion, umai_001 fait-maison, umai_013 intérieur, umai_011 équipe) + patched `page-notre-histoire`. (Page schema has NO heroImage field — the "missing hero" finding was a false positive.)
- **Menu photos**: 13→**14/17**. Attached umai_064 (crémeux matcha) to `item-panna-cotta`. Remaining 3 without photos (Edamame, Mochi glacé, Tiramisu Framboise-Litchi) — no accurate Nis&For match; left empty rather than mismatched. EK to supply if wanted.
- **EK SARL** added to directeur-de-publication line (commit 11a86ea).

### Menu FULLY REBUILT from eazee-link (2026-07-14, CONTENT-02 done, verified live)
- Source of truth = eazee-link current menu (sticker GIK39GHKQZ, API api-menu.vazeetap.com). Cross-checked vs summer-2026 PDF + relecture PDF.
- Old 17-item menu was heavily outdated (phantom dishes Tori Paitan/Shoyu/Shio Ramen/Panna Cotta; wrong prices ~everywhere; ~25 dishes missing).
- Rebuilt: **167 menuItems + 26 menuCategories** (food + desserts + menus + extras + full drinks), correct FR names/prices/descriptions, categories FR/EN/DE. Item names en/de = fr; item descriptions FR-only (localized() fallback) → EN/DE translations are the "edit later" part. Tags (veg/GF) heuristic — refine in Studio.
- Old items + cat-soba deleted. Panna-cotta photo asset now orphaned (harmless).

### Still needs EK (validation/refinement only — non-blocking)
- Confirm contact@umai-ramen.fr mailbox active.
- EN/DE menu translations (names+descriptions) — currently FR fallback.
- Veg/gluten-free tags per item (set heuristically).
- Optional: dish photos (most items have none), photo-based og-image, EK-SARL entity treatment.

## Go-live gap headlines (2026-07-09 audit)

🔴 Blockers: legal pages unfilled `[PLACEHOLDER]` (FR/EN/DE); EN/DE FR-leak strings (reservation subtitle, Infos FAQ; hero to confirm); `/og-image.jpg` 404; Galerie empty (0 Sanity images); post-cutover turfu.in→prod canonical.
🟠 Major: 4 menu items missing photos; Notre Histoire hero; confirm summer-menu/prices; wire bundle-analyzer.
✅ Good: cutover is mechanically trivial (old site = one-pager, baseUrl = 1 env var + rebuild, /ig-studio auth host-agnostic); build healthy; JSON-LD + NAP + hreflang solid.

## Performance Metrics

**v2.1 velocity:** Not yet measured.

**v2.0 (IG Content Studio):** built + deployed on umai.turfu.in/ig-studio; not formally archived.

**v1.0 history (archived):**

- Total plans completed: 11 across 3 phases
- Average duration: ~9 min/plan
- Total execution time: ~98 min
- Phase breakdown: 01-foundation 65min, 02-content-pages 43min, 03-seo-compliance ~30min

## Accumulated Context

### Key Decisions (v2.1)

- Phases 09 and 10 are unblocked in parallel once Phase 08 produces the gap list (content audit → 09, blocking bugs → 10)
- Phase 11 is the go-live gate — requires 08 (cutover dossier), 09 (content complete), 10 (blocking debt cleared)
- Short maintenance window acceptable; rollback = revert DNS (apex A + www) to GitHub Pages IPs `185.199.10x.153`
- Sanity dataset: `c7twe801/production` — all content changes go directly to production dataset
- GitHub: `umairamenchef/umai-ramen-site`, branch `v2-2026`
- Target: week of 2026-07-11

### Key Decisions (v2.0)

- CLI first, web UI second — locked by owner (EK)
- Pilot ~10 photos before full 81-photo run — mandatory gate
- `claude-opus-4-8` for vision classification (quality), `claude-sonnet-4-6` for captions (cost)
- puppeteer-core + local Chrome render (no cloud render); sips for macOS resize
- Output tree: `ig-studio/out/{photo-id}/` — 3 PNGs + caption.txt
- Photo source: Google Drive `JPEG_72dpi` folder id `19JmEURV-XqcMm97jZwU7AV9uG7y6-t7M`
- Menu ground truth: Sanity project `c7twe801`, dataset `production`
- Brand tokens: ivoire `#F5F0E8`, vert `#77967A`; logo from `umai_logo_menu.svg` / `public/logo.svg`

### Key Decisions (v1.0 — carried)

Stack locked: Next.js 16.1.6, React 19.2, Sanity v5, next-intl v4.8.3, motion v12, Tailwind CSS 4.
Deployment: Docker standalone on VPS srv1417179 (valid 2027-02-23), multi-site Caddy, umai.turfu.in.

### Tech Debt (v1.0 — addressed in Phase 10)

- SEO-07: Footer NAP not wired to `seo.ts` constants → DEBT-01
- PERF-05: First-load JS ~220KB > 150KB target (irreducible framework floor) → DEBT-03
- bundle-analyzer: `@next/bundle-analyzer` not wired into `next.config.ts` → DEBT-02

### Pending Todos (owner-side)

- Photo assets from EK: progressively from 2026-07-09 (hero + gallery, from JPEG_72dpi Google Drive)
- Summer menu ground truth from Loan Nguyen — verify dishes/prices/tags against in-restaurant reality
- Notre Histoire text validation with Loan Nguyen
- EN/DE Sanity content translations
- DNS cutover decision: TTL lowering timing, maintenance window announcement

### Blockers/Concerns

- RESOLVED: Google Drive auth — photos are already local (no Drive fetch needed for ig-studio)
- PENDING: umai_037.jpg classified as ambiance — appears to be an udon dish (not on summer ramen menu). Owner should review during pilot sign-off.
- PENDING: Pilot sign-off — owner must review contact-sheet.html and run `npm run signoff` to unblock --all

## Session Continuity

Last session: 2026-07-08
Stopped at: Roadmap v2.1 written (phases 08–11). REQUIREMENTS.md traceability updated. STATE.md updated.
Resume: Run `/gsd:plan-phase 8` to create the execution plan for Phase 08 (Audit go-live & gap analysis).

### Key Decisions Added (v2.0 execution)

- LOCKED: Photos already local (ig-studio/photos/umai_001..081.jpg) — no Drive/OAuth needed (INGEST-01 satisfied)
- LOCKED: Summer menu KB (data/summer-menu-2026.json) is classification ground truth
- LOCKED: Pilot uses even-spread indices (not first-N) to sample full photo range
- LOCKED: classifier.js safe fallback: parse errors → ambiance (0.0 conf), batch never crashes
- LOCKED: KB slugs use hardcoded name→slug map for stability (no fragile accent-strip for variant names)
