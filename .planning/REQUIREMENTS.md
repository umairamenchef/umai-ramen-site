# Requirements: v2.0 — Umaï IG Content Studio

**Defined:** 2026-06-29
**Milestone:** v2.0
**Core Value:** From ~81 professional photos (Nis&For, 2024) → batch-generate Instagram-ready posts that are correctly dish-labeled, subtly Umaï-branded, with French captions targeting a Strasbourg audience, plus a human override step to fix classification mistakes.

## Table Stakes (must be true for v2.0 to ship)

- Classification errors are expected and correctable before any image is finalized
- CLI batch tool ships first (fast end-to-end result); web UI ships second (do it well)
- Pilot of ~10 photos validates the pipeline before full 81-photo run
- All AI calls (vision + caption) stay server-side — API key never exposed to browser
- Output images match exact Meta formats: feed 1080×1350, square 1080×1080, story 1080×1920
- Brand attribution visible on packshot output (Umaï logo) so reposted images stay attributable

---

## v2.0 Requirements

### Ingestion & Classification

- [ ] **INGEST-01**: CLI fetches photos from Google Drive folder `JPEG_72dpi` (id `19JmEURV-XqcMm97jZwU7AV9uG7y6-t7M`) — ~81 files `Umaï_2024_Nis&For_72dpi_001..081.jpg` — to a local working directory
- [ ] **INGEST-02**: Menu knowledge base extracted from Sanity (project `c7twe801`, dataset `production`) — 17 dishes across 8 categories with broth type, noodle type, and key toppings — used as ground truth for classification
- [ ] **INGEST-03**: Claude Vision (`claude-opus-4-8`) classifies each photo → `{dishSlug | "ambiance", shotType: "packshot" | "ambiance", confidence: 0–1, reasoning: string}`
- [ ] **INGEST-04**: Classification distinguishes shot types by scene: packshot = single identifiable dish in frame, ambiance = restaurant interior/decor/people/multiple dishes with no single focus
- [ ] **INGEST-05**: Broth disambiguation rules encoded in classifier prompt: tantan = reddish-sesame + minced beef, paitan = opaque creamy white, miso = red-brown cloudy, shio/shoyu = clear broth (default to shoyu if unsure between the two); chashu is a topping resolved by broth+noodle combo, not the pork piece alone
- [ ] **INGEST-06**: Classification output emits a human-editable `classification.json` override file — each entry can be corrected by hand before downstream steps consume it
- [ ] **INGEST-07**: HTML contact sheet generated from classified pilot batch (~10 photos) showing photo thumbnail + classification result + confidence for visual review
- [ ] **INGEST-08**: Pilot validation gate — full 81-photo run is blocked until pilot contact sheet is reviewed and `classification.json` corrections are applied

### Brand Kit & Compositing

- [x] **BRAND-01**: Brand kit module at `ig-studio/brand/` exports design tokens: ivoire `#F5F0E8`, vert accent `#77967A`, font stack (DM Serif Display, Outfit), logo path reference
- [x] **BRAND-02**: Logo PNG exported from `umai_logo_menu.svg` / `public/logo.svg` at required resolutions for overlay compositing (transparent background)
- [x] **BRAND-03**: Packshot overlay template: subtle corner Umaï logo + optional dish-name chip (FR name) with optional price; chip shown only when dish is classified with confidence ≥ 0.7
- [x] **BRAND-04**: Ambiance overlay template: photo-only — no visual overlay, all branding deferred to the caption; template selection driven by `shotType` in `classification.json`
- [x] **BRAND-05**: `puppeteer-core` + local Chrome renders the HTML/CSS overlay template → PNG at source resolution, reusing the render pattern from minova ads pipeline
- [x] **BRAND-06**: `sips` (macOS built-in) resizes rendered PNG to all 3 Meta formats: feed 1080×1350, square 1080×1080, story 1080×1920 — exact pixel dimensions, no letterboxing
- [x] **BRAND-07**: End-to-end CLI command (`npm run ig:compose`) produces branded image variants for the pilot batch and reports output paths

### Captions & Full Assembly

