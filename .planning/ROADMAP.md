# Roadmap: UMAI Ramen — Refonte Site Web 2026

## Milestones

- ✅ **v1.0 MVP Launch** — Phases 1–3, 11 plans (shipped 2026-02-23) → [archive](.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v2.0 IG Content Studio** — Phases 4–7, in progress (opened 2026-06-29)

## Phases

<details>
<summary>✅ v1.0 MVP Launch (Phases 1–3) — SHIPPED 2026-02-23</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-02-23
- [x] Phase 2: Content Pages (5/5 plans) — completed 2026-02-23
- [x] Phase 3: SEO, Compliance, and Launch (3/3 plans) — completed 2026-02-23

</details>

---

## v2.0 — Umaï IG Content Studio

**Core value:** From ~81 professional photos (Nis&For, 2024) → batch-generate Instagram-ready posts: correctly dish-labeled, subtly Umaï-branded, with French captions targeting a Strasbourg audience, plus a human override step for classification corrections.

**Key decisions:**
- CLI batch tool first (fast end-to-end result) → web review UI second (do it well)
- Pilot ~10 photos, validate, then industrialize over all 81
- Overlay auto-selected by shot type: packshot → corner logo + dish chip; ambiance → photo-only
- AI stack: `claude-opus-4-8` for vision quality, `claude-sonnet-4-6` for batch captions (`@anthropic-ai/sdk`)
- Render pipeline: puppeteer-core + local Chrome → PNG → sips (macOS) → 3 Meta formats
- Lives in `ig-studio/` subfolder, separate from website runtime
- **Re-prioritization (2026-06-29): Phase 07 (editor) brought ahead of Phase 06.** Auto-classification proved too error-prone on subtle ramen/mazesoba/végé distinctions → AI is pre-fill only; Loan finalizes everything (dish, overlay, caption) in the `/ig-studio` editor. The editor subsumes most of Phase 06's per-post caption + assembly work.

### Phase 04: Ingestion & Classification (Pilot)

**Goal:** Given the ~81 photos already extracted locally to `ig-studio/photos/`, the CLI classifies each into a summer-menu dish slug or ambiance class with a shot-type tag (Claude Vision, `claude-opus-4-8`), emits a human-editable `classification.json`, and renders an HTML contact sheet for visual review — running `--pilot` (~10) first, gated before `--all` (81).

**Depends on:** v1.0 complete (Sanity schema with 17 dishes is the ground truth)

**Requirements mapped:** INGEST-01, INGEST-02, INGEST-03, INGEST-04, INGEST-05, INGEST-06, INGEST-07, INGEST-08

**Success criteria:**
- `npm run classify -- --pilot` (in `ig-studio/`) classifies ~10 varied local photos → `classification.json`, each `{ file, dishSlug|ambiance, shotType, confidence, reasoning, override }`
- Broth+noodle disambiguation (tantan / tokyo / yuzu / tsukemen / mazesoba / hiyashi / ambiance) produces plausible labels on the pilot set; chashu treated as a topping
- `npm run contact-sheet` renders thumbnails + classification + confidence, sortable for human review
- Manual corrections in `classification.json` (`override: true`) are respected on re-run and by downstream phases
- Full 81-photo `--all` run remains gated until the pilot is reviewed and signed off (`npm run signoff`)

**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — CLI scaffold + Claude Vision classifier against the summer KB → classification.json (override-wins) + pilot gate (INGEST-01..06, 08)
- [ ] 04-02-PLAN.md — HTML contact sheet + pilot review/sign-off checkpoint (INGEST-07, 08)

---

### Phase 05: Brand Kit & Compositing (CLI — Fast Result)

**Goal:** Given a pilot `classification.json` (post-correction), the CLI produces branded PNG variants in all 3 Meta formats for each photo — packshots get a corner Umaï logo + optional dish chip, ambiance shots are photo-only — using a sharp-only compositing pipeline (documented deviation from the puppeteer+sips plan — no Chrome dependency, fully offline).

**Depends on:** Phase 04 (validated pilot classification)

**Requirements mapped:** BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, BRAND-07

**Success criteria:**
- `ig-studio/brand/` module exports design tokens and logo PNG at compositing resolution
- Running `npm run ig:compose` on the pilot set produces `feed.png`, `square.png`, `story.png` per photo
- Packshot output shows Umaï logo in corner; dish-name chip visible when confidence ≥ 0.7
- Ambiance output is photo-only (no overlay elements)
- All output dimensions exactly match Meta specs: 1080×1350, 1080×1080, 1080×1920 (verified via `sips -g pixelHeight`)
- puppeteer-core launches local Chrome (no download, no cloud); no network call at compose time

**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md — Brand kit (tokens + sharp-rasterized logo PNG) + dish chip + shotType-driven applyOverlay (BRAND-01..05)
- [x] 05-02-PLAN.md — coverCrop to exact Meta formats + compose CLI (out/{photoId}/) + review gallery (BRAND-06, 07)

---

### Phase 06: Captions & Full Assembly (CLI Complete) — DEFERRED / OPTIONAL

**Goal:** (Originally) CLI generates FR captions per post and assembles `out/{photo-id}/` deliverables, then industrializes over all 81 with a review gallery.

**Status (2026-06-29):** Largely SUBSUMED by Phase 07. The editor delivers interactive FR captions (CAPTION-01/02/03, UI path) and per-post `out/{id}/` assembly + caption.txt at export (CAPTION-04, UI path). What remains optional here is the headless batch over all 81 (`npm run ig:caption`/`ig:build:all`, CAPTION-05/06) — only build it if a non-interactive bulk pass is wanted after the editor work.

**Depends on:** Phase 05 (composed pilot images), Phase 04 override JSON reviewed by owner

**Requirements mapped:** CAPTION-01, CAPTION-02, CAPTION-03, CAPTION-04, CAPTION-05, CAPTION-06 (01–04 satisfied via Phase 07 UI; 05–06 optional batch)

**Plans placeholder:** TBD (only if a batch pass is still wanted)

---

### Phase 07: IG Studio Editor (web UI for Loan)

**Goal:** A `/ig-studio` route in the existing Next 16 app where Loan reviews each photo, picks the correct dish in a few clicks (canonical menu-options dropdown that auto-fills price/baseline), edits caption, picks overlay mode, sees a live preview of the branded post, regenerates the 3 formats, and exports validated posts — fast, no JSON editing. AI classification is pre-fill only; the human finalizes. FR-only admin tool, auth-gated, outside next-intl `[locale]`.

**Depends on:** Phase 05 (compose/overlay/crop modules to reuse), Phase 04 (classification.json pre-fill). Phase 06 NOT required (editor subsumes its caption/assembly work).

**Requirements mapped:** REVIEW-01, REVIEW-02, REVIEW-03, REVIEW-04, REVIEW-05, REVIEW-06 (+ UI path for CAPTION-01..04)

**Success criteria:**
- `/ig-studio` loads (auth-gated, env-var password), outside `[locale]`; lists all 81 photos with AI suggestion + validated/pending status, filterable
- Per-photo editor: grouped dish dropdown auto-fills editable price/baseline; overlay-mode toggle; "Générer caption" (Claude FR) + editable + savable caption
- Live preview reflects unsaved choices; per-photo Regenerate writes `out/{id}/{feed,square,story}.png` (reuses ig-studio compose)
- Corrections persist to classification.json (override-wins) and survive reload; works against the CANONICAL menu (no tsukemen/hiyashi; végé = Yasai Tantan / Miso végétarien)
- Photos served (with thumbnails) from `ig-studio/photos/` via an auth-gated API route — never copied into `public/`
- Export downloads validated posts as a zip (`{id}/feed,square,story.png` + caption.txt + manifest)

**Plans:** 5/5 plans complete

Plans:
- [x] 07-01-PLAN.md — Auth + (ig-studio) FR route group + locale exclusion in proxy.ts (REVIEW-01, 06) [wave 1]
- [x] 07-02-PLAN.md — ig-studio compositor glue: menu.js + overlayMode-aware overlay + compose --photo/--preview + caption.js (REVIEW-05 capability, CAPTION-01..03 UI) [wave 1]
- [x] 07-03-PLAN.md — Server data lib + auth-gated photo/thumbnail route + gallery grid with filters (REVIEW-01, 02) [wave 2]
- [x] 07-04-PLAN.md — Per-photo editor: dropdown autofill, overlay toggle, caption gen/edit, live preview, save (override-wins), regenerate (REVIEW-03, 04, 05) [wave 3]
- [x] 07-05-PLAN.md — Export validated posts as a zip (out tree + caption.txt + manifest) (REVIEW-05, CAPTION-04 UI) [wave 4]

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-23 |
| 2. Content Pages | v1.0 | 5/5 | Complete | 2026-02-23 |
| 3. SEO, Compliance, and Launch | v1.0 | 3/3 | Complete | 2026-02-23 |
| 4. Ingestion & Classification (Pilot) | v2.0 | 0/2 | Pending | — |
| 5. Brand Kit & Compositing | v2.0 | 2/2 | Complete   | 2026-06-29 |
| 6. Captions & Full Assembly | v2.0 | 0/? | Deferred (subsumed by Phase 07) | — |
| 7. IG Studio Editor (web UI) | v2.0 | 4/5 | In Progress|  |
</content>
