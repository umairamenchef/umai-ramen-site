# UMAÏ RAMEN — Cahier des Charges Final
## Refonte Site Web 2026 — Version consolidée

**Date :** 22 février 2026
**Statut :** Prêt pour développement
**Stack cible :** Next.js 14+ (App Router) — Claude Code / GSD
**URL actuelle :** https://umai-ramen.fr/

---

## SOMMAIRE

1. Contexte & objectif
2. Décisions validées
3. Design System UMAÏ
4. Architecture des pages
5. Contenu & copywriting
6. Stratégie photo
7. Intégrations techniques
8. Spécifications développement
9. Prompt Claude Code (prêt à coller)
10. Checklist livraison
11. Questions ouvertes restantes

---

## 1. CONTEXTE & OBJECTIF

UMAÏ Ramen est un ramen noodle bar artisanal situé au **5 rue des Orphelins, Strasbourg**. Le site actuel (one-page Gulp/Nunjucks) est inchangé depuis ~3 ans. L'objectif 2026 est triple :

- **Marque** — Ancrer UMAÏ comme marque premium à Strasbourg, pas juste un "site menu"
- **Conversion** — Réserver (Gusty) et Commander (Uber Eats + nouveaux prestataires) en 1 clic
- **Qualité** — SEO local, performance, mobile-first, photos professionnelles Nis&For

### Ce qu'on retire
- Obypay (remplacé par Gusty Click & Collect)
- Backgrounds décoratifs bleu/jaune/violet
- Menu HTML statique obsolète
- Liens morts (Newsletter, Blog, Privacy, Cookie non fonctionnels)

### Ce qu'on conserve
- Logo UMAÏ (SVG existant, identité reconnue)
- Lien vers eazee-link (menu digital QR)
- Lien vers Uber Eats (livraison — URL confirmée)
- Réseaux : Instagram (@umai_ramen_strasbourg) + Facebook
- Google Analytics (migration GA4 via GTM)

### Ce qu'on ajoute
- Sanity CMS v3 (studio visuel pour éditer menu, textes, images, horaires, liens — free tier)
- Gusty réservation (URL confirmée) + Click & Collect (URL à obtenir)
- Internationalisation FR / EN / DE (next-intl)
- SEO local enrichi (JSON-LD, hreflang, mots-clés Krutenau)
- Cookie consent RGPD

---

## 2. DÉCISIONS VALIDÉES

| Question | Décision |
|----------|----------|
| **Hero** | P0 = image fixe (bol OU salle), P1 = A/B test si volume, P2 = slider (à éviter) |
| **Fond UI** | Ivoire léger (cohérent menu papier, chaleureux) |
| **Éléments décoratifs** | Tous retenus : seigaiha, pointillés, line-art, caractères JP (règle : 1 max par section) |
| **Palette accent** | Vert UMAÏ `#77967A` ✅ (source print confirmée — ajustable via Sanity `siteSettings.accentColor`) |
| **Stack** | Next.js 14+ App Router + Tailwind + Framer Motion |
| **Style photo principal** | 70% studio clair / 30% lifestyle-cuisine |
| **Horaires** | Lun–Sam 12h00–22h30 (continu) · Dim 12h00–14h30 & 19h00–22h30 (source: Instagram + Gusty — ⚠️ à confirmer en interne) |
| **Téléphone** | `09 52 34 34 38` / `+33 9 52 34 34 38` (4 sources concordantes : site, PagesJaunes, Gusty, TripAdvisor) |
| **URL Gusty** | `https://gusty.app/booking/1667924751880x258346136410259460?source=SITE` ✅ |
| **URL Uber Eats** | `https://www.ubereats.com/fr/store/umai-ramen/8yLiOMdPVTudC_Pgbe209g` ✅ |
| **Prestataires commande** | Réservation : Gusty · Click & Collect : Gusty (à activer côté gestion) · Livraison : Uber Eats · Obypay : supprimé |
| **TikTok** | P0 = ne pas afficher (aucun compte vérifié — ajouter en P1 si handle confirmé) |
| **Multi-langue** | FR / EN / DE — i18n extensible, routing `/{locale}/...` |
| **Blog** | P0 = pas de blog · P1 = page Actus ultra-légère si besoin |
| **Newsletter** | P0 = pas de newsletter · P1 = Brevo/Mailchimp + double opt-in si besoin marketing |
| **Catchphrase hero** | 3 finalistes : (1) RAMEN ARTISANAL — STRASBOURG · (2) NOUILLES FRAÎCHES. BOUILLONS MAISON. · (3) L'ESSENTIEL DU RAMEN JAPONAIS. (⚠️ choix final à valider) |
| **Texte Notre Histoire** | Draft IA (4 blocs : Passion / Fait-maison / Local / Expérience) → validation interne |
| **Vert source** | `#77967A` ✅ confirmé (source print) — `accentHover` dérivé 1 cran plus sombre — ajustable à tout moment via Sanity Studio |
| **CMS** | Sanity v3 (free tier) — studio visuel embarqué à `/studio`, ISR 60s, i18n natif, crop/hotspot images |
| **Facebook** | `https://www.facebook.com/UmaiRamenStrasbourg/` ✅ |

---

## 3. DESIGN SYSTEM UMAÏ

### 3.1 Palette de couleurs (Design Tokens)

```
// Fondations
--umai-bg:           #F5F0E8     // Ivoire léger (fond principal)
--umai-bg-alt:       #EDE8DC     // Ivoire plus soutenu (sections alternées)
--umai-text:         #1A1A1A     // Noir doux (texte principal)
--umai-text-muted:   #6B6B6B     // Gris moyen (texte secondaire, descriptions)
--umai-accent:       #77967A     // Vert UMAÏ ✅ confirmé (source print — ajustable via Sanity siteSettings.accentColor)
--umai-accent-hover: #657D67     // Vert UMAÏ assombri (hover)
--umai-line:         #D4CFC5     // Gris chaud clair (séparateurs, bordures)
--umai-line-dotted:  #C5BFB3     // Gris pour bordures pointillées
--umai-white:        #FFFFFF     // Blanc pur (cards, overlays)
--umai-black:        #0A0A0A     // Noir profond (boutons primaires)
```

**Règle absolue :** Un seul accent. Le vert `#77967A` est utilisé pour les titres de section, les badges (végétarien/sans gluten), les labels d'info boxes, et les micro-accents. Jamais pour du texte courant, jamais pour des fonds larges. Ajustable via Sanity Studio (`siteSettings.accentColor`).

### 3.2 Typographie

Deux familles maximum + une JP :

