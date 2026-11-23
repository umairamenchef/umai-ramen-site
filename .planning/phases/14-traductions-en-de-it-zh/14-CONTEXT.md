# Phase 14: Traductions EN/DE/IT/ZH - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning (after Phases 12 + 13)
**Mode:** Autonomous (EK, 2026-11-23: « Avance en autonome jusqu'à livraison déployé ») — EK locks: Claude translates, simplified Chinese only, native review optional later.

<domain>
## Phase Boundary

Fill every translatable menu text in Sanity — item names, descriptions, subgroups, price-variant labels, category names/descriptions/footnotes — in **EN, DE, IT and ZH (simplified)**, keeping Japanese dish names, and export a review sheet for native speakers. UI strings (message files) are Phase 13; this phase only checks they read well next to the content. No new UI.

</domain>

<decisions>
## Implementation Decisions

### Source & write path
- Translate from Phase 12's structured transcription `scripts/menu-2026/menu-2026.json` (add `en`, `de`, `it`, `zh` next to every `fr`), so the JSON stays the single reviewable source.
- Write to Sanity production with **field-level patches** (`set` on `name.en`, `name.de`, `name.it`, `name.zh`, `description.*`, …) on the `m26-*` documents — do not `createOrReplace` (would clobber Studio edits made since Phase 12). Take a fresh JSON backup of the `m26-*` docs before writing (same backup folder pattern as Phase 12). Dry-run first.
- A completeness check (script) fails if any `available` 2026 item/category has an empty `en|de|it|zh` for a field whose `fr` is set.

### Translation rules
- **Japanese dish names stay as printed** in every language (Tantan Ramen, Yasai Ramen, Tantan Mazesoba, Tantan Tsukemen, Yuzu/Tokyo/Wantan/Miso Ramen, Karaage, Gyozas, Takoyaki, Edamame, Mazesoba, Udon, Little Tokyo, Mini Ramen, Ramune, Highball, Hachiko, Natsu, Sakura Blossom…). The translated **description explains the dish in a few words** (what it is + key ingredients).
- **ZH names:** keep the romanized name and append the common Chinese name in full-width parentheses when a natural equivalent exists — e.g. `Tantan Ramen（担担拉面）`, `Karaage（日式炸鸡）`, `Gyozas（煎饺）`, `Takoyaki（章鱼小丸子）`, `Edamame（盐水毛豆）`, `Udon（乌冬面）`, `Mazesoba（日式拌面）`, `Tsukemen（蘸面）`, `Miso Ramen（味噌拉面）`. French-named items get a full Chinese translation (the FR name stays visible as the secondary line from Phase 13).
- **French-named items** (Oeuf mariné entier, Oeuf onsen, Chashu de porc/poulet, Café ou thé gourmand, Duo de mochis glacés, Tiramisu matcha, Tiramisu framboise & litchi, Boule de glace au choix, Sirop à l'eau, Thé glacé pêche, Thé noir glacé au litchi, Yuzu maison, Café expresso / Double expresso / Café au lait, Thés verts japonais, Infusions, Japanese Coffee…) are translated naturally per language.
- **Brands/proper names unchanged:** Asahi, Coedo IPA, Lisbeth, Coca-Cola, Toki, Nikka from the Barrel, The Chita, Hibiki, Yamazaki, Ryoma, Kiyomi, Zaku, Kinrei, Fu, Jidai okure, Junmaishu, Atelier du saké, Sperry, Naturalys Gérard Bertrand, Année Lumière / Domaine Le Clos des Lumières, Grand jasmin Chun Feng, Fleur de Geisha, Moulin de Sarralbe.
- **Glossary (keep consistent across items):** pak-choï → EN bok choy / DE Pak Choi / IT pak choi / ZH 小白菜; daikon → daikon (radish) / Rettich (Daikon) / daikon / 白萝卜; cébette → spring onion / Frühlingszwiebel / cipollotto / 葱花; œuf mariné → marinated egg / mariniertes Ei / uovo marinato / 溏心蛋; œuf onsen → onsen egg (slow-cooked) / Onsen-Ei / uovo onsen / 温泉蛋; chashu → chashu (braised pork/chicken) / Chashu / chashu / 叉烧; tofu teriyaki → teriyaki tofu; bœuf haché aux cinq épices → five-spice minced beef / Hackfleisch mit Fünf-Gewürze / manzo macinato alle cinque spezie / 五香牛肉末; huile de piment → chili oil / Chiliöl / olio al peperoncino / 辣油; pâte de sésame → sesame paste / Sesampaste / pasta di sesamo / 芝麻酱; bouillon tsuyu → tsuyu broth / Tsuyu-Brühe / brodo tsuyu / 日式酱油汤底; nouilles de blé → wheat noodles.
- Tone: short, appetising, menu-style; no marketing additions; keep the print's meaning (no invented ingredients). Allergen claims are never added.
- Numbers/sizes/prices never translated in content (units come from Phase 13 message keys).
- ZH column is flagged « à relire » everywhere it is surfaced to EK.

### Review sheet (TRANS-03)
- Script `scripts/menu-2026/export-review-sheet.mjs` regenerates from **Sanity** (not from the JSON) → `14-REVIEW-SHEET.csv` (UTF-8 with BOM so Excel shows Chinese) in the phase folder: columns `Catégorie | Champ | FR | EN | DE | IT | ZH (à relire)`, one row per translatable field, print order.
- Also produce an `.xlsx` version if trivial (optional); the CSV is the contract. Re-running after native corrections (applied in Studio) must reproduce the sheet.

### Verification
- Live check on `umai-ramen.fr/{en,de,it,zh}/menu`: no French text other than the intentional secondary FR name (spot-check every category); Chinese renders (no tofu); Japanese names unchanged.

### Claude's Discretion
- Exact wording per language within the rules above; whether to translate category footnotes word-for-word or idiomatically; script structure.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/phases/12-synchronisation-menu-print-2026-sanity/12-CONTEXT.md` + SUMMARYs — JSON schema, IDs, sync script, backup/rollback pattern
- `.planning/phases/13-fondations-multilingues-page-menu-touriste/13-CONTEXT.md` + SUMMARYs — rendering rules (primary/secondary name), message keys
- `scripts/menu-2026/menu-2026.json`, `scripts/menu-2026/*.mjs`
- `.planning/sources/menu-2026/*` — the print (meaning reference)

</canonical_refs>

<deferred>
## Deferred Ideas

- Native-speaker review and its corrections (EK, later — the sheet makes it possible).
- Traditional Chinese.

</deferred>

---

*Phase: 14-traductions-en-de-it-zh*
*Context gathered: 2026-11-23 (autonomous)*
