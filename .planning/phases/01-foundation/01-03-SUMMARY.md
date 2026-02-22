---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [tailwind-css-4, next-font, motion, design-system, layout, header, footer, mobile]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 16 scaffold with next-intl v4 trilingual routing
provides:
  - Tailwind @theme tokens for UMAI colors (ivoire #F5F0E8, vert accent #77967A) and fonts
  - Self-hosted DM Serif Display, Outfit, Noto Sans JP via next/font (zero CLS)
  - LazyMotion MotionProvider wrapper (domAnimation, 4.6kb bundle)
  - Sticky header with logo center, nav left, CTA buttons right on desktop
  - Mobile hamburger slide-in menu with AnimatePresence animation
  - Fixed mobile bottom bar with Reserve/Order CTAs (hidden on desktop)
  - 4-column footer with SeigahaPattern decoration
  - Button, SectionHeader, SeigahaPattern, LanguageSwitcher UI primitives
affects:
  - 02 (all page phases — layout shell wraps every page)
  - 02-01 (homepage — hero, CTAs, SectionHeader usage)
  - 02-03 (menu page — SectionHeader, Button patterns)
  - 02-05 (infos page — layout uses MobileBar)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tailwind 4 @theme block with UMAI color/font/layout design tokens
    - "@theme inline for next/font CSS variable passthrough (prevents Tailwind purging font utilities)"
    - LazyMotion pattern with domAnimation for tree-shaken motion bundle
    - motion/react AnimatePresence + m.nav for slide-in mobile menu animation
    - Self-hosted fonts via next/font Google — DM Serif Display and Outfit preloaded, Noto Sans JP lazy
    - SeigahaPattern as data URI SVG background-image (no external asset)
    - MobileBar as server component using useTranslations (next-intl supports RSC)
    - Button component with href/external props (renders as <a> or <Link> or <button>)

key-files:
  created:
    - src/components/layout/MotionProvider.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/MobileMenu.tsx
    - src/components/layout/MobileBar.tsx
    - src/components/layout/Footer.tsx
    - src/components/ui/Button.tsx
    - src/components/ui/SectionHeader.tsx
    - src/components/ui/SeigahaPattern.tsx
    - src/components/ui/LanguageSwitcher.tsx
  modified:
    - src/app/globals.css
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json
    - src/sanity/schemaTypes/siteSettings.ts

key-decisions:
  - "motion/react exports m namespace directly (not motion/react-m) — m.nav used for AnimatePresence slide-in"
  - "@theme inline block required in Tailwind 4 to prevent purging font utilities set by next/font at runtime"
  - "Noto Sans JP preload: false — decorative only, lazy-load to protect LCP score"
  - "SeigahaPattern uses data URI SVG to avoid external asset dependency"
  - "MobileBar is a server component — next-intl useTranslations works in RSC, no 'use client' needed"

patterns-established:
  - "Layout pattern: Header + main + Footer + MobileBar all within MotionProvider in locale layout"
  - "Button component pattern: variant prop (primary/outline) + optional href/external for link rendering"
  - "SectionHeader pattern: DM Serif Display title + optional JP micro-label above (enforces 1 decorative per section)"
  - "Footer pattern: dark bg-umai-black, 4-column grid, SeigahaPattern in bottom-right corner"

requirements-completed: [DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, LAYT-01, LAYT-02, LAYT-03, LAYT-04, LAYT-05]

# Metrics
duration: 20min
completed: 2026-02-22
---

# Phase 1 Plan 03: Design System and Layout Components Summary

**Tailwind 4 @theme design tokens (ivoire/vert palette), self-hosted DM Serif Display + Outfit + Noto Sans JP, LazyMotion provider, sticky Header with 3-section layout, slide-in MobileMenu, fixed MobileBar, 4-column Footer with seigaiha pattern, and reusable Button/SectionHeader/SeigahaPattern/LanguageSwitcher primitives**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-02-22T23:06:02Z
- **Completed:** 2026-02-22T23:26:00Z
- **Tasks:** 2 of 3 (Task 3 is checkpoint: human visual verification)
- **Files modified:** 13

## Accomplishments

- Full UMAI design token system via Tailwind 4 @theme — ivoire background (#F5F0E8), vert accent (#77967A), 10 color tokens, 3 font tokens, max-width and section spacing variables
- Three self-hosted fonts configured via next/font (zero CLS): DM Serif Display (headings), Outfit (body, preloaded), Noto Sans JP (decorative, lazy-loaded to protect LCP)
- LazyMotion provider reduces animation bundle from ~34kb to ~4.6kb using domAnimation features
- Complete layout shell: sticky header (desktop nav/logo/CTAs), slide-in mobile menu (AnimatePresence), fixed mobile bottom bar, 4-column dark footer
- Reusable UI primitives: Button (primary/outline), SectionHeader (with optional JP label), SeigahaPattern (SVG data URI), LanguageSwitcher (cycles FR/EN/DE)

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Tailwind @theme tokens, self-hosted fonts, and LazyMotion provider** - `da2fde0` (feat)
2. **Task 2: Build Header, MobileMenu, MobileBar, Footer, and decorative UI components** - `4c3df08` (feat)
3. **Task 3: Visual verification of design system and layout components** - awaiting human verification

## Files Created/Modified

- `src/app/globals.css` - Full @theme token block (colors, fonts, layout vars) + @theme inline for next/font passthrough + @layer base styles
- `src/app/[locale]/layout.tsx` - Font imports via next/font, font variable classNames on html, Header/Footer/MobileBar inside MotionProvider
- `src/app/[locale]/page.tsx` - Updated placeholder showcasing SectionHeader and Button components
- `src/components/layout/MotionProvider.tsx` - LazyMotion wrapper with domAnimation features
- `src/components/layout/Header.tsx` - Sticky header: desktop 3-section (nav/logo/CTAs), mobile (logo/hamburger)
- `src/components/layout/MobileMenu.tsx` - Full-screen slide-in nav with AnimatePresence m.nav
- `src/components/layout/MobileBar.tsx` - Fixed bottom bar Reserve/Order CTAs, hidden md and above
- `src/components/layout/Footer.tsx` - bg-umai-black 4-column footer with SeigahaPattern decoration
- `src/components/ui/Button.tsx` - primary/outline variants, href/external rendering, min-h-[44px]
- `src/components/ui/SectionHeader.tsx` - DM Serif Display title with optional JP micro-label and dotted divider
- `src/components/ui/SeigahaPattern.tsx` - SVG wave pattern as data URI background, configurable color/opacity
- `src/components/ui/LanguageSwitcher.tsx` - FR/EN/DE locale switcher using useRouter.replace()
- `src/messages/fr.json` - Added nav translations (menu, history, infos, gallery)
- `src/messages/en.json` - Added nav translations
- `src/messages/de.json` - Added nav translations

## Decisions Made

- Used `import { m } from 'motion/react'` not `motion/react-m` — the named `m` export exists on `motion/react` as a namespace of animated HTML elements (confirmed via package inspection)
- Noto Sans JP configured with `preload: false` as it is decorative-only text — avoids unnecessary LCP impact
- SeigahaPattern renders as an absolutely-positioned `div` with data URI SVG background (no asset file required)
- MobileBar implemented as a server component — next-intl's `useTranslations` works in RSC per next-intl v4 design
- Footer social links hardcoded (Instagram @umai_ramen_strasbourg, Facebook URL) — will be moved to Sanity siteSettings in Phase 3

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed deprecated `__experimental_actions` in siteSettings.ts**
- **Found during:** Task 1 (build verification)
- **Issue:** `__experimental_actions: ['update', 'publish']` in siteSettings.ts caused TypeScript error — property doesn't exist in Sanity v5 type definitions
- **Fix:** Removed the deprecated property. The schema still works; singleton enforcement can be done in studio config
- **Files modified:** `src/sanity/schemaTypes/siteSettings.ts`
- **Verification:** TypeScript check and `next build` pass with zero errors
- **Committed in:** `da2fde0` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug from prior plan)
**Impact on plan:** Bug was blocking build verification. Fix is correct for Sanity v5. No scope creep.

## Issues Encountered

- Turbopack build produced intermittent `ENOENT .tmp` errors — resolved by clearing `.next` directory and waiting briefly (WSL2 filesystem timing issue)
- `m` import from `motion/react-m` failed — `motion/react-m` exports individual HTML element factories (e.g., `div`, `nav`) not a namespace. Using `m` from `motion/react` is correct. Linter auto-corrected the import; confirmed `m` export exists in `motion/react`.

## User Setup Required

None - no external service configuration required at this stage.

## Next Phase Readiness

- Complete UMAI design shell is visible at `http://localhost:3000/fr` — Header, Footer, MobileBar, fonts, colors all rendered
- All design tokens available as Tailwind utilities: `bg-umai-bg`, `text-umai-accent`, `font-display`, `font-body`, `font-jp`, etc.
- Layout components wrap every page — Phase 2 page assembly is pure content, no layout work needed
- Awaiting Task 3: human visual verification of brand identity correctness

---
*Phase: 01-foundation*
*Completed: 2026-02-22*

## Self-Check: PASSED

All required files verified present. All task commits verified in git history:
- `da2fde0` - Task 1: Tailwind @theme tokens, fonts, MotionProvider
- `4c3df08` - Task 2: Header, Footer, MobileMenu, MobileBar, UI components
