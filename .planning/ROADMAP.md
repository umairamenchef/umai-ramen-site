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

**Goal:** Given a pilot `classification.json` (post-correction), the CLI produces branded PNG variants in all 3 Meta formats for each photo — packshots get a corner Umaï logo + optional dish chip, ambiance shots are photo-only — using the puppeteer+sips pipeline reused from minova.

**Depends on:** Phase 04 (validated pilot classification)

**Requirements mapped:** BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, BRAND-07

**Success criteria:**
- `ig-studio/brand/` module exports design tokens and logo PNG at compositing resolution
- Running `npm run ig:compose` on the pilot set produces `feed.png`, `square.png`, `story.png` per photo
- Packshot output shows Umaï logo in corner; dish-name chip visible when confidence ≥ 0.7
- Ambiance output is photo-only (no overlay elements)
- All output dimensions exactly match Meta specs: 1080×1350, 1080×1080, 1080×1920 (verified via `sips -g pixelHeight`)
- puppeteer-core launches local Chrome (no download, no cloud); no network call at compose time

**Plans placeholder:** `05-01`, `05-02` (to be defined in plan phase)

---

### Phase 06: Captions & Full Assembly (CLI Complete)

**Goal:** Given validated classifications and composed images for the pilot, the CLI generates FR captions per post and assembles final per-photo deliverable folders (`out/{photo-id}/`); then industrializes over all 81 photos with a review gallery.

**Depends on:** Phase 05 (composed pilot images), Phase 04 override JSON reviewed by owner

**Requirements mapped:** CAPTION-01, CAPTION-02, CAPTION-03, CAPTION-04, CAPTION-05, CAPTION-06

**Success criteria:**
- `npm run ig:caption --pilot` generates `caption.txt` for each pilot photo via Claude (`claude-sonnet-4-6`)
- Captions contain: dish name FR + JP, appetizing copy, Strasbourg/Krutenau local angle, hashtags, NAP CTA
- Ambiance captions make no dish claim; use generic Umaï brand voice
- `out/{photo-id}/` tree contains exactly: `feed.png`, `square.png`, `story.png`, `caption.txt`
- HTML review gallery renders all assembled deliverables (thumbnail + caption preview) for owner sign-off
- `npm run ig:build:all` processes all 81 photos end-to-end without errors; failed/skipped photos logged

**Plans placeholder:** `06-01`, `06-02`, `06-03` (to be defined in plan phase)

---

### Phase 07: Web Review & Override UI

**Goal:** An in-repo Next.js route (`/ig-studio`) lets the owner browse all classified photos, correct classifications inline, edit captions, and trigger per-photo regeneration — the "do it well" version that makes corrections faster than editing JSON directly.

**Depends on:** Phase 06 complete (full `out/` tree + `classification.json` populated)

**Requirements mapped:** REVIEW-01, REVIEW-02, REVIEW-03, REVIEW-04, REVIEW-05, REVIEW-06

**Success criteria:**
- `/ig-studio` route accessible in dev server; auth-gated (env-var check at minimum)
- Gallery view shows all photos: thumbnail, dish label, shot type, confidence badge
- Inline correction form saves to `classification.json` via Server Action without page reload
- Caption edit field pre-fills from `caption.txt`; save writes back to `out/{id}/caption.txt`
- "Regenerate" button re-runs compose + caption for the selected photo and refreshes the view
- No separate deployment — UI lives inside the existing Next.js app

**Plans placeholder:** `07-01`, `07-02`, `07-03` (to be defined in plan phase)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-23 |
| 2. Content Pages | v1.0 | 5/5 | Complete | 2026-02-23 |
| 3. SEO, Compliance, and Launch | v1.0 | 3/3 | Complete | 2026-02-23 |
| 4. Ingestion & Classification (Pilot) | v2.0 | 0/2 | Pending | — |
| 5. Brand Kit & Compositing | v2.0 | 0/? | Pending | — |
| 6. Captions & Full Assembly | v2.0 | 0/? | Pending | — |
| 7. Web Review & Override UI | v2.0 | 0/? | Pending | — |