```
// Titres & headers
font-display: "DM Serif Display", serif
  → Élégant, editorial, MAJ avec letter-spacing: 0.08em
  → Tailles : H1 = clamp(2.5rem, 5vw, 4.5rem) / H2 = clamp(2rem, 4vw, 3.5rem)

// Corps & UI
font-body: "Outfit", sans-serif
  → Géométrique, moderne, très lisible en petit
  → Tailles : body = 1rem (16px) / small = 0.875rem

// Japonais (accents décoratifs)
font-jp: "Noto Sans JP", sans-serif
  → weight: 300-400 uniquement
  → Utilisé en micro-label vertical ou inline, JAMAIS comme police principale
```

**Règles typographiques :**
- Titres en MAJUSCULES avec letter-spacing généreux
- Pas de gras excessif (regular + semibold max)
- Caractères japonais = 5% max du contenu visible, toujours en secondaire

### 3.3 Éléments décoratifs (traduits du menu print)

#### Motif Seigaiha (vagues)
- SVG pattern répétitif, trait noir fin
- Opacité : 3-6% maximum
- Usage : coin du hero (bas-droite), fond de footer, jamais plein écran
- Ne jamais superposer avec une photo

#### Cadres/Séparateurs pointillés
- `border: 1px dashed var(--umai-line-dotted)`
- Usage : encadrés info (allergènes, fait maison, horaires), séparation de sections menu
- Espacement intérieur généreux (padding: 24px+)

#### Icônes line-art
- Trait noir fin (1.5-2px stroke), style cohérent avec le menu print
- Sujets : bol de ramen, gyoza, baguettes, vapeur, vagues
- Usage : à côté des titres de section (1 par section max), jamais en cluster
- Format : SVG inline, couleur `currentColor`

