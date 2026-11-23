# Phase 12 : rapport d'écarts imprimé 2026 / Sanity

Statut : APPLIQUÉ le 2026-11-23T20:11:47.871Z (transaction PS4gSiVcUV6cnzSF8ooJME, sauvegarde .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-201142.json)

Sources : imprimé plats du 2026-11-10 (`.planning/sources/menu-2026/plats-ouvert-360x250mm-print-2026-11-10.pdf`) et boissons du 2026-11-03 (`.planning/sources/menu-2026/boissons-180x250mm-print-2026-11-03.pdf`), transcrits dans `scripts/menu-2026/menu-2026.json` le 2026-11-23 ; Sanity `c7twe801/production` lu le 2026-11-23T20:11:42.494Z.

Note : selon l'accord d'autonomie d'EK du 2026-11-23, ce rapport est appliqué sans blocage (plan 12-03) puis remis à EK pour une revue a posteriori (MENU-04).

## Résumé

- Imprimé 2026 : **20 catégories, 77 articles** (plats : 8 catégories / 30 articles ; boissons : 12 catégories / 47 articles).
- Sanity avant : 167 menuItem (167 visibles), 26 menuCategory, 5 menuExtra (5 visibles), 2 menuFormule (2 visibles) ; 0 brouillon(s) ; 0 document(s) m26.
- Sanity après : 20 catégories et 77 articles `m26-*` visibles ; 174 anciens documents masqués (`available=false`), aucun supprimé ; les anciennes catégories restent, vides, donc invisibles sur le site.
- Écritures (une transaction) : 97 `createOrReplace` (20 catégories + 77 articles), 174 patchs `available=false` (dont 0 orphelin(s) m26), 0 suppression ; 7 slugs suffixés « -2026 » ; 3 photo(s) reprise(s), 0 conservée(s).
- Garde « code Phase 12 en ligne » (https://umai-ramen.fr/fr/menu) : `LIVE GUARD: ok`.
- Ligne de contrôle : `SYNC SUMMARY mode=apply categories=20 items=77 hideLegacy=174 hideOrphanM26=0 slugSuffixed=7 drafts=0 imagesFromLegacy=3 imagesKept=0`

## Ajoutés (nouveaux sur l'imprimé)

23 articles sans équivalent dans l'ancien menu Sanity :

| Catégorie | Article | Prix |
|---|---|---|
| Tantan Umaï | Tantan Mazesoba | 15,90 € |
| Tantan Umaï | Tantan Tsukemen | 16,90 € |
| Udon | Tantan Udon | 15,90 € |
| Extras | Oeuf onsen | 2,00 € |
| Desserts | Boule de glace au choix | 3,00 € |
| Bières | Asahi Yuzu | 25cl 5,40 € · 50cl 8,40 € |
| Bières | Asahi Saké | 25cl 5,50 € · 50cl 8,50 € |
| Spritz | Yuzu Spritz | 8,90 € |
| Spritz | Nana Spritz | 8,90 € |
| Cocktails signature | Natsu | 9,00 € |
| Cocktails signature | Sakura Blossom | 8,50 € |
| Cocktails sans alcool | Hachiko | 30cl 7,50 € |
| Sakés japonais | Zaku ~ 15,5° | 9,80 € |
| Sakés japonais | Kinrei ~ 15,5° | 9,80 € |
| Sakés japonais | Fu ~ 8° | 9,80 € |
| Sakés japonais | Junmaishu ~ 15,5° | 9,80 € |
| Sakés japonais | Atelier du saké ~ 17,5° | 9,80 € |
| Sakés japonais | Trio dégustation | 3 × 6cl 18,00 € |
| Whiskies & Rhums | Toki | 8,50 € |
| Whiskies & Rhums | Hibiki | 14,00 € |
| Whiskies & Rhums | Yamazaki | 13,00 € |
| Vins | Riesling Alsace ~ Sperry | 12cl 5,50 € · 75cl 24,00 € |
| Vins | Année Lumière millésime 2023 | Prix sur demande |

Les 20 catégories sont de nouveaux documents `m26-cat-*` (structure de l'imprimé) : les anciennes catégories ne sont pas réutilisées (leurs textes EN/DE datent d'eazee-link).

## Prix modifiés

Pour chaque ancien document repris : ancien prix → nouveau prix de l'imprimé. Écart calculé sur le prix de base (prix unique, ou plus petit prix des variantes) ; « = » : prix inchangé.

| Nouvel article | Ancien document | Ancien prix | Nouveau prix | Écart |
|---|---|---|---|---|
| Karaage | Karaage fait-maison (`item-e3480247`) | 3,95 € | 3 pcs 5,50 € · 6 pcs 9,90 € · 9 pcs 13,90 € | +1,55 € |
| Gyozas | Gyoza porc (`item-e3480244`) | 3,95 € | 3 pcs 4,90 € · 6 pcs 8,90 € · 9 pcs 12,50 € | +0,95 € |
| Gyozas | Gyoza poulet (`item-e3480245`) | 3,95 € | 3 pcs 4,90 € · 6 pcs 8,90 € · 9 pcs 12,50 € | +0,95 € |
| Gyozas | Gyoza aux légumes (`item-e3480246`) | 3,95 € | 3 pcs 4,90 € · 6 pcs 8,90 € · 9 pcs 12,50 € | +0,95 € |
| Takoyaki | Takoyaki (`item-e3480243`) | 4,90 € | 3 pcs 4,90 € · 6 pcs 8,90 € · 9 pcs 12,50 € | = |
| Edamame | Edamame à la fleur de sel (`item-e3898281`) | 4,50 € | 4,90 € | +0,40 € |
| Tantan Ramen | Tantan Ramen (`item-e3480254`) | 14,90 € | 15,90 € | +1,00 € |
| Yasai Ramen | Yasaï Ramen (`item-e3480255`) | 14,90 € | 15,90 € | +1,00 € |
| Yuzu Ramen | Yuzu Ramen (`item-e3907822`) | 14,00 € | 14,90 € | +0,90 € |
| Tokyo Ramen | Tokyo Ramen (`item-e3480256`) | 13,95 € | 14,90 € | +0,95 € |
| Wantan Ramen | Wantan Men Ramen (`item-e3480257`) | 13,95 € | 15,90 € | +1,95 € |
| Miso Ramen | Miso Ramen (`item-e3480252`) | 14,50 € | 15,90 € | +1,40 € |
| Miso végétarien | Miso végétarien Ramen (`item-e3480253`) | 14,90 € | 15,90 € | +1,00 € |
| Karaage Mazesoba | Karaage Mazesoba (`item-e3480260`) | 14,50 € | 15,50 € | +1,00 € |
| Chashu Mazesoba | Chashu Mazesoba (`item-e3480259`) | 14,50 € | 15,50 € | +1,00 € |
| Tofu Mazesoba | Tofu Mazesoba (`item-e3480261`) | 14,50 € | 14,90 € | +0,40 € |
| Udon Karaage | Udon Karaage (`item-e4153085`) | 14,90 € | 15,50 € | +0,60 € |
| Udon au bœuf aux cinq épices | Udon aux 5 épices (`item-e3879608`) | 14,50 € | 15,50 € | +1,00 € |
| Little Tokyo | Little Tokyo (`item-e3480264`) | 8,00 € | 9,90 € | +1,90 € |
| Little Tokyo | Menu Enfant « Little Tokyo » (`formule-enfant`) | 9,50 € | 9,90 € | +0,40 € |
| Mini Ramen | Mini Ramen (`item-e3480265`) | 8,90 € | 9,90 € | +1,00 € |
| Oeuf mariné entier | Oeuf mariné (`item-e3480266`) | 2,00 € | 2,00 € | = |
| Oeuf mariné entier | Œuf mariné (`extra-oeuf`) | 1,50 € | 2,00 € | +0,50 € |
| Chashu de porc | Chashu porc (`item-e3480267`) | 3,90 € | 2 pcs 3,90 € | = |
| Chashu de porc | Chashu supplémentaire (`extra-chashu`) | 3,00 € | 2 pcs 3,90 € | +0,90 € |
| Chashu de poulet | Chashu poulet (`item-e3480268`) | 3,60 € | 3 pcs 3,50 € | -0,10 € |
| Café ou thé gourmand | Café gourmand (`item-e3480284`) | 9,00 € | 9,90 € | +0,90 € |
| Café ou thé gourmand | Thé gourmand (`item-e3480283`) | 9,50 € | 9,90 € | +0,40 € |
| Duo de mochis glacés | Mochi glacé sakura & fruit de la passion (`item-e3480282`) | 5,90 € | 6,50 € | +0,60 € |
| Tiramisu matcha | Tiramisu matcha maison (`item-e3480281`) | 6,90 € | 6,90 € | = |
| Tiramisu framboise & litchi | Tiramisu framboise et litchi maison (`item-e3480280`) | 6,90 € | 6,90 € | = |
| Asahi ~ 5° | Asahi Super Dry -5° (`item-e3480288`) | 4,80 € | 25cl 4,90 € · 50cl 7,50 € | +0,10 € |
| Asahi Super Dry ~ 5° | Asashi Super Dry -5° (`item-e3480292`) | 5,00 € | 33cl 5,90 € | +0,90 € |
| Coedo IPA ~ 4,5° | Coedo Marihana Ipa -4.5° (`item-e3480296`) | 7,80 € | 33cl 6,90 € | -0,90 € |
| Umeshu Spritz | Umeshu Spritz (`item-e4153375`) | 8,50 € | 8,90 € | +0,40 € |
| Peach Passion Spritz | Pêche & passion Spritz (`item-e4315920`) | 8,50 € | 8,90 € | +0,40 € |
| Highball | Toki Highball (`item-e3480358`) | 8,50 € | 8,50 € | = |
| Ginger Highball | Ginger ale Highball (`item-e3886808`) | 8,50 € | 9,00 € | +0,50 € |
| Nana | Nana (`item-e3480361`) | 8,50 € | 9,00 € | +0,50 € |
| Lovely | Lovely (`item-e3480300`) | 6,00 € | 30cl 7,50 € | +1,50 € |
| Yuzu maison | Thé maison au yuzu (`item-e3480341`) | 3,80 € | 30cl 4,20 € | +0,40 € |
| Thé noir glacé au litchi | Thé noir au litchi (`item-e3480342`) | 3,60 € | 33cl 4,20 € | +0,60 € |
| Thé glacé pêche | Thé à la pêche Lisbeth (`item-e3480343`) | 3,60 € | 30cl 4,20 € | +0,60 € |
| Ramune | Limonade japonaise Ramune (`item-e3480338`) | 5,50 € | 20cl 5,60 € | +0,10 € |
| Coca-Cola / Coca-Cola Zéro | Coca-Cola (`item-e3480336`) | 3,20 € | 33cl 3,50 € | +0,30 € |
| Coca-Cola / Coca-Cola Zéro | Coca- Cola zéro (`item-e3480337`) | 3,20 € | 33cl 3,50 € | +0,30 € |
| Sirop à l'eau | Sirop (`item-e3509950`) | 2,60 € | 3,00 € | +0,40 € |
| Diabolo | Diabolo (`item-e3509951`) | 2,80 € | 3,50 € | +0,70 € |
| Lisbeth bleu, verte, rouge | Lisbeth bleu, verte, rouge (`item-e3480303`) | 3,50 € | 50cl 3,50 € | = |
| Jidai okure ~ 15,5° | Jidai Okure, Junmai Ginjo (`item-e3857685`) | 9,60 € | 9,80 € | +0,20 € |
| Nikka from the Barrel | Nikka From The Barrel, blended whisky -51.4° (`item-e3480365`) | 10,00 € | 10,50 € | +0,50 € |
| The Chita | The Chita distiller's reserve, single grain -43° (`item-e3874891`) | 14,60 € | 9,00 € | -5,60 € |
| Ryoma, rhum ambré | Ryoma -40°- (`item-e3778342`) | 7,20 € | 8,50 € | +1,30 € |
| Kiyomi, rhum blanc | Kiyomi -40°- (`item-e3874909`) | 7,20 € | 8,50 € | +1,30 € |
| Chardonnay Naturalys | Igp pays d'Oc - Naturalys Chardonnay Bio - Gérard Bertrand (`item-e3480380`) | 6,20 € | 12cl 5,50 € · 75cl 24,00 € | -0,70 € |
| Café expresso | Expresso, décaféiné (`item-e3480398`) | 2,20 € | 2,40 € | +0,20 € |
| Double expresso | Double café (`item-e3480403`) | 3,60 € | 3,60 € | = |
| Café au lait | Grand café au lait (`item-e3480404`) | 3,20 € | 3,20 € | = |
| Japanese Coffee | Japanese coffee (`item-e3480287`) | 8,50 € | 8,90 € | +0,40 € |
| Thés verts japonais | Genmaïcha - Thé vert (grillé & céréalier) (`item-e3480389`) | 4,00 € | 4,50 € | +0,50 € |
| Thés verts japonais | Sencha - Thé vert (iodé & végétal) (`item-e3480392`) | 4,00 € | 4,50 € | +0,50 € |
| Thés verts japonais | Citron vert Sencha - Thé vert (fruité & végétal) (`item-e3480391`) | 4,00 € | 4,50 € | +0,50 € |
| Thés verts japonais | Fleur de Geisha - Thé vert (floral) (`item-e3480390`) | 4,00 € | 4,50 € | +0,50 € |
| Thés verts japonais | Grand jasmin Chun Feng - Thé vert (floral & végétal) (`item-e3480393`) | 4,00 € | 4,50 € | +0,50 € |
| Infusions | Infusion Jardin Tropical (`item-e3480395`) | 3,50 € | 4,50 € | +1,00 € |
| Infusions | Infusion Jardin de Corail (`item-e3896125`) | 3,50 € | 4,50 € | +1,00 € |
| Infusions | Infusion Jardin d'eau (`item-e3897004`) | 3,50 € | 4,50 € | +1,00 € |
| Infusions | Infusion sur un nuage -Bio- (`item-e4112637`) | 4,00 € | 4,50 € | +0,50 € |

## Textes modifiés

Nom et description de l'ancien document → texte de l'imprimé (espaces normalisés, 140 caractères au plus). Seules les différences sont listées.

| Nouvel article | Ancien document | Champ | Avant | Après |
|---|---|---|---|---|
| Karaage | `item-e3480247` | nom | Karaage fait-maison | Karaage |
| Karaage | `item-e3480247` | description | Pièces de poulets croustillants marinés à la sauce soja et au gingembre Formats : x3 3,95€ · x6 6,90€ · x9 9,60€ | Poulet mariné et frit maison |
| Gyozas | `item-e3480244` | nom | Gyoza porc | Gyozas |
| Gyozas | `item-e3480244` | description | Pièces de raviolis grillés au porc Formats : x3 3,95€ · x6 6,90€ · x9 9,60€ | Raviolis grillés. Garniture au choix : poulet, porc ou légumes. |
| Gyozas | `item-e3480245` | nom | Gyoza poulet | Gyozas |
| Gyozas | `item-e3480245` | description | Pièces de raviolis grillés au poulet Formats : x3 3,95€ · x6 6,90€ · x9 9,60€ | Raviolis grillés. Garniture au choix : poulet, porc ou légumes. |
| Gyozas | `item-e3480246` | nom | Gyoza aux légumes | Gyozas |
| Gyozas | `item-e3480246` | description | Pièces de raviolis grillés aux légumes Formats : x3 3,95€ · x6 6,90€ · x9 9,60€ | Raviolis grillés. Garniture au choix : poulet, porc ou légumes. |
| Takoyaki | `item-e3480243` | description | Petites bouchées à base de pâte à crêpe, croustillantes à l’extérieur et moelleuses à l’intérieur avec un morceau de poulpe, copeaux de bon… | Boulettes fondantes au poulpe |
| Edamame | `item-e3898281` | nom | Edamame à la fleur de sel | Edamame |
| Edamame | `item-e3898281` | description | Haricot japonais | Fèves de soja à la fleur de sel |
| Tantan Ramen | `item-e3480254` | description | Bouillon maison de poulet alsacien, à base de crème de sésame blanc torréfié, nouilles fines de blé artisanales, lait de soja, huile de pim… | Bouillon de poulet au sésame, huile de piment, bœuf haché, pousses de soja, pak-choï, daikon et demi-œuf mariné. |
| Yasai Ramen | `item-e3480255` | nom | Yasaï Ramen | Yasai Ramen |
| Yasai Ramen | `item-e3480255` | description | Bouillon de légumes maison (shitaké & kombu), lait de soja, nouilles fines de blé artisanales, huile de piment tofu teriyaki aux graines de… | Bouillon de légumes au sésame, huile de piment, tofu teriyaki, pousses de soja, pak-choï, daikon et demi-oeuf mariné. |
| Yuzu Ramen | `item-e3907822` | description | Bouillon maison de poulet alsacien, à base de sauce soja, nouilles fines de blé artisanales, chashu de poulet, oeuf, pak choi, bambou & céb… | Bouillon de poulet clair au jus de yuzu, chashu de poulet, demi-œuf mariné, cébette, bambou et pak-choï. |
| Tokyo Ramen | `item-e3480256` | description | Bouillon maison de poulet alsacien, à base de sauce soja, nouilles fines de blé artisanales, chashu de porc, oeuf, pak choi, bambou & cébet… | Bouillon de poulet clair, chashu de porc, demi-œuf mariné, cébette, bambou et pak-choï. |
| Wantan Ramen | `item-e3480257` | nom | Wantan Men Ramen | Wantan Ramen |
| Wantan Ramen | `item-e3480257` | description | Bouillon maison de poulet alsacien, à base de sel de Guérande, nouilles fines de blé artisanales, chashu de poulet, ravioli de poulet, oeuf… | Bouillon de poulet, chashu de poulet, ravioli de poulet, demi-œuf mariné, cébette, bambou et pak-choï. |
| Miso Ramen | `item-e3480252` | description | Bouillon maison de poulet alsacien, à base de miso rouge, nouilles fines de blé artisanales, chashu de porc, oeuf, pousse de soja, pois gou… | Bouillon de poulet épais au miso rouge, chashu de porc, demi-œuf mariné, cébette et pousses de soja. |
| Miso végétarien | `item-e3480253` | nom | Miso végétarien Ramen | Miso végétarien |
| Miso végétarien | `item-e3480253` | description | Bouillon de légumes fait-maison (shitaké & kombu), nouilles fines de blés artisanales, lait de soja, tranches de tofu bio teriyaki aux grai… | Bouillon de légumes au miso rouge, tofu teriyaki, pousses de soja, pak-choï, daikon et demi-oeuf mariné. |
| Karaage Mazesoba | `item-e3480260` | description | Nouilles épaisses de blé artisanales, pièces de poulets croustillants, sauce soja, oeuf, daikon acidulé, nori & ciboulette. | Poulet frit, cébette, daikon, nori et œuf onsen. |
| Chashu Mazesoba | `item-e3480259` | description | Nouilles épaisses de blé artisanales, chashu de porc, sauce soja, oeuf, daikon acidulé, oignons frits, nori & ciboulette. | Morceaux de porc teriyaki, cébette, daikon, nori et œuf onsen. |
| Tofu Mazesoba | `item-e3480261` | description | Nouilles épaisses de blé artisanales, tofu alsacien teriyaki, sauce soja, oeuf, wakamé, pousses de soja, maïs & nori. | Tofu teriyaki, cébette, daikon, nori et œuf onsen. |
| Udon Karaage | `item-e4153085` | description | Nouillé de blé tendre, bouillon tsuyu, karaage & cébette | Bouillon tsuyu, poulet frit, œuf onsen et cébette. |
| Udon au bœuf aux cinq épices | `item-e3879608` | nom | Udon aux 5 épices | Udon au bœuf aux cinq épices |
| Udon au bœuf aux cinq épices | `item-e3879608` | description | Nouilles de blé tendre, bouillon tsuyu, boeuf hâché aux 5 épices, huile de piment, oeuf & cébette. | Bouillon tsuyu, bœuf haché aux cinq épices, œuf onsen et cébette. |
| Little Tokyo | `item-e3480264` | description | BOISSON (un sirop à l'eau) + PLAT (nouilles épaisses de blé artisanales, pièces de poulet croustillantes, pois gourmand, oeuf) + DESSERT (u… | Nouilles épaisses, deux karaage, edamame et demi-œuf mariné. |
| Little Tokyo | `formule-enfant` | nom | Menu Enfant « Little Tokyo » | Little Tokyo |
| Little Tokyo | `formule-enfant` | description | Pour les petits gourmands. Mini ramen avec bouillon doux et une boisson. | Nouilles épaisses, deux karaage, edamame et demi-œuf mariné. |
| Mini Ramen | `item-e3480265` | description | BOISSON (sirop) + PLAT (mini ramen Tokyo, Miso, Wantan Men) + DESSERT (une boule de glace au choix) | Tokyo ou Miso. |
| Oeuf mariné entier | `item-e3480266` | nom | Oeuf mariné | Oeuf mariné entier |
| Oeuf mariné entier | `extra-oeuf` | nom | Œuf mariné | Oeuf mariné entier |
| Chashu de porc | `item-e3480267` | nom | Chashu porc | Chashu de porc |
| Chashu de porc | `extra-chashu` | nom | Chashu supplémentaire | Chashu de porc |
| Chashu de poulet | `item-e3480268` | nom | Chashu poulet | Chashu de poulet |
| Café ou thé gourmand | `item-e3480284` | nom | Café gourmand | Café ou thé gourmand |
| Café ou thé gourmand | `item-e3480284` | description | Un mini-financier yuzu, un mochi au sésame noir, macaron exotique, mochi glacé au choix & un expresso | Mini financier matcha, macaron exotique, mochi sésame noir et une boule de glace |
| Café ou thé gourmand | `item-e3480283` | nom | Thé gourmand | Café ou thé gourmand |
| Café ou thé gourmand | `item-e3480283` | description | Un mini-financier yuzu, un mochi au sésame noir, macaron exotique, mochi glacé & thé au choix | Mini financier matcha, macaron exotique, mochi sésame noir et une boule de glace |
| Duo de mochis glacés | `item-e3480282` | nom | Mochi glacé sakura & fruit de la passion | Duo de mochis glacés |
| Duo de mochis glacés | `item-e3480282` | description | (vide) | Sakura & fruit de la passion. |
| Tiramisu matcha | `item-e3480281` | nom | Tiramisu matcha maison | Tiramisu matcha |
| Tiramisu framboise & litchi | `item-e3480280` | nom | Tiramisu framboise et litchi maison | Tiramisu framboise & litchi |
| Asahi ~ 5° | `item-e3480288` | nom | Asahi Super Dry -5° | Asahi ~ 5° |
| Asahi ~ 5° | `item-e3480288` | description | Formats : 25cl 4,80€ · 50cl 7,20€ | (vide) |
| Asahi Super Dry ~ 5° | `item-e3480292` | nom | Asashi Super Dry -5° | Asahi Super Dry ~ 5° |
| Coedo IPA ~ 4,5° | `item-e3480296` | nom | Coedo Marihana Ipa -4.5° | Coedo IPA ~ 4,5° |
| Coedo IPA ~ 4,5° | `item-e3480296` | description | Son nom signifie “fleur de houblon” en japonais. En bouche, des arômes de houblon citronné | (vide) |
| Umeshu Spritz | `item-e4153375` | description | Vin de prune & crémant | (vide) |
| Peach Passion Spritz | `item-e4315920` | nom | Pêche & passion Spritz | Peach Passion Spritz |
| Peach Passion Spritz | `item-e4315920` | description | Crémant, sirop pêche, purée fruit de la passion & eau pétillante | (vide) |
| Highball | `item-e3480358` | nom | Toki Highball | Highball |
| Highball | `item-e3480358` | description | Whisky Hatozaki & eau gazeuse | Whisky japonais allongé au soda. |
| Ginger Highball | `item-e3886808` | nom | Ginger ale Highball | Ginger Highball |
| Ginger Highball | `item-e3886808` | description | Hatozaki whisky & ginger ale | Déclinaison au gingembre. |
| Nana | `item-e3480361` | description | Gin, liqueur de litchi, limonade, sirop de rose & jus de framboise | Gin, litchi, rose, citron et limonade. |
| Lovely | `item-e3480300` | description | Sirop de rose, sirop de litchi, limonade & jus de framboise. | Rose, litchi, citron et limonade. |
| Yuzu maison | `item-e3480341` | nom | Thé maison au yuzu | Yuzu maison |
| Yuzu maison | `item-e3480341` | description | (vide) | Frais, légèrement acidulé. |
| Thé noir glacé au litchi | `item-e3480342` | nom | Thé noir au litchi | Thé noir glacé au litchi |
| Thé glacé pêche | `item-e3480343` | nom | Thé à la pêche Lisbeth | Thé glacé pêche |
| Ramune | `item-e3480338` | nom | Limonade japonaise Ramune | Ramune |
| Ramune | `item-e3480338` | description | (vide) | Au choix : yuzu, fraise ou litchi. |
| Coca-Cola / Coca-Cola Zéro | `item-e3480336` | nom | Coca-Cola | Coca-Cola / Coca-Cola Zéro |
| Coca-Cola / Coca-Cola Zéro | `item-e3480337` | nom | Coca- Cola zéro | Coca-Cola / Coca-Cola Zéro |
| Sirop à l'eau | `item-e3509950` | nom | Sirop | Sirop à l'eau |
| Sirop à l'eau | `item-e3509950` | description | Grenadine, citron, banane verte, orgeat, pastèque, hibiscus, rose, litchi, framboise, jasmin, lavande, violette, menthe, kiwi, pêche, mangu… | grenadine, fraise, citron, pêche, litchi, passion ou rose. |
| Diabolo | `item-e3509951` | description | Grenadine, citron, banane verte, orgeat, pastèque, hibiscus, rose, litchi, framboise, jasmin, lavande, violette, menthe, kiwi, pêche, mangu… | grenadine, fraise, citron, pêche, litchi, passion ou rose. |
| Lisbeth bleu, verte, rouge | `item-e3480303` | description | Formats : 50cl 3,50€ · 1L 5,50€ | (vide) |
| Jidai okure ~ 15,5° | `item-e3857685` | nom | Jidai Okure, Junmai Ginjo | Jidai okure ~ 15,5° |
| Jidai okure ~ 15,5° | `item-e3857685` | description | Saké riche et rond avec des notes de melons, champignons et fruits sec. S'accorde idéalement avec le miso ou le tantan. Formats : 10cl 9,60… | Rond et équilibré. |
| Nikka from the Barrel | `item-e3480365` | nom | Nikka From The Barrel, blended whisky -51.4° | Nikka from the Barrel |
| Nikka from the Barrel | `item-e3480365` | description | Puissant et équilibré avec des notes de pêche de pommes caramélisées | (vide) |
| The Chita | `item-e3874891` | nom | The Chita distiller's reserve, single grain -43° | The Chita |
| The Chita | `item-e3874891` | description | Notes de crème brûlée & miel d'acacia. Vieilli en fût de sherry, de bourbon & de vin. Produit sur la péninsule de Chita. | (vide) |
| Ryoma, rhum ambré | `item-e3778342` | nom | Ryoma -40°- | Ryoma, rhum ambré |
| Ryoma, rhum ambré | `item-e3778342` | description | Rhum ambré japonais produit sur l'île de Shikoku et vieilli 7 ans en fût de chêne. Notes de thé vanillé & de jasmin. | (vide) |
| Kiyomi, rhum blanc | `item-e3874909` | nom | Kiyomi -40°- | Kiyomi, rhum blanc |
| Kiyomi, rhum blanc | `item-e3874909` | description | Rhum blanc japonais produit sur l'île d'Okinawa. Note de bananes flambées, litchi & fruit de la passion. | (vide) |
| Chardonnay Naturalys | `item-e3480380` | nom | Igp pays d'Oc - Naturalys Chardonnay Bio - Gérard Bertrand | Chardonnay Naturalys |
| Chardonnay Naturalys | `item-e3480380` | description | Formats : 12cl 6,20€ · 24cl 11,00€ · 75cl 33,80€ | Gérard Bertrand |
| Café expresso | `item-e3480398` | nom | Expresso, décaféiné | Café expresso |
| Double expresso | `item-e3480403` | nom | Double café | Double expresso |
| Café au lait | `item-e3480404` | nom | Grand café au lait | Café au lait |
| Japanese Coffee | `item-e3480287` | nom | Japanese coffee | Japanese Coffee |
| Japanese Coffee | `item-e3480287` | description | Comme un Irish coffee mais avec du whisky japonais et une belle chantilly | Expresso, whisky japonais et chantilly. |
| Thés verts japonais | `item-e3480389` | nom | Genmaïcha - Thé vert (grillé & céréalier) | Thés verts japonais |
| Thés verts japonais | `item-e3480389` | description | Thé vert sencha, riz torréfié & matcha | Au choix : genmaïcha, sencha, Fleur de Geisha, sencha agrumes ou Grand jasmin Chun Feng. |
| Thés verts japonais | `item-e3480392` | nom | Sencha - Thé vert (iodé & végétal) | Thés verts japonais |
| Thés verts japonais | `item-e3480392` | description | (vide) | Au choix : genmaïcha, sencha, Fleur de Geisha, sencha agrumes ou Grand jasmin Chun Feng. |
| Thés verts japonais | `item-e3480391` | nom | Citron vert Sencha - Thé vert (fruité & végétal) | Thés verts japonais |
| Thés verts japonais | `item-e3480391` | description | (vide) | Au choix : genmaïcha, sencha, Fleur de Geisha, sencha agrumes ou Grand jasmin Chun Feng. |
| Thés verts japonais | `item-e3480390` | nom | Fleur de Geisha - Thé vert (floral) | Thés verts japonais |
| Thés verts japonais | `item-e3480390` | description | Fleur de cerisier | Au choix : genmaïcha, sencha, Fleur de Geisha, sencha agrumes ou Grand jasmin Chun Feng. |
| Thés verts japonais | `item-e3480393` | nom | Grand jasmin Chun Feng - Thé vert (floral & végétal) | Thés verts japonais |
| Thés verts japonais | `item-e3480393` | description | (vide) | Au choix : genmaïcha, sencha, Fleur de Geisha, sencha agrumes ou Grand jasmin Chun Feng. |
| Infusions | `item-e3480395` | nom | Infusion Jardin Tropical | Infusions |
| Infusions | `item-e3480395` | description | Mangue, ananas, papaye & pêche | Sélection selon disponibilités. |
| Infusions | `item-e3896125` | nom | Infusion Jardin de Corail | Infusions |
| Infusions | `item-e3896125` | description | Ananas, noix de coco | Sélection selon disponibilités. |
| Infusions | `item-e3897004` | nom | Infusion Jardin d'eau | Infusions |
| Infusions | `item-e3897004` | description | Melon & papaye | Sélection selon disponibilités. |
| Infusions | `item-e4112637` | nom | Infusion sur un nuage -Bio- | Infusions |
| Infusions | `item-e4112637` | description | Passiflore, valériane, lavande et camomille | Sélection selon disponibilités. |

## Masqués (plus sur l'imprimé)

174 documents passent en `available=false` : jamais supprimés, le retour arrière les réaffiche. « remplacé par » = repris par un article de l'imprimé ; « retiré » = absent de l'imprimé.

### Entrées (`cat-entrees`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Takoyaki | `item-e3480243` | 4,90 € | remplacé par `m26-item-takoyaki` |
| Gyoza porc | `item-e3480244` | 3,95 € | remplacé par `m26-item-gyozas` |
| Gyoza poulet | `item-e3480245` | 3,95 € | remplacé par `m26-item-gyozas` |
| Gyoza canard | `item-e4149892` | 4,80 € | retiré |
| Gyoza aux légumes | `item-e3480246` | 3,95 € | remplacé par `m26-item-gyozas` |
| Gyoza crevette | `item-e4318115` | 4,90 € | retiré |
| Karaage fait-maison | `item-e3480247` | 3,95 € | remplacé par `m26-item-karaage` |
| Edamame au wasabi et à l'ail | `item-e3480248` | 4,50 € | retiré |
| Edamame à la fleur de sel | `item-e3898281` | 4,50 € | remplacé par `m26-item-edamame` |
| Soupe de miso rouge | `item-e3480249` | 4,00 € | retiré |
| Bol de salade verte: au choix vinaigrette au sésame blanc ou vinaigrette au wasabi | `item-e3480250` | 3,90 € | retiré |
| Kimchi | `item-e3595683` | 4,50 € | retiré |

### Ramen Paitan (`cat-ramen-paitan`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Miso Ramen | `item-e3480252` | 14,50 € | remplacé par `m26-item-miso-ramen` |
| Miso végétarien Ramen | `item-e3480253` | 14,90 € | remplacé par `m26-item-miso-vegetarien` |
| Tantan Ramen | `item-e3480254` | 14,90 € | remplacé par `m26-item-tantan-ramen` |
| Yasaï Ramen | `item-e3480255` | 14,90 € | remplacé par `m26-item-yasai-ramen` |

### Ramen Chintan (`cat-ramen-chintan`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Tokyo Ramen | `item-e3480256` | 13,95 € | remplacé par `m26-item-tokyo-ramen` |
| Wantan Men Ramen | `item-e3480257` | 13,95 € | remplacé par `m26-item-wantan-ramen` |
| Hakodate Ramen | `item-e3879604` | 13,95 € | retiré |
| Yuzu Ramen | `item-e3907822` | 14,00 € | remplacé par `m26-item-yuzu-ramen` |
| Kamo Soba | `item-e4165788` | 16,90 € | retiré |

### Tsukemen (`cat-tsukemen`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Miso tsukemen | `item-e3480258` | 13,95 € | retiré |
| Shoyu Tsukemen | `item-e3588815` | 13,95 € | retiré |

### Mazesoba (`cat-mazesoba`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Chashu Mazesoba | `item-e3480259` | 14,50 € | remplacé par `m26-item-chashu-mazesoba` |
| Karaage Mazesoba | `item-e3480260` | 14,50 € | remplacé par `m26-item-karaage-mazesoba` |
| Tofu Mazesoba | `item-e3480261` | 14,50 € | remplacé par `m26-item-tofu-mazesoba` |
| Katsu Curry Mazesoba | `item-e3765921` | 18,00 € | retiré |

### Udon (midi) (`cat-udon`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Udon Tempura | `item-e3772954` | 14,90 € | retiré |
| Udon aux 5 épices | `item-e3879608` | 14,50 € | remplacé par `m26-item-udon-boeuf-cinq-epices` |
| Udon carbonara | `item-e4149895` | 15,90 € | retiré |
| Udon Karaage | `item-e4153085` | 14,90 € | remplacé par `m26-item-udon-karaage` |

### Menus (`cat-menus`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Menu Gyoza | `item-e3480263` | 13,50 € | retiré |

### Menu enfant (`cat-menu-enfant`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Little Tokyo | `item-e3480264` | 8,00 € | remplacé par `m26-item-little-tokyo` |
| Mini Ramen | `item-e3480265` | 8,90 € | remplacé par `m26-item-mini-ramen` |

### Desserts (`cat-desserts`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Tiramisu framboise et litchi maison | `item-e3480280` | 6,90 € | remplacé par `m26-item-tiramisu-framboise-litchi` |
| Tiramisu matcha maison | `item-e3480281` | 6,90 € | remplacé par `m26-item-tiramisu-matcha` |
| Tiramisu exotique & nata de coco | `item-e3877287` | 6,90 € | retiré |
| Mochi glacé sakura & fruit de la passion | `item-e3480282` | 5,90 € | remplacé par `m26-item-duo-mochis-glaces` |
| Moelleux au chocolat avec sa boule de glace vanille | `item-e3480285` | 7,50 € | retiré |
| Thé gourmand | `item-e3480283` | 9,50 € | remplacé par `m26-item-cafe-the-gourmand` |
| Café gourmand | `item-e3480284` | 9,00 € | remplacé par `m26-item-cafe-the-gourmand` |
| Japanese coffee | `item-e3480287` | 8,50 € | remplacé par `m26-item-japanese-coffee` |

### Extras (`cat-extra`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Oeuf mariné | `item-e3480266` | 2,00 € | remplacé par `m26-item-oeuf-marine-entier` |
| Chashu porc | `item-e3480267` | 3,90 € | remplacé par `m26-item-chashu-porc` |
| Chashu poulet | `item-e3480268` | 3,60 € | remplacé par `m26-item-chashu-poulet` |
| Karaage fait-maison | `item-e3480269` | 3,90 € | retiré |
| Ravioli poulet | `item-e3480270` | 2,95 € | retiré |
| Pousse de soja | `item-e3480271` | 0,80 € | retiré |
| Maïs | `item-e3480272` | 0,80 € | retiré |
| Supplément nouilles fines | `item-e3480273` | 2,50 € | retiré |
| Supplément nouilles épaisses | `item-e4093979` | 3,00 € | retiré |
| Tofu teriyaki x3 | `item-e3480274` | 3,80 € | retiré |
| Oignons frits | `item-e3480275` | 0,40 € | retiré |
| Echalotes frites | `item-e3480276` | 0,40 € | retiré |
| Bambou | `item-e3480277` | 1,00 € | retiré |
| Nori | `item-e3480278` | 0,80 € | retiré |
| Cébette | `item-e3480279` | 0,80 € | retiré |
| Narutomaki x3 | `item-e3882546` | 0,80 € | retiré |
| Wakamé nature | `item-e3882547` | 0,80 € | retiré |
| Daikon | `item-e4093978` | 0,50 € | retiré |
| Pois gourmand x3 | `item-e4093980` | 0,50 € | retiré |

### Bières à la pression (`cat-bieres-pression`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Asahi Super Dry -5° | `item-e3480288` | 4,80 € | remplacé par `m26-item-asahi` |
| Panaché | `item-e3480289` | 5,10 € | retiré |
| Picon bière | `item-e3480290` | 5,20 € | retiré |
| Monaco | `item-e3480291` | 5,20 € | retiré |

### Bières à la bouteille (`cat-bieres-bouteille`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Asashi Super Dry -5° | `item-e3480292` | 5,00 € | remplacé par `m26-item-asahi-super-dry` |
| Hikari saké -5.5° | `item-e4092452` | 7,50 € | retiré |
| Iki yuzu et thé vert -4.5° | `item-e3480294` | 6,80 € | retiré |
| Coedo Beniaka Ale -7° | `item-e3480295` | 8,40 € | retiré |
| Coedo Marihana Ipa -4.5° | `item-e3480296` | 7,80 € | remplacé par `m26-item-coedo-ipa` |
| Coedo Ipl -4.5° | `item-e3480297` | 7,50 € | retiré |
| Coedo Shikkoku (Black) -5°- | `item-e4222974` | 7,80 € | retiré |
| Coedo Shiro (Blanche) -5,5°- | `item-e4238791` | 7,50 € | retiré |
| Kirin Free -0°- | `item-e4238792` | 4,20 € | retiré |

### Apéritifs (`cat-aperitifs`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Vin de prune Umeshu | `item-e3509953` | 7,40 € | retiré |
| Saké pétillant -5°- | `item-e3875091` | 7,20 € | retiré |
| Kir au vin blanc d’Alsace | `item-e3480349` | 5,50 € | retiré |
| Kir royal au crémant d’Alsace | `item-e3480353` | 7,20 € | retiré |
| Crémant d’Alsace Brut Bio -wolfberger- | `item-e3480346` | 9,80 € | retiré |
| Muré, crémant d'Alsace Brut | `item-e4315929` | 38,00 € | retiré |

### Cocktails (`cat-cocktails`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Gin Tonic classique | `item-e3480356` | 8,00 € | retiré |
| Gin tonic Yuzu | `item-e3480357` | 8,50 € | retiré |
| Gin tonic Litchi | `item-e3856597` | 8,50 € | retiré |
| Gin tonic ginger beer chili | `item-e3873339` | 8,50 € | retiré |
| Gin tonic Pomelo | `item-e4185421` | 8,50 € | retiré |
| Toki Highball | `item-e3480358` | 8,50 € | remplacé par `m26-item-highball` |
| Yuzu Highball | `item-e3480359` | 8,50 € | retiré |
| Ginger ale Highball | `item-e3886808` | 8,50 € | remplacé par `m26-item-ginger-highball` |
| Nana | `item-e3480361` | 8,50 € | remplacé par `m26-item-nana` |
| Kokoro | `item-e3480362` | 8,50 € | retiré |
| Apérol Spritz | `item-e3480363` | 8,50 € | retiré |
| Umeshu Spritz | `item-e4153375` | 8,50 € | remplacé par `m26-item-umeshu-spritz` |
| Pêche & passion Spritz | `item-e4315920` | 8,50 € | remplacé par `m26-item-peach-passion-spritz` |
| Peach Blossom | `item-e4153369` | 9,50 € | retiré |
| Litchi Martini | `item-e4153380` | 8,50 € | retiré |

### Cocktails sans alcool (`cat-cocktails-sa`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Lovely | `item-e3480300` | 6,00 € | remplacé par `m26-item-lovely` |
| Aïko | `item-e3480302` | 6,00 € | retiré |

### Whisky japonais (`cat-whisky`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Nikka From The Barrel, blended whisky -51.4° | `item-e3480365` | 10,00 € | remplacé par `m26-item-nikka-from-the-barrel` |
| Hibiki, blended whisky, 17 ans -43° | `item-e3480366` | 22,00 € | retiré |
| Nikka Days, blended whisky -40° | `item-e3874906` | 7,50 € | retiré |
| Yamazakura, blended whisky - 40° | `item-e3874908` | 10,00 € | retiré |
| The Chita distiller's reserve, single grain -43° | `item-e3874891` | 14,60 € | remplacé par `m26-item-the-chita` |
| Hatozaki, pure malt -46° | `item-e3480368` | 8,50 € | retiré |
| The Yamazaki distiller's reserve, pure malt -43° | `item-e3873341` | 22,00 € | retiré |
| The Hakushu distiller's reserve, single malt -43°- | `item-e3881374` | 19,70 € | retiré |
| Nikka Coffee Grain, single grain whisky -45°- | `item-e3886809` | 8,00 € | retiré |

### Saké japonais (`cat-sake`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Jidai Okure, Junmai Ginjo | `item-e3857685` | 9,60 € | remplacé par `m26-item-jidai-okure` |
| Banshu Koshiki, Kimoto Junmaï -16° | `item-e3857678` | 9,40 € | retiré |
| Rihaku, Junmai Nama Chozo- 15.5° | `item-e3480371` | 11,30 € | retiré |
| Kenbishi, Zuisho -18° | `item-e3896312` | 16,50 € | retiré |
| Kenrokuzkura Hiru - Junmai Gingo- 16° | `item-e4185422` | 10,60 € | retiré |

### Vins blancs (`cat-vins-blancs`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Igp pays d'Oc - Naturalys Chardonnay Bio - Gérard Bertrand | `item-e3480380` | 6,20 € | remplacé par `m26-item-chardonnay-naturalys` |
| Riesling 2022 - Seltz Fernand- | `item-e4226840` | 6,95 € | retiré |
| Gewurztraminer Cuvée prestige 2020 - Domaine Seltz Fernand | `item-e3480381` | 9,40 € | retiré |
| Riesling 2022 - Domaine de la Chapelle- | `item-e4226843` | 7,00 € | retiré |
| Gewurztraminer Rimelsberg Bio 2019 -Jean Becker- | `item-e4100811` | 11,30 € | retiré |
| Pinot blanc - Jean Becker- | `item-e4226848` | 39,90 € | retiré |

### Vins rouges (`cat-vins-rouges`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Belleruche, Côte du Rhône -Chapoutier- | `item-e4226844` | 5,50 € | retiré |
| Corbières Boutenac - Domaine Gangloff- | `item-e4315925` | 6,50 € | retiré |
| Pinot noir - Jean Becker- | `item-e4226846` | 38,90 € | retiré |
| Vacqueyras -Patrick Galant- | `item-e4315928` | 41,00 € | retiré |

### Vin rosé (`cat-vin-rose`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Igp Terre du Midi - Les Haytières | `item-e3480385` | 6,00 € | retiré |
| Côte de Provence -Maison Sainte Marguerite - Symphonie | `item-e4315927` | 35,00 € | retiré |

### Digestifs (`cat-digestifs`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Ryoma -40°- | `item-e3778342` | 7,20 € | remplacé par `m26-item-ryoma` |
| Kiyomi -40°- | `item-e3874909` | 7,20 € | remplacé par `m26-item-kiyomi` |
| Shochu -25°- | `item-e3875493` | 6,00 € | retiré |
| Vieilles prune -46°- | `item-e3480387` | 5,00 € | retiré |

### Thés glacés (`cat-thes-glaces`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Thé maison au yuzu | `item-e3480341` | 3,80 € | remplacé par `m26-item-yuzu-maison` |
| Thé noir au litchi | `item-e3480342` | 3,60 € | remplacé par `m26-item-the-noir-glace-litchi` |
| Thé à la pêche Lisbeth | `item-e3480343` | 3,60 € | remplacé par `m26-item-the-glace-peche` |
| Thé vert bio infusé au gingembre Bio | `item-e3772320` | 3,90 € | retiré |
| Thé glacé noir infusé au citron Bio | `item-e4223841` | 3,90 € | retiré |

### Softs (`cat-softs`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Coca-Cola | `item-e3480336` | 3,20 € | remplacé par `m26-item-coca-cola` |
| Coca- Cola zéro | `item-e3480337` | 3,20 € | remplacé par `m26-item-coca-cola` |
| Limonade japonaise Ramune | `item-e3480338` | 5,50 € | remplacé par `m26-item-ramune` |
| Limonade Phénix | `item-e3480339` | 2,80 € | retiré |
| Limonade fruit de la passion Bio | `item-e4250764` | 3,80 € | retiré |
| Limonade gingembre Bio | `item-e4315930` | 3,80 € | retiré |
| Citronnade | `item-e3480340` | 3,00 € | retiré |
| Eau de coco | `item-e3509945` | 3,50 € | retiré |
| Sirop | `item-e3509950` | 2,60 € | remplacé par `m26-item-sirop-a-leau` |
| Diabolo | `item-e3509951` | 2,80 € | remplacé par `m26-item-diabolo` |
| Jus de fruit | `item-e4216461` | 3,60 € | retiré |

### Eaux minérales (`cat-eaux`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Lisbeth bleu, verte, rouge | `item-e3480303` | 3,50 € | remplacé par `m26-item-lisbeth` |

### Thés & infusions (`cat-thes-infusions`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Genmaïcha - Thé vert (grillé & céréalier) | `item-e3480389` | 4,00 € | remplacé par `m26-item-thes-verts-japonais` |
| Sencha - Thé vert (iodé & végétal) | `item-e3480392` | 4,00 € | remplacé par `m26-item-thes-verts-japonais` |
| Citron vert Sencha - Thé vert (fruité & végétal) | `item-e3480391` | 4,00 € | remplacé par `m26-item-thes-verts-japonais` |
| Fleur de Geisha - Thé vert (floral) | `item-e3480390` | 4,00 € | remplacé par `m26-item-thes-verts-japonais` |
| Grand jasmin Chun Feng - Thé vert (floral & végétal) | `item-e3480393` | 4,00 € | remplacé par `m26-item-thes-verts-japonais` |
| Blue mountain - Thé noir (fruité et floral) | `item-e3862601` | 4,00 € | retiré |
| Infusion Jardin Tropical | `item-e3480395` | 3,50 € | remplacé par `m26-item-infusions` |
| Infusion Jardin de Corail | `item-e3896125` | 3,50 € | remplacé par `m26-item-infusions` |
| Infusion Jardin d'eau | `item-e3897004` | 3,50 € | remplacé par `m26-item-infusions` |
| Infusion sur un nuage -Bio- | `item-e4112637` | 4,00 € | remplacé par `m26-item-infusions` |
| Gelée de yuzu en infusion | `item-e3480396` | 4,00 € | retiré |
| Gelée d'aloé véra en infusion | `item-e3509949` | 4,00 € | retiré |

### Café, latte & chocolat (`cat-cafe`)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Ristretto | `item-e3480397` | 1,90 € | retiré |
| Expresso, décaféiné | `item-e3480398` | 2,20 € | remplacé par `m26-item-cafe-expresso` |
| Café rallongé | `item-e3480400` | 2,60 € | retiré |
| Double café | `item-e3480403` | 3,60 € | remplacé par `m26-item-double-expresso` |
| Café noisette | `item-e3480401` | 2,50 € | retiré |
| Grand café | `item-e3480402` | 2,60 € | retiré |
| Grand café au lait | `item-e3480404` | 3,20 € | remplacé par `m26-item-cafe-au-lait` |
| Café viennois | `item-e3480405` | 3,60 € | retiré |
| Cappucino | `item-e3480406` | 3,50 € | retiré |
| Chocolat au lait | `item-e3480408` | 3,60 € | retiré |
| Chocolat viennois | `item-e3480409` | 4,60 € | retiré |

### Suppléments (menuExtra)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Chashu supplémentaire | `extra-chashu` | 3,00 € | remplacé par `m26-item-chashu-porc` |
| Œuf mariné | `extra-oeuf` | 1,50 € | remplacé par `m26-item-oeuf-marine-entier` |
| Portion de nouilles | `extra-nouilles` | 2,50 € | retiré |
| Nori (3 feuilles) | `extra-nori` | 1,00 € | retiré |
| Bambou mariné | `extra-bambou` | 1,50 € | retiré |

### Formules (menuFormule)

| Ancien article | Id | Prix | Statut |
|---|---|---|---|
| Menu Gyoza | `formule-gyoza` | 21,50 € | retiré |
| Menu Enfant « Little Tokyo » | `formule-enfant` | 9,50 € | remplacé par `m26-item-little-tokyo` |

## Photos reprises (cartes « Notre Menu » de l'accueil)

La photo (référence d'asset, avec hotspot/crop s'il y en a) est copiée de l'ancien document, qui garde la sienne. Une photo déjà présente sur un article m26 n'est jamais écrasée. Les autres nouveaux articles n'ont pas de photo.

| Nouvel article | Source | Asset | Statut |
|---|---|---|---|
| Gyozas (`m26-item-gyozas`) | ← « Gyoza porc » (`item-e3480244`) | `image-2eebf1e0022bd00cab0bfffe9e74413f8bef1710-2500x2101-jpg` | copiée |
| Tantan Ramen (`m26-item-tantan-ramen`) | ← « Tantan Ramen » (`item-e3480254`) | `image-8edb72dc28b31ed77c6dadb4722da6c2e68b3e7e-2500x2130-jpg` | copiée |
| Tokyo Ramen (`m26-item-tokyo-ramen`) | ← « Tokyo Ramen » (`item-e3480256`) | `image-6d0c99f112e1516eddc14be7cbf877c977baa0b0-2500x2130-jpg` | copiée |

## Corrections imprimé → web

| Où | Imprimé | Web | Raison |
|---|---|---|---|
| Bières > Bouteilles : Asahi Super Dry | Asashi Super Dry ~ 5° | Asahi Super Dry ~ 5° | Coquille évidente sur la marque Asahi (accord d'autonomie d'EK du 2026-11-23, point c). |
| Bières > Bouteilles : Coedo IPA | Coedo IPA ~ 4.5° | Coedo IPA ~ 4,5° | Virgule décimale française, comme les autres degrés de la carte. |
| Sakés japonais : Zaku | Zaku ~ 15.5° | Zaku ~ 15,5° | Virgule décimale française (les autres sakés sont imprimés « 15,5° »). |
| Cocktails signature : Natsu et Sakura Blossom | Natsu 9.00 / Sakura Blossom 8.50 | 9,00 € / 8,50 € | Format de prix : point décimal sur l'imprimé. Les prix sont stockés en nombres et affichés à la française. |
| Sakés japonais : Trio dégustation 3 × 6cl | description en points d'interrogation | Trois sakés sélectionnés par notre équipe. | Description absente de l'imprimé : texte du BAT (accord d'autonomie, point b). |
| Vins > Vins rouges : Année Lumière millésime 2023 | 12cl / 25cl / 50cl : prix en points d'interrogation | Prix sur demande | Prix absents de l'imprimé : jamais de points d'interrogation en ligne (accord d'autonomie, point a). |
| Entrées : Gyozas | RAVIOLIS GRILLÉS (sous-titre) + « Garniture au choix : poulet, porc ou légumes. » (ligne au-dessus des prix) | Raviolis grillés. Garniture au choix : poulet, porc ou légumes. | Un seul article Gyozas : le sous-titre et la ligne de garniture forment sa description. |
| Menu enfant (note après les deux choix) | Inclus: un sirop à l’eau et une boule de glace au choix. | Inclus : un sirop à l'eau et une boule de glace au choix. | Typographie française (espace avant les deux-points) et apostrophe droite. |
| Note de page (encadré vert de la page des plats) | faits maison,du bouillon | faits maison, du bouillon | Espace manquante après la virgule. Cette note vit dans les fichiers de messages (plan 12-01), pas dans ce JSON. |
| Cafés & Thés > Cafés : Japanese Coffee | Japanese Coffee : 8,90 | nom « Japanese Coffee », prix 8,90 € | Le « : » sépare le nom du prix : il ne fait pas partie du nom. |
| Spritz et Highball | Yuzu Spritz ~ 8,90 (de même pour les 4 spritz et les 2 highballs) | nom « Yuzu Spritz », prix 8,90 € | Le « ~ » entre le nom et le prix est un séparateur. Le « ~ » des degrés (« Asahi ~ 5° ») et de « Riesling Alsace ~ Sperry » fait partie du nom et reste. |
| Titres et sous-titres en capitales (catégories, Karaage, Gyozas, Takoyaki, Edamame, Udon) | ENTRÉES, KARAAGE, POULET MARINÉ ET FRIT MAISON, RAVIOLIS GRILLÉS, BOULETTES FONDANTES AU POULPE, FÈVES DE SOJA À LA FLEUR DE SEL, LE MIDI SEULEMENT | Entrées, Karaage, Poulet mariné et frit maison, Raviolis grillés, Boulettes fondantes au poulpe, Fèves de soja à la fleur de sel, Le midi seulement | Capitales de mise en page : stockées en casse normale, le site met en capitales par CSS. |
| Apostrophes | l’eau (apostrophe typographique) | l'eau | Apostrophe droite partout dans les données du menu. |

## À confirmer par EK (revue a posteriori)

1. Année Lumière millésime 2023 (vins rouges) : prix 12cl / 25cl / 50cl à fournir. En attendant, l'article affiche « Prix sur demande ».
2. Trio dégustation (sakés) : description provisoire « Trois sakés sélectionnés par notre équipe. » (texte du BAT, l'imprimé n'a pas de texte).
3. Coquille de marque corrigée sur la bière bouteille : « Asahi Super Dry » sur le web (orthographe de l'imprimé citée dans les corrections).
4. Pas de variante « 1/2 boules » sur l'imprimé du 2026-11-10 : « Boule de glace au choix » = 3,00 €, prix unique (l'unité « boule » est prête si besoin).
5. « Version végétarienne disponible » n'apparaît pas sur l'imprimé : le badge existe dans Studio mais n'est posé sur aucun plat (la mention végétarienne du Tantan avait déjà été jugée erronée par Loan en juillet).
6. Edamame : les deux pictos de l'imprimé sont lus comme « végétarien » (feuille) et « sans gluten » (épi barré).
7. Marqueur végétarien posé sur Yasai Ramen et Miso végétarien seulement (bouillon de légumes), pas sur Tofu Mazesoba : aucun picto sur l'imprimé.
8. Sirop à l'eau et Diabolo : 2 articles qui partagent la même liste de parfums.
9. Thés verts japonais et Infusions : stockés comme articles avec leur prix (pas de sous-titre en plus, il répéterait le nom).
10. Menu enfant : le prix 9,90 € du titre est porté par les deux choix (Little Tokyo, Mini Ramen).
11. Lignes producteur ou domaine stockées en description (Chardonnay Naturalys : « Gérard Bertrand » ; Année Lumière : « Domaine Le Clos des Lumières ») ; « Riesling Alsace ~ Sperry » gardé tel qu'imprimé.
12. Photos : les 3 photos des cartes « Notre Menu » de l'accueil sont reprises des anciens articles masqués (Gyoza porc → Gyozas, Tantan Ramen → Tantan Ramen, Tokyo Ramen → Tokyo Ramen). Les autres nouveaux plats n'ont pas de photo : EK peut en ajouter dans Studio, une nouvelle synchronisation ne les écrase jamais.
13. EN/DE : les nouveaux plats et catégories sont en français seulement jusqu'à la phase 14 (les pages EN/DE affichent le français en attendant).
14. 7 catégories ont un slug suffixé « -2026 » (unicité des slugs dans Studio) : entrees, mazesoba, udon, menu-enfant, desserts, thes-glaces, softs.
15. « oeuf » / « œuf » gardés tels qu'imprimés (Oeuf mariné entier, Oeuf onsen, « demi-oeuf » sur Yasai Ramen et Miso végétarien).
- Slug suffixé : catégorie « Entrées » → `entrees-2026` (`entrees` est pris par `cat-entrees`).
- Slug suffixé : catégorie « Mazesoba » → `mazesoba-2026` (`mazesoba` est pris par `cat-mazesoba`).
- Slug suffixé : catégorie « Udon » → `udon-2026` (`udon` est pris par `cat-udon`).
- Slug suffixé : catégorie « Menu enfant » → `menu-enfant-2026` (`menu-enfant` est pris par `cat-menu-enfant`).
- Slug suffixé : catégorie « Desserts » → `desserts-2026` (`desserts` est pris par `cat-desserts`).
- Slug suffixé : catégorie « Thés glacés » → `thes-glaces-2026` (`thes-glaces` est pris par `cat-thes-glaces`).
- Slug suffixé : catégorie « Softs » → `softs-2026` (`softs` est pris par `cat-softs`).

## Retour arrière (rollback)

Commande exacte :

```
node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback --backup .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-201142.json
```

Ce qu'elle fait : écrit d'abord une sauvegarde de sécurité (`-pre-rollback`), remet pour chaque ancien document (menuItem, menuExtra, menuFormule) la valeur `available` de la sauvegarde (ou retire le champ s'il n'existait pas), puis supprime tous les documents `m26-*` (articles puis catégories), en une transaction. Ajouter `--dry-run` pour voir le plan (`ROLLBACK PLAN ... restore=<n> delete=<n>`) sans rien écrire.

## Vérification en ligne

> Section ajoutée à la main après `--apply` (plan 12-03). Un nouveau `sync-menu.mjs --dry-run` ou `--apply` régénère ce rapport et la supprime : la recopier si besoin (phase 14).

- **Date** : 2026-11-23. Synchronisation appliquée à 20:11:47 UTC, site en ligne à jour à 20:15:57 UTC.
- **Code en ligne** : commit `34748ef` sur le VPS (code Phase 12, déployé par SSH avant toute écriture). Le code a d'abord été vérifié avec l'ancien menu (`--expect legacy` OK en FR/EN/DE et sur l'accueil). Point de retour du code : `2523057`.
- **Sauvegarde avant écriture** : `.planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-201142.json` (200 documents : 167 menuItem, 26 menuCategory, 5 menuExtra, 2 menuFormule).
- **Transaction** : `PS4gSiVcUV6cnzSF8ooJME`, `POST-APPLY CHECK OK`.
- **Rafraîchissement du cache** : échelon **b**, `node --env-file=.env.local scripts/menu-2026/revalidate.mjs` (POST signé sur `/api/revalidate` pour menuCategory, menuItem, menuExtra et menuFormule, 4 × HTTP 200). L'échelon a (attente d'un webhook Sanity) n'a rien donné en 4 minutes : aucun webhook Sanity ne rafraîchit umai-ramen.fr aujourd'hui. Pour publier un changement de menu (phase 14 comprise) : `sync-menu.mjs --apply`, puis `revalidate.mjs`.
- **Contrôles en ligne** (`scripts/menu-2026/verify-live.mjs`, attendu `m26` : ordre de l'imprimé, chaque prix lié à son article, descriptions, libellés japonais, notes, badge, rien de l'ancien menu, aucune formule, aucun `??` ni « Asashi ») :

```
VERIFY OK target=https://umai-ramen.fr/fr/menu locale=fr expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/en/menu locale=en expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/de/menu locale=de expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/fr locale=fr expect=m26 home checks=8
VERIFY OK target=https://umai-ramen.fr/en locale=en expect=m26 home checks=10
VERIFY OK target=https://umai-ramen.fr/de locale=de expect=m26 home checks=10
```

- **Accueil** : les 3 cartes « Notre Menu » (Entrées, Tantan Umaï, Ramen) affichent leurs 3 photos servies par cdn.sanity.io ; la signature Tantan affiche 15,90 €. La page menu n'affiche aucune image Sanity, comme avant.
- **JSON-LD en ligne** : 20 sections, 77 articles, une offre par variante (Karaage 3, Asahi 2, Riesling 2, Trio « 3 × 6cl » 1) et aucune offre pour Année Lumière (« Prix sur demande »).
- **Sanity (lecture seule, après écriture)** : 77 articles `m26-` visibles, dont 3 avec photo ; 20 catégories `m26-` ; 174 anciens documents masqués (`available=false`), 0 ancien article ou extra visible, 0 formule visible ; 26 anciennes catégories et les 200 documents de la sauvegarde toujours présents (rien supprimé) ; les 3 anciens articles sources gardent leur photo (copie, pas déplacement) ; 0 brouillon ; un seul « Tantan Ramen » visible.
- **Retour arrière testé à blanc** : `--rollback --dry-run` → `ROLLBACK PLAN backup=…/menu-backup-20261123-201142.json restore=174 delete=97`, aucune écriture.

Retour arrière complet si besoin :

```
node --env-file=.env.local scripts/menu-2026/sync-menu.mjs --rollback --backup .planning/phases/12-synchronisation-menu-print-2026-sanity/backup/menu-backup-20261123-201142.json
node --env-file=.env.local scripts/menu-2026/revalidate.mjs
node scripts/menu-2026/verify-live.mjs --locale fr --expect legacy --retries 6 --interval 20
```

Si `revalidate.mjs` répond 401, relancer avec le secret du VPS : `SANITY_WEBHOOK_SECRET="$(ssh umai-app "grep '^SANITY_WEBHOOK_SECRET=' /home/ek/apps/umai/.env.local | cut -d= -f2-")" node scripts/menu-2026/revalidate.mjs`. Si la page reste ancienne, redémarrer le conteneur web, qui repart avec un cache vide : `ssh umai-app 'cd /home/ek/apps/umai && docker compose -p umai up -d --force-recreate --no-deps web'`. Vérifier ensuite avec `verify-live.mjs --expect legacy --retries 10 --interval 30`.