- [x] **CAPTION-01**: Claude (`claude-sonnet-4-6` for cost efficiency) generates FR captions per post: dish name in French + Japanese, appetizing copy evoking the dish's character, Strasbourg/Krutenau local angle
- [x] **CAPTION-02**: Every caption includes relevant hashtags (dish-specific + brand + Strasbourg local) and a soft CTA anchored to NAP (address, reservation link, or phone as appropriate)
- [x] **CAPTION-03**: Caption generation is explicitly gated on validated `classification.json` — Claude reads the final (post-correction) dish slug to generate accurate copy; ambiance photos get generic Umaï brand captions without dish claim
- [x] **CAPTION-04**: Per-photo deliverable assembled in `ig-studio/out/{photo-id}/`: `feed.png`, `square.png`, `story.png`, `caption.txt` — clean tree, one folder per source photo
- [ ] **CAPTION-05**: Final HTML review gallery enumerates all assembled deliverables (thumbnail + caption preview) for owner sign-off before posting
- [ ] **CAPTION-06**: Full industrialization run over all 81 photos triggered by `npm run ig:build:all` after pilot is validated

### Web Review & Override UI

- [x] **REVIEW-01**: In-repo web UI accessible at `/ig-studio` (Next.js route or dedicated page) — no separate deployment, runs inside existing app dev server
- [x] **REVIEW-02**: UI lists all classified photos with thumbnail, detected dish, shot type, confidence score, and reasoning excerpt — read from `classification.json`
- [x] **REVIEW-03**: UI allows inline correction of classification (dish slug dropdown from menu knowledge base + shot type toggle) and writes corrections back to `classification.json` via Server Action
- [x] **REVIEW-04**: UI displays current caption per photo (from `out/` tree) with inline edit field; edited caption can be saved via Server Action
- [x] **REVIEW-05**: UI exposes a per-photo "Regenerate" button that re-runs the compose + caption steps for that single photo via API route, without re-running the full batch
- [ ] **REVIEW-06**: UI is auth-gated (same iron-session auth as rest of app if auth exists, or basic env-var check) — not publicly accessible

---

## Table Stakes / Out of Scope

| Feature | Reason |
|---------|--------|
| Automated Instagram publishing (direct API post) | Requires Meta app review + long-lived tokens — out of scope; human posts manually |
| Multi-language captions (EN/DE) | FR is the target audience; trilingual IG copy out of scope for v2.0 |
| Video/Reel generation | Photo-only batch; video is a different workflow |
| STT/voice control | Not relevant to a batch photo tool |
| Scheduling / content calendar | Out of scope; owner decides post timing manually |
| Story interactive elements (polls, stickers) | Requires Instagram Stories API, not a static image tool |
| Auto-correction of classification without human review | Human override is a required step, not optional |
| Re-ingestion from Drive on every run | Drive fetch is one-time; files cached locally for subsequent runs |
| Windows / Linux support for `sips` resize step | macOS only; sips is a macOS built-in |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01 | Phase 04 | Pending |
| INGEST-02 | Phase 04 | Pending |
| INGEST-03 | Phase 04 | Pending |
| INGEST-04 | Phase 04 | Pending |
| INGEST-05 | Phase 04 | Pending |
| INGEST-06 | Phase 04 | Pending |
| INGEST-07 | Phase 04 | Pending |
| INGEST-08 | Phase 04 | Pending |
| BRAND-01 | Phase 05 | Complete |
| BRAND-02 | Phase 05 | Complete |
| BRAND-03 | Phase 05 | Complete |
| BRAND-04 | Phase 05 | Complete |
| BRAND-05 | Phase 05 | Complete |
| BRAND-06 | Phase 05 | Complete |
| BRAND-07 | Phase 05 | Complete |
| CAPTION-01 | Phase 06 | Complete |
| CAPTION-02 | Phase 06 | Complete |
| CAPTION-03 | Phase 06 | Complete |
| CAPTION-04 | Phase 06 | Complete |
| CAPTION-05 | Phase 06 | Pending |
| CAPTION-06 | Phase 06 | Pending |
| REVIEW-01 | Phase 07 | Complete |
| REVIEW-02 | Phase 07 | Complete |
| REVIEW-03 | Phase 07 | Complete |
| REVIEW-04 | Phase 07 | Complete |
| REVIEW-05 | Phase 07 | Complete |
| REVIEW-06 | Phase 07 | Pending |

**Coverage:**
- v2.0 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-29*
*Last updated: 2026-06-29 after v2.0 milestone opening*
