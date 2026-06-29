# Phase 07 — IG Studio Editor (web UI for Loan) — CONTEXT

Locked 2026-06-29. **Re-prioritized ahead of Phase 06** per owner: auto-classification is too error-prone on subtle ramen/mazesoba/végé distinctions, so **AI is pre-fill only; Loan finalizes in the UI**. This editor becomes the hub that orchestrates classification override + compositing + captions interactively (it subsumes much of Phase 06).

## Goal
A `/ig-studio` route in the existing Next 16 app where the restaurateur (Loan) reviews each photo, picks the correct dish in a few clicks, edits price/baseline/caption, picks overlay mode, sees a **live preview** of the branded post, regenerates, and exports — fast, no JSON editing.

## App integration facts
- App: Next 16.1.6 / React 19 / Tailwind 4. Route groups: `src/app/(site)/[locale]` (i18n site), `src/app/(studio)/studio` (Sanity). 
- Add a NEW route group `src/app/(ig-studio)/ig-studio` — admin tool, **FR-only, OUTSIDE next-intl [locale] routing**. Ensure `proxy.ts` (the Next16 middleware) does not force-locale-redirect `/ig-studio`.
- **Auth (REVIEW-06):** no iron-session exists yet. Minimum: an env-var password gate (e.g. `IG_STUDIO_PASSWORD`) — a simple cookie-set login page or basic check in proxy.ts for `/ig-studio`. Keep it simple but not public.

## Data sources
- Photos: `ig-studio/photos/umai_001..081.jpg` (gitignored, OUTSIDE Next `public/`). Serve via an API route `src/app/api/ig-studio/photo/[id]/route.ts` that streams the file (and a thumbnail variant via sharp). Do NOT copy 53MB into public/.
- `ig-studio/classification.json` — AI pre-fill (current labels are partly wrong: they used an old seasonal menu and fabricated tsukemen/hiyashi — treat as rough suggestions only).
- `ig-studio/data/menu-options.json` — **CANONICAL dropdown source** (full 2026 menu; groups: Ramen crémeux, Ramen clairs, Ramen végétariens [Yasai Tantan, Miso végétarien — tofu], Mazesoba, Udon, Entrées, Desserts, + Ambiance/photo-only). Each item: slug, name, price, baseline, flags (vege/signature). Includes real NAP (5 Rue des Orphelins 67000 Strasbourg · 09 52 34 34 38 · @umai_ramen_strasbourg · umai-ramen.fr) for captions.
- Compositing logic already exists in `ig-studio/src/` (brand tokens, applyOverlay, coverCrop, composePhoto) — REUSE it. Cleanest: API routes shell out to the ig-studio CLI (`node ig-studio/src/cli.js compose --photo <id>`) OR import the modules. Prefer a small shared compose function callable from the API route.

## UI / behavior (REVIEW-01..06 + owner asks)
Per photo card:
- Thumbnail + AI suggestion (dish + confidence badge + reasoning excerpt) as a starting point.
- **Dish dropdown** from menu-options.json (grouped) — Loan picks the real dish in 1 click. Selecting a dish auto-fills **price** + **baseline** (both editable). A **végé/tofu** option is available (Yasai Tantan / Miso végétarien). An **"Ambiance (photo-only)"** option sets overlay=none.
- **Overlay mode** toggle: packshot (logo + dish chip) / ambiance (photo-only). Auto-set from dish choice but overridable.
- **Caption** field: a "Générer caption" button calls Claude (FR, Strasbourg audience, dish name + baseline + price + NAP/CTA + hashtags) to draft; Loan edits freely; saved per photo. (This folds in Phase 06.)
- **Live preview** of the composed branded image (feed format) — regenerated on change via sharp (server). 
- **Save** persists to `classification.json` (override-wins) + caption store; **Regenerate** (REVIEW-05) re-composes the 3 formats for that one photo into `out/{id}/`.
- Gallery view: all 81 with status (validated / pending), filter by group/confidence.
- **Export**: download/zip the validated posts (image variants + caption) — or at least the `out/` tree is populated for validated photos.

## Tech / constraints
- sharp for image ops (already a dep) for preview + compose + thumbnails. Anthropic SDK (key in `ig-studio/.env`, and/or app env) for caption generation.
- `ig-studio/out/` and `photos/` stay gitignored. UI code + API routes ARE committed.
- Deployment (later): for Loan to use online, the photos must be present on the VPS and the route auth-gated; note this but local-dev-first is fine for v1 of the editor.

## Out of scope
Re-running full auto-classification (optional separate step); the public site content; Sanity changes.

## Success criteria
- `/ig-studio` loads (auth-gated), lists all 81 photos with AI suggestion.
- Picking a dish updates price/baseline; overlay mode switch works; caption generate+edit+save works.
- Live preview reflects choices; per-photo Regenerate writes `out/{id}/{feed,square,story}.png`.
- Corrections persist to classification.json (override-wins) and survive reload.
- Works against the CANONICAL menu (no tsukemen/hiyashi; végé = Yasai Tantan / Miso végétarien).
