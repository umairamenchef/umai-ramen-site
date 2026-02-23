# Phase 2: Content Pages - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Build all visitor-facing content pages: homepage (accueil), menu, reservation, commander (ordering), notre histoire, infos, and gallery. Each page pulls content from Sanity CMS with trilingual support. Reserve/order CTAs connect visitors to Gusty and Uber Eats. No user accounts, no on-site ordering — external platform links only.

</domain>

<decisions>
## Implementation Decisions

### Homepage hero & vibe
- Fullscreen hero with a single fixed photo (next/image priority, rgba overlay for text readability) — no slider, no gradient, no video
- Catchphrase ("Nouilles fraiches. Bouillons maison.") centered on hero with DM Serif Display, large, white text with subtle text-shadow
- Two CTA buttons on hero: "Reserver" (primary, vert accent fill) and "Commander" (secondary, outlined white) — side by side on desktop, stacked on mobile
- Below the fold: menu preview cards → USP blocks → Notre Histoire teaser → gallery section → social section — generous whitespace between sections (py-20+)
- Menu preview: 3 visual cards with photo backgrounds, category name overlay, linking to /menu with anchored category sections
- USP section: 3 proof blocks in dotted border cards, centered text, line-art icons above each
- Notre Histoire teaser: horizontal split (photo left, text right on desktop, stacked on mobile) with CTA to /notre-histoire
- Gallery section: 4-6 photo thumbnails in a responsive grid, "Voir toute la galerie" link to /galerie
- Social section: Instagram handle + branded hashtag, minimal — not a feed embed

### Menu presentation
- Category-based layout with sticky sub-navigation scrolling to sections
- Each menu item as a clean row/card: FR name (DM Serif Display, bold) + JP name (Noto Sans JP, smaller, muted vert accent) + price right-aligned (Outfit, tabular nums) + description below in Outfit
- Dietary badges as small pill-shaped tags (vegetarian green, gluten-free amber) inline after the item name
- Extras displayed as compact grid cards (2-3 columns) with name + price, no descriptions needed
- Formules (Menu Gyoza, Menu Enfant) in a distinct highlighted section with dotted border, showing included items
- Availability toggle: items with `available: false` in Sanity simply don't render — no "sold out" label, they vanish
- eazee-link CTA at bottom of menu page as a secondary outlined button

### Story & gallery feel
- Notre Histoire: 4 scroll sections alternating photo-text layout (photo left/text right, then photo right/text left)
- Framer Motion fade-in-up on viewport entry — subtle, 0.6s duration, staggered 0.1s per element — not dramatic or bouncy
- Each section has a Sanity-editable photo + narrative paragraph, DM Serif Display heading, Outfit body
- Final section ends with a reservation CTA button linking to /reservation
- Gallery page: CSS grid (uniform aspect ratio, not masonry) — cleaner, more controlled, fits the refined brand
- Lightbox: overlay with dark backdrop, image centered, left/right arrows, keyboard nav (arrow keys + Escape), swipe on mobile
- Images via Sanity CDN with WebP auto-conversion and responsive srcSet

### CTA hierarchy
- "Reserver" is always primary (vert accent #77967A fill, white text) — this is the main conversion action
- "Commander" is always secondary (outlined, vert accent border + text) — important but second priority
- Header sticky CTAs: both visible on desktop, only icons on mobile (mobile sticky bar handles full CTAs)
- Mobile sticky bottom bar: two equal-width buttons, "Reserver" left (filled), "Commander" right (outlined)
- Reservation page: large prominent Gusty CTA button + micro-copy ("Gratuit, sans commission")
- Commander page: 3 options presented as cards — Uber Eats (with badge/logo), Gusty Click & Collect, eazee-link — each with icon, description, and external link button
- All external links open in new tab with rel="noopener noreferrer"

### Claude's Discretion
- All areas above reflect Claude's best judgment — user trusts implementation decisions
- Exact spacing values, animation easing curves, responsive breakpoint fine-tuning
- Loading skeleton designs for Sanity content
- Error/empty states for each page
- Google Maps embed styling and lazy-loading approach on reservation/infos pages
- FAQ section layout on infos page (accordion vs flat list)
- Exact seigaiha pattern placement and density per page

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all visual and interaction decisions for this phase. Brand identity (ivoire #F5F0E8, vert #77967A, DM Serif Display, Outfit, Noto Sans JP, seigaiha patterns, dotted borders, line-art icons) should guide all design choices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-content-pages*
*Context gathered: 2026-02-23*