#### Caractères japonais décoratifs
- Katakana/kanji en micro-labels verticaux (rotation 90°)
- Positionnement : marge latérale, à côté d'un titre de section
- Taille : petite (0.75rem), opacité 40-60%
- Maximum 1 par viewport visible (pas d'accumulation)

#### ⚠️ Règle anti-patchwork : 1 décor maximum par section
Chaque section du site utilise AU PLUS UN élément décoratif parmi :
- seigaiha OU pointillés OU icône line-art OU label JP
- JAMAIS 2+ ensemble dans la même section (sinon effet "menu imprimé scanné")
- Les photos comptent comme l'élément principal — si une section est photo-heavy, zéro décor

#### Usage de la serif (DM Serif Display)
- UNIQUEMENT sur H1 et H2 (titres de page et titres de section)
- JAMAIS sur H3, H4, labels, boutons, nav, ou toute UI dense
- Le site doit rester "moderne" — la serif est un accent typographique, pas la voix principale

### 3.4 Composants UI

#### SectionHeader
```
┌─────────────────────────────────┐
│  ラ   RAMEN PAITAN              │
│  ー   ────────── ·              │
│  メ   Riche et crémeux    🍜   │
│  ン                             │
└─────────────────────────────────┘
→ Titre MAJ (DM Serif Display)
→ Ligne pointillée dessous
→ Sous-titre en Outfit regular
→ Micro-label JP vertical (optionnel, gauche)
→ Icône line-art (optionnel, droite)
```

#### InfoBox
```
┌ · · · · · · · · · · · · · · · ┐
·  🌿 VÉGÉTARIEN                  ·
·  Nos plats végétariens sont     ·
·  préparés sans bouillon animal  ·
└ · · · · · · · · · · · · · · · ┘
→ Bordure pointillée
→ Label vert UMAÏ en haut
→ Contenu texte noir
→ Padding généreux
```

#### Buttons
```
[   RÉSERVER   ]     →  Fond noir #0A0A0A, texte blanc, hover: vert accent
[   Commander  ]     →  Outline noir, texte noir, hover: fond noir + texte blanc
    Voir le menu →   →  Texte + flèche, style lien, hover: underline
```

#### MenuItemCard
```
┌──────────────────────────────────────┐
│  MISO RAMEN  味噌ラーメン    14,50€ │
│  ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ │
│  Bouillon à base de miso rouge,     │
│  chashu de porc, demi-oeuf,         │
│  pousses de soja, pois gourmand     │
│  & ciboulette                       │
│                          🌿         │
└──────────────────────────────────────┘
→ Nom en semi-bold + JP en gris muted + prix aligné droite
→ Séparateur pointillé fin
→ Description en regular, taille réduite
→ Badges végétarien/sans gluten en bas-droite
```

#### StickyBar (mobile + desktop)
```
Fixé en bas de l'écran (mobile) ou dans le header (desktop) :
[ RÉSERVER (Gusty) ]  [ COMMANDER (Uber Eats) ]
```

### 3.5 Layout & grille

- Max-width contenu : `1200px` (centré)
- Desktop : 12 colonnes, gouttière 24px
- Tablet : 8 colonnes
- Mobile : 4 colonnes, contenu pleine largeur avec padding 20px
- Whitespace entre sections : `clamp(80px, 10vw, 160px)`
- **Règle Ma 間 :** L'espace vide EST l'identité. Ne jamais "remplir" un espace juste parce qu'il est vide.

---

## 4. ARCHITECTURE DES PAGES

### 4.1 Page Accueil `/`

```
[HEADER STICKY]
  Logo UMAÏ (centre) | Nav (gauche) | Réserver + Commander (droite)

[HERO — fullscreen]
  P0 : Image fixe unique (bol premium studio clair OU salle + logo — à choisir après sélection photos)
  P1 : A/B test entre les deux (si outil analytics et volume suffisant)
  <!-- P2 (NON RECOMMANDÉ, hors scope P0) : slider alternance — poids JS, impact Core Web Vitals, la plupart des visiteurs ne voient que le 1er slide -->
  Overlay sombre léger (rgba noir 35-45%) pour lisibilité texte
  PAS de gradient — photo réelle uniquement
  CTA : "Réserver" (primaire) + "Commander" (secondaire)
  Motif seigaiha très subtil en coin bas-droite

[SECTION — Notre Carte (aperçu)]
  Titre : "LA CARTE" + micro-label JP
  3 blocs visuels avec photo + titre :
    → Ramen | Mazesoba | Udon (ou top 3 catégories)
  CTA : "Découvrir le menu" → /menu

[SECTION — Preuves / USP (3 colonnes)]
  → "Nouilles fraîches maison" + photo geste cuisine
  → "Bouillons mijotés 6h+" + photo bol signature
  → "Produits 100% locaux" + photo table/salle
  Encadré pointillé autour de chaque bloc

[SECTION — Notre Histoire (teaser)]
  Photo lifestyle grande + texte court
  CTA : "En savoir plus" → /notre-histoire

[SECTION — Galerie]
  Grid responsive 6-9 photos (masonry ou grid simple)
  70% studio clair + 30% lifestyle
  Lightbox au clic

[SECTION — Social]
  Titre + lien Instagram + feed embed (6 dernières photos)
  Hashtag #umairamen

[FOOTER]
  4 colonnes :
    → Logo + baseline
    → Contact (adresse, tel, email)
    → Liens rapides (Menu, Réserver, Commander, Instagram)
    → Mentions légales, CGV, Cookies
  Motif seigaiha en fond très léger
  Icône line-art bol en décor
```

### 4.2 Page Menu `/menu`

```
[HEADER STICKY]

[HERO MENU — plus petit]
  Photo bandeau (21:9) d'un plat + titre "LA CARTE" + "MENU メニュー"

[NAV MENU (sticky sous header)]
  Entrées | Ramen Paitan | Ramen Chintan | Tsukemen | Mazesoba | Udon | Desserts

[CATÉGORIES]
  Pour chaque catégorie :
    → SectionHeader (titre FR + JP + icône line-art)
    → Photo catégorie (4:3, optionnelle)
    → Liste de MenuItemCards
    → Badges végétarien 🌿 / sans gluten

[SECTION EXTRAS]
  Grille 2 colonnes : extras + prix
  Encadré pointillé

[SECTION MENUS (formules)]
  Menu Gyoza + Menu Enfant (Little Tokyo / Mini Ramen)
  Encadré pointillé avec détails

[CTA FLOTTANT]
  "Voir le menu complet" → eazee-link (nouvel onglet)
  "Réserver" → /reservation

[INFO BOX]
  "Prix et service compris"
  "Produits locaux, nouilles et bouillons faits maison"
  "Liste allergènes disponible sur demande"
```

### 4.3 Page Réservation `/reservation`

```
[HEADER]
[HERO SIMPLE]
  Photo salle/ambiance + "RÉSERVER UNE TABLE"

[WIDGET GUSTY]
  Embed iframe Gusty OU bouton proéminent vers :
  https://gusty.app/booking/1667924751880x258346136410259460?source=SITE
  Micro-copy : "Réservation gratuite, sans commission"

[INFOS PRATIQUES]
  → 5 rue des Orphelins, 67000 Strasbourg + carte Google Maps embed
  → Horaires : Lun–Sam 12h00–22h30 · Dim 12h00–14h30 & 19h00–22h30
  → Tél : 09 52 34 34 38
  → Capacité / infos groupe
```

### 4.4 Page Commander `/commander`

```
[HEADER]
[HERO SIMPLE]
  Photo plat + "COMMANDER"

[OPTIONS]
  → Uber Eats (badge + lien externe) — "Livraison à domicile"
  → Gusty Click & Collect (CTA + lien) — "À emporter"
  → eazee-link — "Consulter le menu"

[MICRO-COPY]
  "Commandez depuis votre canapé et recevez vos ramens chez vous"
```

### 4.5 Page Notre Histoire `/notre-histoire`

```
[HEADER]
[HERO]
  Photo lifestyle grande (cuisine/équipe) + "NOTRE HISTOIRE"

[SCROLL STORYTELLING]
  Section 1 : "La passion du ramen"
    → Formation au Japon, apprentissage auprès des maîtres ramen
    → Photo cuisine/geste

  Section 2 : "Le fait maison, chaque jour"
    → Nouilles fraîches quotidiennes
    → Bouillons mijotés 6h+ pour extraire toutes les saveurs
    → Farine du moulin de Sarralbe
    → Photo process/préparation

  Section 3 : "100% local, 100% authentique"
    → Poulet alsacien, légumes locaux
    → Respect du produit selon la tradition japonaise
    → Photo ingrédients/marché

  Section 4 : "L'expérience UMAÏ"
    → L'ambiance noodle bar
    → Photo salle + logo

[CTA]
  "Venez nous rendre visite" → /reservation
```

### 4.6 Page Infos `/infos`

```
[HEADER]
[HERO SIMPLE]
  Photo salle/devanture + "INFOS PRATIQUES"

[HORAIRES]
  Lun–Sam : 12h00–22h30 (service continu)
  Dim : 12h00–14h30 & 19h00–22h30
  (⚠️ à confirmer en interne avant mise en ligne)

[ACCÈS]
  → 5 rue des Orphelins, 67000 Strasbourg (quartier Krutenau)
  → Google Maps embed
  → Accès tram : ligne X, arrêt Y (à compléter)
  → Parking le plus proche (à compléter)

[CONTACT]
  → Tél : 09 52 34 34 38
  → Instagram : @umai_ramen_strasbourg
  → Email : (à fournir ou formulaire de contact)

[FAQ]
  → Allergènes : "Liste disponible sur demande, n'hésitez pas à nous prévenir lors de votre réservation"
  → Groupes / privatisation : (à compléter)
  → Animaux : (à compléter)
  → Végétarien/vegan : "Plusieurs plats végétariens sur la carte, identifiés par 🌿"
```

### 4.7 Pages légales `/mentions-legales`
```
→ Mentions légales
→ Politique de confidentialité
→ Politique cookies (RGPD)
→ CGV
```

---

## 5. CONTENU & COPYWRITING

### 5.1 Textes à produire

| Page | Contenu nécessaire | Source | Langues |
|------|--------------------|--------|---------|
| Accueil Hero | Catchphrase (3 finalistes prêtes) | Choix à valider | FR/EN/DE |
| Accueil USP | 3 micro-textes (nouilles, bouillons, local) | Adapter texte existant | FR/EN/DE |
| Menu | Descriptions de chaque plat | Menu physique 2024 (uploadé) | FR (EN/DE P1) |
| Notre Histoire | 4 sections narratives | DNA, Zut Magazine, site actuel | FR/EN/DE |
| Infos | Horaires, FAQ, accès | Instagram + Gusty (horaires), à compléter (FAQ) | FR/EN/DE |
| Mentions légales | Textes juridiques | Template RGPD | FR (minimum légal) |
| UI/Nav | Header, footer, boutons, labels | — | FR/EN/DE |

### 5.2 Ton éditorial

- **Sobre et confiant** — pas de superlatifs ("le meilleur ramen"), pas d'exclamation
- **Court** — phrases courtes, pas de paragraphes longs
- **Trilingue FR/EN/DE** — tout le contenu visible traduit, micro-labels JP conservés tels quels
- **Factuel** — "nouilles fraîches chaque jour", "bouillons mijotés 6 heures", "farine du moulin de Sarralbe"
- **Cohérent** — même ton sobre sur les 3 langues (pas de "Willkommen!" enthousiaste si le FR est minimal)

### 5.3 Catchphrase hero — 3 finalistes (⚠️ choix final à valider)

| # | FR | EN | DE | Style |
|---|----|----|-----|-------|
| 1 | RAMEN ARTISANAL — STRASBOURG | CRAFT RAMEN — STRASBOURG | HANDGEMACHTE RAMEN — STRASSBURG | Factuel + SEO local |
| 2 | NOUILLES FRAÎCHES. BOUILLONS MAISON. | FRESH NOODLES. HOUSE-MADE BROTH. | FRISCHE NUDELN. HAUSGEMACHTE BRÜHE. | Preuves |
| 3 | L'ESSENTIEL DU RAMEN JAPONAIS. | THE ESSENCE OF JAPANESE RAMEN. | DAS WESENTLICHE DER JAPANISCHEN RAMEN. | Positionnement |

**Recommandation :** Option 2 (factuelle, différenciante, SEO-friendly). Fonctionne en hero + meta description.

### 5.4 Texte "Notre Histoire" — Process de rédaction

**Méthode :** Draft IA → validation interne → traduction EN/DE
**Structure (4 blocs, 2-3 phrases chacun + 1 preuve concrète + 1 photo lifestyle) :**

1. **La passion du ramen** — Loan Nguyen, formation au Japon, ouverture 2021 rue des Orphelins
2. **Le fait maison, chaque jour** — Nouilles fraîches (farine du moulin de Sarralbe), bouillons 6h+
3. **100% local, 100% authentique** — Poulet alsacien, légumes de saison, tradition japonaise
4. **L'expérience UMAÏ** — L'ambiance noodle bar, le quartier Krutenau, la communauté

**Sources factuelles pour la rédaction :**
- DNA (2021) : ouverture, fondatrice Loan Nguyen
- Zut Magazine : artisanal, nouilles/bouillons, adresse
- Site actuel : texte story existant (nouilles fraîches, bouillons 6h+, formée au Japon, produits locaux)
- Menu physique 2024 : mentions "fait maison", "farine du moulin de Sarralbe"

---

## 6. STRATÉGIE PHOTO NIS&FOR

### 6.1 Répartition par usage

| Usage | Quantité | Style | Ratio | Dimensions min |
|-------|----------|-------|-------|----------------|
| Hero (image fixe P0) | 1 retenue + 1 alternative (P1 A/B) | Studio clair OU Salle logo | 16:9 (desktop) + 4:5 (mobile) | 1920×1080 / 1080×1350 |
| Cards catégories menu | 5-7 | Studio clair, cohérent | 4:3 | 800×600 |
| Blocs USP accueil | 3 | 1 geste + 1 bol + 1 salle | 4:3 | 800×600 |
| Galerie | 8-12 | Mixte (70/30) | 1:1 ou 4:5 | 1200×1200 |
| Story/Histoire | 4-6 | Lifestyle dominant | 16:9 ou 4:3 | 1200×800 |
| Hero pages internes | 3-4 | Variés | 21:9 (bandeau) | 1920×600 |
| OG Image social | 1 | Le meilleur bol | 1200×630 | 1200×630 |

### 6.2 Post-production & gestion images

- **Colorimétrie unifiée** : température légèrement chaude, blancs pas froids, verts naturels (pas fluo), noirs pas bouchés
- **Upload dans Sanity** : toutes les photos HD sont uploadées dans le Sanity Content Lake (5GB free tier)
- **Crop/hotspot Sanity** : configurer le point focal (hotspot) de chaque image dans le Studio → le frontend génère automatiquement les crops par ratio (16:9, 4:5, 4:3, 1:1) sans perte de sujet
- **CDN Sanity** : les URLs d'image sont servies via le CDN Sanity avec paramètres de taille (`?w=800&h=600&fit=crop`), conversion auto WebP
- **Fallback** : pour le lancement, des images placeholder seront utilisées si les photos HD ne sont pas encore livrées — elles seront remplacées dans le Studio sans toucher au code

### 6.3 Méthode de sélection (10 minutes)

Pour chaque photo du lot final, tagger :

**Famille :** `studio-clair` | `moody` | `lifestyle`
**Usage :** `hero` | `menu` | `story` | `cta` | `social` | `galerie`
**Note /5 :**
- Lisibilité (espace négatif dispo pour du texte overlay)
- Appétence (ça donne faim)
- Identité (ça "crie Umaï")

---

## 7. INTÉGRATIONS TECHNIQUES

| Service | Rôle | URL / Mode d'intégration | Priorité |
|---------|------|--------------------------|----------|
| **Sanity v3** | CMS | Studio embarqué (`/studio`) + API GROQ + CDN images | P0 |
| **Gusty** | Réservation | `https://gusty.app/booking/1667924751880x258346136410259460?source=SITE` — CTA sticky | P0 |
| **Gusty C&C** | Click & Collect | URL dédiée à obtenir côté Gusty gestion (distincte du booking) | P0 |
| **Uber Eats** | Livraison | `https://www.ubereats.com/fr/store/umai-ramen/8yLiOMdPVTudC_Pgbe209g` — lien externe + badge | P0 |
| **eazee-link** | Menu digital QR | `https://menu.eazee-link.com/?id=GIK39GHKQZ&o=q` — lien bouton (nouvel onglet) | P0 |
| **Google Maps** | Localisation | Embed iframe (5 rue des Orphelins, 67000 Strasbourg) | P0 |
| **Instagram** | Feed social | `@umai_ramen_strasbourg` — Embed posts ou API Basic Display | P1 |
| **Google Analytics 4** | Tracking | GTM container (migrer depuis G-BG00XCD8MD) | P0 |
| **Schema.org** | SEO structuré | JSON-LD (Restaurant + Menu + LocalBusiness + FoodEstablishment) | P0 |
| **Cookie Consent** | RGPD | Banner consentement (Tarteaucitron ou similaire) | P1 |
| **next-intl** | i18n FR/EN/DE | Routing `/{locale}/...` + dictionnaires JSON | P0 |

### Coordonnées confirmées
- **Adresse :** 5 rue des Orphelins, 67000 Strasbourg
- **Téléphone :** 09 52 34 34 38 / +33 9 52 34 34 38
- **Instagram :** @umai_ramen_strasbourg
- **Facebook :** https://www.facebook.com/UmaiRamenStrasbourg/
- **Horaires (à confirmer en interne) :** Lun–Sam 12h00–22h30 (continu) · Dim 12h00–14h30 & 19h00–22h30
- **TikTok :** Non affiché en P0 (aucun compte vérifié)

### Action requise avant dev
- [ ] ~~URL Gusty widget~~ ✅ Confirmée
- [ ] ~~URL Uber Eats~~ ✅ Confirmée
- [ ] ~~Numéro de téléphone~~ ✅ Confirmé (4 sources concordantes)
- [ ] URL Gusty **Click & Collect** (demander côté Gusty gestion — souvent URL distincte du booking)
- [ ] Horaires : valider que les horaires Instagram sont toujours d'actualité
- [x] ~~Facebook~~ ✅ `https://www.facebook.com/UmaiRamenStrasbourg/`
- [ ] Cohérence NAP : aligner Google Business Profile sur les mêmes infos site + Gusty + Uber Eats

---

## 8. SPÉCIFICATIONS DÉVELOPPEMENT

### 8.1 Stack

```
Framework       : Next.js 14+ (App Router, TypeScript)
Styling         : Tailwind CSS 4
Animations      : Framer Motion
CMS             : Sanity v3 (free tier — studio visuel pour éditer menu, textes, images, liens)
i18n            : next-intl (3 locales : fr, en, de — extensible)
Images          : Sanity CDN (crop/hotspot intégré) + next/image (optimisation auto WebP/AVIF)
Fonts           : next/font (self-hosted, 0 layout shift)
SEO             : next-seo + JSON-LD manuel + hreflang
Analytics       : Google Tag Manager + GA4
Hébergement     : Vercel (gratuit ou Pro) + Sanity Studio hébergé (studio.umai-ramen.fr ou /studio)
Domaine         : umai-ramen.fr (conserver, pointer DNS vers Vercel)
```

#### Pourquoi Sanity (et pas Keystatic ou admin custom)

| Critère | Sanity | Keystatic | Admin custom |
|---------|--------|-----------|--------------|
| Édition visuelle pour non-dev | ✅ Studio complet | ⚠️ Basique | ❌ Rudimentaire |
| Images crop/hotspot | ✅ Natif | ❌ Manuel | ❌ Manuel |
| i18n champs FR/EN/DE | ✅ Natif (document-level) | ⚠️ Possible | ❌ À coder |
| Free tier suffisant | ✅ 10K docs, 5GB, 500K req/mois | ✅ Gratuit (Git) | ✅ Gratuit |
| Preview temps réel | ✅ Natif | ⚠️ Limité | ❌ Non |
| Autonomie restaurateur | ✅ UI intuitive | ⚠️ Besoin Git | ❌ Fragile |

**Le restaurateur ouvre le Studio, voit ses plats avec les photos et les prix, clique, édite, publie. Pas de code, pas de Git, pas de redéploiement.**

### 8.2 Structure projet

```
src/
├── app/
│   ├── layout.tsx              // Fonts, metadata globale
│   ├── [locale]/               // i18n routing (fr, en, de)
│   │   ├── layout.tsx          // Locale provider, header/footer
│   │   ├── page.tsx            // Accueil
│   │   ├── menu/page.tsx
│   │   ├── reservation/page.tsx
│   │   ├── commander/page.tsx
│   │   ├── notre-histoire/page.tsx
│   │   ├── infos/page.tsx
│   │   └── mentions-legales/page.tsx
│   ├── studio/[[...index]]/page.tsx  // Sanity Studio embarqué (route /studio)
│   └── middleware.ts           // Redirect / → /fr (ou détection navigateur)
├── components/
│   ├── layout/
│   │   ├── Header.tsx          // Nav sticky, logo, CTA réserver/commander
│   │   ├── Footer.tsx          // Contact, liens, motif seigaiha
│   │   ├── MobileMenu.tsx      // Menu mobile slide
│   │   └── StickyBar.tsx       // CTA mobile fixe en bas
│   ├── sections/
│   │   ├── Hero.tsx            // Image fixe plein écran (Sanity image + overlay)
│   │   ├── MenuPreview.tsx     // 3 cards aperçu catégories
│   │   ├── USPBlocks.tsx       // 3 preuves (fait maison, bouillon, local)
│   │   ├── StoryTeaser.tsx     // Teaser histoire
│   │   ├── Gallery.tsx         // Grid photos + lightbox
│   │   └── SocialFeed.tsx      // Instagram embed
│   ├── menu/
│   │   ├── MenuCategory.tsx    // Catégorie avec header + items
│   │   ├── MenuItem.tsx        // Card plat individuel
│   │   ├── MenuNav.tsx         // Nav sticky par catégorie
│   │   ├── ExtrasGrid.tsx      // Grille extras
│   │   └── MenuFormule.tsx     // Cards menus/formules
│   ├── decorative/
│   │   ├── SeigaihaPattern.tsx // SVG motif vagues
│   │   ├── DottedBorder.tsx    // Composant encadré pointillé
│   │   ├── LineArtIcon.tsx     // Icônes line-art
│   │   └── JPLabel.tsx         // Micro-label japonais vertical
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx           // Végétarien, sans gluten
│       ├── SectionHeader.tsx
│       └── InfoBox.tsx
├── sanity/
│   ├── sanity.config.ts       // Config Sanity Studio (plugins, dataset, projectId)
│   ├── sanity.cli.ts          // CLI config
│   ├── schemas/
│   │   ├── index.ts           // Export tous les schemas
│   │   ├── menuCategory.ts    // Catégorie menu (entrées, ramen paitan, etc.)
│   │   ├── menuItem.ts        // Plat individuel (nom FR/EN/DE, JP, prix, tags, image)
│   │   ├── menuExtra.ts       // Extra (nom, prix)
│   │   ├── menuFormule.ts     // Formule/menu (gyoza, enfant)
│   │   ├── page.ts            // Pages éditables (home, histoire, infos)
│   │   ├── siteSettings.ts    // Config globale (horaires, tél, adresse, URLs, réseaux)
│   │   ├── hero.ts            // Hero images + catchphrase (par page)
│   │   ├── gallery.ts         // Galerie photos
│   │   └── uspBlock.ts        // Bloc USP (titre, texte, image)
│   └── lib/
│       ├── client.ts          // Sanity client (projectId, dataset, CDN)
│       ├── queries.ts         // GROQ queries (menu, settings, pages, gallery)
│       └── image.ts           // Helper urlForImage (crop/hotspot)
├── dictionaries/
│   ├── fr.json                // Traductions UI statique (nav, boutons, labels) — le contenu vient de Sanity
│   ├── en.json
│   └── de.json
├── lib/
│   ├── seo.ts                 // Génération metadata + JSON-LD
│   ├── i18n.ts                // Config next-intl (locales, routing)
│   └── tokens.ts              // Design tokens exportés
├── styles/
│   └── globals.css            // Tailwind config + custom properties
└── public/
    ├── icons/                 // SVG line-art
    ├── patterns/              // SVG seigaiha
    ├── logo/                  // Logo UMAÏ SVG
    └── og-image.jpg           // Fallback (les images dynamiques viennent de Sanity CDN)
```

### 8.3 Sanity CMS — Schemas & flux de données

#### Architecture CMS

```
Sanity Studio (umai-ramen.fr/studio)
  ↓ édition par le restaurateur (menu, textes, images, horaires, liens)
Sanity Content Lake (cloud, CDN)
  ↓ requêtes GROQ à la build + ISR (revalidation 60s)
Next.js (pages statiques régénérées)
  ↓ rendu au visiteur
Vercel (CDN edge)
```

**Mode de rendu :** ISR (Incremental Static Regeneration) avec `revalidate: 60`. Le restaurateur publie dans le Studio → le site se met à jour en ~1 minute, sans redéploiement.

#### Schemas Sanity

**`siteSettings` (singleton) — Config globale**
```ts
{
  name: 'siteSettings',
  type: 'document',
  fields: [
    { name: 'restaurantName', type: 'string' },                    // "UMAÏ Ramen"
    { name: 'address', type: 'string' },                            // "5 rue des Orphelins, 67000 Strasbourg"
    { name: 'phone', type: 'string' },                              // "09 52 34 34 38"
    { name: 'email', type: 'string' },
    { name: 'openingHours', type: 'array', of: [{ type: 'object',  // [{day, open, close, isClosed}]
        fields: [
          { name: 'days', type: 'string' },     // "Lun–Sam"
          { name: 'hours', type: 'string' },     // "12:00–22:30"
          { name: 'note', type: 'string' },      // "service continu" (optionnel)
        ]
      }]
    },
    { name: 'gustyUrl', type: 'url' },                             // URL réservation
    { name: 'gustyClickCollectUrl', type: 'url' },                 // URL C&C
    { name: 'uberEatsUrl', type: 'url' },                          // URL livraison
    { name: 'eazeeLinkUrl', type: 'url' },                         // Menu digital
    { name: 'instagramUrl', type: 'url' },
    { name: 'facebookUrl', type: 'url' },
    { name: 'tiktokUrl', type: 'url' },                            // Optionnel (caché si vide)
    { name: 'googleMapsEmbedUrl', type: 'url' },
    { name: 'accentColor', type: 'string' },                       // Hex du vert UMAÏ
  ]
}
```

**`menuCategory` — Catégorie de plats**
```ts
{
  name: 'menuCategory',
  type: 'document',
  fields: [
    { name: 'title', type: 'internationalizedArrayString' },       // {fr, en, de}
    { name: 'titleJP', type: 'string' },                           // "前菜"
    { name: 'slug', type: 'slug' },                                // "entrees"
    { name: 'description', type: 'internationalizedArrayString' },
    { name: 'icon', type: 'string' },                              // "bowl" | "ramen" | "gyoza"
    { name: 'image', type: 'image', options: { hotspot: true } },  // Crop/hotspot intégré
    { name: 'order', type: 'number' },                             // Tri dans le menu
    { name: 'items', type: 'array', of: [{ type: 'reference', to: [{ type: 'menuItem' }] }] }
  ]
}
```

**`menuItem` — Plat individuel**
```ts
{
  name: 'menuItem',
  type: 'document',
  fields: [
    { name: 'name', type: 'internationalizedArrayString' },        // {fr, en, de}
    { name: 'nameJP', type: 'string' },                            // "味噌ラーメン"
    { name: 'description', type: 'internationalizedArrayText' },   // {fr, en, de}
    { name: 'prices', type: 'array', of: [{ type: 'object',
        fields: [
          { name: 'label', type: 'string' },    // "3pcs", "6pcs", null
          { name: 'price', type: 'number' }      // 14.50
        ]
      }]
    },
    { name: 'tags', type: 'array', of: [{ type: 'string' }],       // ["vegetarien", "sans-gluten"]
      options: { list: [
        { title: 'Végétarien', value: 'vegetarien' },
        { title: 'Sans gluten', value: 'sans-gluten' },
        { title: 'Épicé', value: 'epice' },
        { title: 'Nouveau', value: 'nouveau' },
      ]}
    },
    { name: 'image', type: 'image', options: { hotspot: true } },
    { name: 'isAvailable', type: 'boolean' },                      // Masquer temporairement un plat
  ]
}
```

**`hero` — Images et catchphrase hero**
```ts
{
  name: 'hero',
  type: 'document',
  fields: [
    { name: 'page', type: 'string' },                              // "home" | "menu" | "story"
    { name: 'image', type: 'image', options: { hotspot: true } },  // Photo + crop adaptatif
    { name: 'catchphrase', type: 'internationalizedArrayString' }, // {fr, en, de}
    { name: 'subcatchphrase', type: 'internationalizedArrayString' },
  ]
}
```

**`gallery` — Photos galerie**
```ts
{
  name: 'gallery',
  type: 'document',
  fields: [
    { name: 'images', type: 'array', of: [{ type: 'image',
        options: { hotspot: true },
        fields: [
          { name: 'alt', type: 'internationalizedArrayString' },
          { name: 'category', type: 'string' },  // "studio-clair" | "lifestyle" | "moody"
        ]
      }]
    }
  ]
}
```

**`page` — Pages éditables (Notre Histoire, Infos)**
```ts
{
  name: 'page',
  type: 'document',
  fields: [
    { name: 'slug', type: 'slug' },
    { name: 'title', type: 'internationalizedArrayString' },
    { name: 'heroImage', type: 'image', options: { hotspot: true } },
    { name: 'sections', type: 'array', of: [{ type: 'object',
        fields: [
          { name: 'title', type: 'internationalizedArrayString' },
          { name: 'body', type: 'internationalizedArrayText' },    // Bloc rich text (localisé)
          { name: 'image', type: 'image', options: { hotspot: true } },
        ]
      }]
    }
  ]
}
```

#### Requêtes GROQ (exemples)

```groq
// Menu complet (pour /menu)
*[_type == "menuCategory"] | order(order asc) {
  title, titleJP, slug, description, icon,
  "image": image.asset->url,
  items[]-> {
    name, nameJP, description, prices, tags, isAvailable,
    "image": image.asset->url
  }
}

// Settings globaux (pour layout)
*[_type == "siteSettings"][0] {
  restaurantName, address, phone, openingHours,
  gustyUrl, uberEatsUrl, eazeeLinkUrl,
  instagramUrl, facebookUrl
}

// Hero home
*[_type == "hero" && page == "home"][0] {
  "image": image.asset->url,
  catchphrase, subcatchphrase
}
```

#### Ce que le restaurateur peut éditer dans le Studio

| Contenu | Où dans le Studio | Effet sur le site |
|---------|-------------------|-------------------|
| Ajouter/modifier/supprimer un plat | Menu Items | Page /menu mise à jour |
| Changer un prix | Menu Items → prices | Page /menu mise à jour |
| Masquer un plat temporairement | Menu Items → isAvailable | Plat disparaît du site |
| Changer la photo hero | Heroes → image | Accueil mise à jour |
| Modifier les horaires | Site Settings → openingHours | /infos + footer mis à jour |
| Ajouter une photo galerie | Gallery → images | Galerie mise à jour |
| Modifier "Notre Histoire" | Pages → notre-histoire | /notre-histoire mise à jour |
| Changer l'URL Uber Eats | Site Settings → uberEatsUrl | Bouton "Commander" mis à jour |
| Modifier la catchphrase | Heroes → catchphrase | Hero mis à jour |

### 8.4 Performance

- **Lighthouse :** > 90 sur Performance, SEO, Accessibility, Best Practices
- **Core Web Vitals :** LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Images :** Sanity CDN (crop/hotspot, WebP auto, paramètres `?w=&h=&fit=`) + next/image avec `priority` sur hero, `loading="lazy"` partout ailleurs
- **Fonts :** next/font self-hosted, `display: swap`, subsetting si possible
- **Données :** ISR avec `revalidate: 60` — pages statiques régénérées à la demande, pas de requête Sanity côté client

### 8.5 SEO

- **Metadata :** title, description, Open Graph, Twitter Card sur chaque page (× 3 langues)
- **JSON-LD :** `Restaurant`, `Menu`, `LocalBusiness`, `FoodEstablishment`
- **Sitemap :** `/sitemap.xml` auto-généré (inclure les versions localisées avec `hreflang`)
- **robots.txt :** autoriser tout
- **URL canoniques :** propres, sans trailing slash, avec `hreflang` FR/EN/DE
- **Mots-clés cibles (FR) :** "ramen Strasbourg", "restaurant japonais Strasbourg", "ramen artisanal Strasbourg", "nouilles fraîches Strasbourg", "noodle bar Strasbourg", "ramen Krutenau", "ramen fait maison Strasbourg"
- **Cohérence NAP :** Nom / Adresse / Téléphone identiques sur : site, Gusty, Uber Eats, Google Business Profile, PagesJaunes, TripAdvisor

---

## 9. PROMPT CLAUDE CODE (PRÊT À COLLER)

```
Tu vas développer le site web d'UMAÏ Ramen Noodle Bar (umai-ramen.fr),
un restaurant de ramen artisanal à Strasbourg.

## Stack
Next.js 14+ (App Router) + TypeScript + Tailwind CSS 4 + Framer Motion.
CMS : Sanity v3 (studio embarqué à /studio, contenu via GROQ, images via Sanity CDN).
i18n : next-intl, 3 locales (fr, en, de), routing /{locale}/...
Déploiement Vercel.

## Brand & Design System

Palette :
- Fond principal : #F5F0E8 (ivoire léger)
- Fond alt : #EDE8DC
- Texte : #1A1A1A
- Texte muted : #6B6B6B
- Accent UNIQUE : #77967A (vert UMAÏ — titres, badges, highlights seulement — ajustable via Sanity)
- Lignes : #D4CFC5
- Bordures pointillées : #C5BFB3
- Boutons primaires : #0A0A0A

Typographie :
- Titres : "DM Serif Display" serif, MAJ, letter-spacing 0.08em
- Corps : "Outfit" sans-serif
- Japonais (accents) : "Noto Sans JP" weight 300

Éléments décoratifs (tous subtils, jamais envahissants) :
- Motif seigaiha (vagues) en SVG, opacité 3-6%, coins hero + footer
- Séparateurs/encadrés pointillés (border dashed)
- Icônes line-art noir trait fin (bol, gyoza, baguettes) — 1 par section max
- Micro-labels japonais verticaux (rotation 90°, opacity 40-60%, petits)

Layout :
- Max-width 1200px centré
- Mobile-first
- Whitespace ABONDANT (principe Ma 間)
- Les photos sont les stars, le UI s'efface

## Pages
1. / (Accueil) — Hero image fixe (photo next/image priority + overlay rgba), aperçu menu,
   3 blocs USP, teaser histoire, galerie photos, feed social, footer
2. /menu — Menu complet structuré depuis Sanity CMS (GROQ query), nav sticky par catégorie,
   filtres végétarien/sans gluten, extras, formules, CTA eazee-link
3. /reservation — Widget Gusty + infos pratiques + Google Maps
4. /commander — Uber Eats + prestataires + eazee-link
5. /notre-histoire — Scroll storytelling (Japon, fait maison, local, lieu)
6. /infos — Horaires, accès, FAQ, contact
7. /mentions-legales

## Composants clés
- Hero : IMAGE FIXE plein écran (next/image priority + overlay rgba(0,0,0,0.4)), PAS de slider, PAS de gradient
- Header sticky : logo centre, nav gauche, CTA réserver+commander droite
- StickyBar mobile : CTA fixes en bas d'écran
- SectionHeader : titre MAJ + pointillé + icône line-art + label JP optionnel
- InfoBox : encadré pointillé, label vert
- MenuItem : nom FR+JP, prix, description, badges
- PhotoGrid : masonry responsive avec lightbox
- SeigaihaPattern : SVG decoratif très subtil

## Données (Sanity CMS)
Tout le contenu éditable vient de Sanity (GROQ queries + ISR revalidate 60s) :
- menuCategory + menuItem = menu complet (catégories, plats, prix, tags, images)
- siteSettings = coordonnées, horaires, URLs prestataires :
  - Gusty réservation : https://gusty.app/booking/1667924751880x258346136410259460?source=SITE
  - Uber Eats : https://www.ubereats.com/fr/store/umai-ramen/8yLiOMdPVTudC_Pgbe209g
  - eazee-link : https://menu.eazee-link.com/?id=GIK39GHKQZ&o=q
  - Tél : 09 52 34 34 38
  - Adresse : 5 rue des Orphelins, 67000 Strasbourg
  - Instagram : @umai_ramen_strasbourg
  - Facebook : https://www.facebook.com/UmaiRamenStrasbourg/
- hero = images hero + catchphrase (par page, localisée)
- gallery = photos galerie
- page = pages éditables (notre-histoire, infos)
- dictionaries/ = JSON i18n pour UI statique (nav, boutons, labels) — PAS le contenu CMS
Images via Sanity CDN (crop/hotspot natif, URL builder pour chaque ratio).

## Performance
Lighthouse > 90 partout. next/image, next/font self-hosted, lazy loading.

## SEO
JSON-LD Restaurant + Menu + LocalBusiness.
Meta/OG/Twitter Cards sur chaque page × 3 langues.
Sitemap auto avec hreflang FR/EN/DE.
Mots-clés FR : "ramen Strasbourg", "restaurant japonais Strasbourg", "ramen Krutenau",
"noodle bar Strasbourg", "ramen fait maison Strasbourg".

## Règles absolues
- UNE seule couleur accent (vert #77967A, chargé depuis Sanity siteSettings.accentColor), jamais de 2e couleur
- Photos = centre de gravité, design = support
- Décoration subtile, jamais envahissante
- 1 DÉCOR MAX PAR SECTION (seigaiha OU pointillés OU line-art OU JP — jamais 2+)
- Japonais = 5% max du contenu visible
- DM Serif Display = H1/H2 UNIQUEMENT (jamais sur H3, nav, boutons, UI dense)
- Pas d'icon packs génériques (FontAwesome etc.)
- AUCUN gradient (ni hero, ni fonds, ni boutons) — fonds unis ou photos + overlay uniquement
- Pas d'ombres lourdes, pas de box-shadow > 2px
- Pas de textures multiples superposées
- Hero = image fixe (next/image priority) + overlay rgba — PAS de slider en P0
- Fonts via next/font (self-hosted), JAMAIS via Google Fonts CDN
```

---

## 10. CHECKLIST LIVRAISON

### Avant développement
- [ ] Photos Nis&For HD sans watermark reçues
- [ ] Sélection photos faite (hero/menu/story/galerie) avec tags
- [ ] **Photo hero unique choisie** (bol OU salle — décision P0)
- [ ] Crops produits (16:9, 4:5, 4:3, 1:1)
- [x] ~~Vert UMAÏ confirmé~~ ✅ `#77967A` (source print — ajustable via Sanity)
- [x] URL Gusty réservation confirmée
- [x] URL Uber Eats confirmée
- [ ] URL Gusty **Click & Collect** obtenue (demander côté Gusty gestion)
- [ ] Horaires validés en interne (actuellement basé sur Instagram : Lun-Sam 12h-22h30, Dim 12h-14h30 / 19h-22h30)
- [x] Numéro de téléphone confirmé : 09 52 34 34 38
- [ ] **Catchphrase hero validée** (3 finalistes prêtes — choix à faire)
- [ ] Texte "Notre Histoire" rédigé (draft IA) et validé en interne
- [ ] Dictionnaires i18n FR/EN/DE complétés (UI statique : nav, boutons, labels)
- [ ] Contenu FR saisi dans Sanity Studio (menu complet + textes + horaires + URLs)
- [ ] Photos HD uploadées dans Sanity (ou placeholders en attendant livraison Nis&For)
- [ ] URL page Facebook (pour footer)
- [ ] Cohérence NAP vérifiée (site = Gusty = Uber = Google Business)

### Développement
- [ ] Sanity project créé (projectId, dataset "production")
- [ ] Schemas Sanity déployés (menuCategory, menuItem, hero, siteSettings, gallery, page)
- [ ] Menu complet saisi dans Sanity Studio (tous les plats du menu 2024)
- [ ] Photos uploadées dans Sanity (hotspot/crop configurés par ratio)
- [ ] Toutes les pages codées et responsive (× 3 langues)
- [ ] Menu dynamique depuis Sanity (GROQ + ISR revalidate 60s)
- [ ] Header sticky + StickyBar mobile
- [ ] Intégrations Gusty (réservation + C&C) + Uber Eats + eazee-link
- [ ] i18n routing `/{locale}/...` + sélecteur de langue
- [ ] SEO JSON-LD + metadata × 3 langues + hreflang
- [ ] Cookie consent RGPD
- [ ] Google Analytics 4 (via GTM)
- [ ] Google Maps embed
- [ ] Favicon + OG image
- [ ] Sanity Studio accessible à `/studio` (auth configurée)

### Avant lancement
- [ ] Test cross-browser (Chrome, Safari, Firefox, Edge)
- [ ] Test mobile (iOS Safari, Android Chrome)
- [ ] Lighthouse audit > 90
- [ ] Vérification liens (aucun lien mort)
- [ ] Vérification traductions EN/DE (relecture humaine)
- [ ] DNS migration (pointer umai-ramen.fr vers Vercel)
- [ ] Redirections ancien site (si URLs changent)
- [ ] Google Search Console soumission sitemap (avec hreflang)
- [ ] Google Business Profile aligné (horaires, tél, adresse)

---

## 11. QUESTIONS OUVERTES — STATUT

### ✅ Résolues (12/12 traitées)

| # | Question | Statut | Valeur |
|---|----------|--------|--------|
| 1 | Horaires | ⚠️ Provisoire | Lun-Sam 12h-22h30 (continu), Dim 12h-14h30 & 19h-22h30 — **à confirmer en interne** |
| 2 | Téléphone | ✅ Confirmé | 09 52 34 34 38 (4 sources concordantes) |
| 3 | URL Gusty | ✅ Confirmé | `gusty.app/booking/...?source=SITE` |
| 4 | URL Uber Eats | ✅ Confirmé | `ubereats.com/fr/store/umai-ramen/...` |
| 5 | Prestataires | ✅ Décidé | Gusty (résa + C&C) + Uber Eats (livraison). Obypay supprimé. |
| 6 | TikTok | ✅ Décidé | P0 = non affiché. P1 si handle confirmé. |
| 7 | Multi-langue | ✅ Décidé | FR / EN / DE — i18n extensible |
| 8 | Blog | ✅ Décidé | P0 = non. P1 = page Actus légère si besoin. |
| 9 | Newsletter | ✅ Décidé | P0 = non. P1 = Brevo/Mailchimp si besoin. |
| 10 | Catchphrase | ⚠️ 3 finalistes | (1) RAMEN ARTISANAL — STRASBOURG · (2) NOUILLES FRAÎCHES. BOUILLONS MAISON. · (3) L'ESSENTIEL DU RAMEN JAPONAIS. — **choix final à faire** |
| 11 | Notre Histoire | ✅ Process décidé | Draft IA (4 blocs) → validation interne → traduction EN/DE |
| 12 | Vert source | ✅ Confirmé | `#77967A` (source print) — ajustable via Sanity `siteSettings.accentColor` |

### 🔲 Actions restantes avant dev

1. **Confirmer les horaires** en interne (source Instagram fiable ?)
2. **Choisir la catchphrase** parmi les 3 finalistes (ou éditer dans Sanity après lancement)
3. **Obtenir l'URL Gusty Click & Collect** (demander côté Gusty gestion)
5. **Uploader les photos Nis&For HD** dans Sanity Studio (configurer crop/hotspot par usage)
6. **Rédiger/valider le texte "Notre Histoire"** (draft IA disponible sur demande → saisir dans Sanity)
7. **Préparer les traductions EN/DE** du contenu Sanity (champs localisés)
8. **Aligner le NAP** : Google Business Profile = même nom/adresse/tél que le site
9. **Créer le projet Sanity** (gratuit) + inviter les éditeurs (accès Studio)
