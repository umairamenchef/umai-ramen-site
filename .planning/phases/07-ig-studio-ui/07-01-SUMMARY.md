---
phase: 07-ig-studio-ui
plan: "01"
subsystem: ig-studio-auth
tags: [auth, edge-middleware, next16, tailwind4, web-crypto]
dependency_graph:
  requires: []
  provides: [ig-studio-auth-gate, ig-studio-route-group, ig-studio-login-flow]
  affects: [src/proxy.ts, "src/app/(ig-studio)"]
tech_stack:
  added: [Web Crypto SHA-256 (global, no dep), useActionState (React 19)]
  patterns: [edge-safe cookie auth, custom proxy.ts branching before next-intl]
key_files:
  created:
    - src/lib/ig-studio/auth.ts
    - "src/app/(ig-studio)/layout.tsx"
    - "src/app/(ig-studio)/ig-studio/login/actions.ts"
    - "src/app/(ig-studio)/ig-studio/login/page.tsx"
    - "src/app/(ig-studio)/ig-studio/page.tsx"
  modified:
    - src/proxy.ts
decisions:
  - "Web Crypto SHA-256 (no extra dep) for cookie token — edge + Node compatible"
  - "proxy.ts early-exit for /ig-studio prevents next-intl locale rewrite"
  - "logout() uses cookies().delete — no iron-session, no database needed"
metrics:
  duration: "~25 min"
  completed: "2026-06-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 1
requirements_closed: [REVIEW-01, REVIEW-06]
---

# Phase 07 Plan 01: IG Studio Auth Shell Summary

Web-Crypto cookie auth gate + FR-only `/ig-studio` route group inside the existing Next 16 app, bypassing next-intl locale routing.

## What was built

**Auth helpers (`src/lib/ig-studio/auth.ts`):** `expectedToken()` computes SHA-256 hex of `IG_STUDIO_PASSWORD` (via `globalThis.crypto.subtle`) — same code runs on the Edge (proxy.ts) and Node (server actions/route handlers). `isValidStudioCookie()` compares the cookie. `requireStudioAuth()` dynamically imports `next/headers` for server-context use. `tokenFor()` hashes an arbitrary string (used by the login action to compare submitted password without a timing-attack risk at this scale).

**Custom proxy.ts:** Replaced the bare `createMiddleware(routing)` export with an async `proxy` function that intercepts any `/ig-studio` or `/ig-studio/*` path *before* next-intl runs. Unauthenticated requests get a `307` redirect to `/ig-studio/login`; authenticated requests pass through as-is. The existing matcher is unchanged — `/api/ig-studio/*` stays excluded from middleware.

**Route group `(ig-studio)`:** Own root layout (`<html lang="fr">`, `robots: noindex`) — mirrors the `(studio)` pattern. Login page is a `'use client'` form using React 19's `useActionState`. Server action `login()` verifies password, sets `httpOnly sameSite=lax` cookie (7 days, path `/ig-studio`), redirects. Server action `logout()` deletes the cookie and redirects. Landing page `page.tsx` is a placeholder shell that calls `requireStudioAuth()` for defence-in-depth (Phase 07-03 replaces its body with the gallery).

## Verification results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` — no errors | PASS |
| `/ig-studio` (no cookie) → 307 | PASS |
| `/ig-studio/login` → 200 | PASS |
| Password in `.env.local` — not committed | PASS |

## Deviations from Plan

**[Rule 3 - Blocking] Bypassed `npm run dev` for verification**
- **Found during:** Task 2 verify
- **Issue:** The `predev` npm hook runs `sanity schema extract` which fails when `sanity.config.ts` is absent (pre-existing issue, out of scope). The hook caused `npm run dev` to exit 1 before Next started.
- **Fix:** Ran `npx next dev` directly to bypass the hook. The app itself compiles and runs correctly.
- **Files modified:** none (did not modify package.json — out of scope)

## Known Stubs

- `src/app/(ig-studio)/ig-studio/page.tsx` — landing page body shows "Galerie à venir — Phase 07-03". Intentional placeholder; Phase 07-03 will mount the full gallery component here.

## Self-Check: PASSED

Files verified present:
- src/lib/ig-studio/auth.ts — FOUND
- src/proxy.ts — FOUND (modified)
- src/app/(ig-studio)/layout.tsx — FOUND
- src/app/(ig-studio)/ig-studio/login/actions.ts — FOUND
- src/app/(ig-studio)/ig-studio/login/page.tsx — FOUND
- src/app/(ig-studio)/ig-studio/page.tsx — FOUND

Commits verified: 27623dc, 07f529f
