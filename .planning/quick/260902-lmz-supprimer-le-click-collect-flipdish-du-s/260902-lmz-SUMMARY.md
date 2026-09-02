---
quick_id: 260902-lmz
description: Supprimer le Click & Collect Flipdish du site
date: 2026-09-02
status: complete
---

# Summary — Suppression du Click & Collect Flipdish

## Pourquoi
Umai ne travaille plus avec Flipdish. Retour de Loan : plusieurs clients sont
passés directement par le site. Le lien `my.flipdish.com/umai-ramen/order`
n'avait donc plus lieu d'être.

Flipdish étant le seul fournisseur Click & Collect branché, l'option entière a été
retirée plutôt que laissée vide (elle serait tombée sur le fallback
« Bientôt disponible », trompeur pour le client).

## Ce qui a changé
| Fichier | Changement |
|---|---|
| `src/app/(site)/[locale]/commander/page.tsx` | Carte C&C supprimée, grille 3 → 2 colonnes, `BagIcon` retiré |
| `src/components/order/OrderModal.tsx` | Option `clickCollect` retirée du modal de commande |
| `src/app/(site)/[locale]/layout.tsx` | `clickCollect` retiré des `orderUrls` |
| `src/app/(site)/[locale]/page.tsx` | `clickCollectUrl` retiré des types + `orderUrls` |
| `src/sanity/lib/queries.ts` | `clickCollectUrl` retiré de `SITE_SETTINGS_QUERY` et `HOMEPAGE_QUERY` |
| `src/sanity/schemaTypes/siteSettings.ts` | Champ `clickCollectUrl` supprimé du schema |
| `scripts/seed-sanity.mjs` | URL Flipdish retirée du seed |
| `src/messages/{fr,en,de}.json` | Clés `commander.clickCollect*` et `orderModal.clickCollect*` supprimées |

## Canaux restants
- **Uber Eats** — livraison
- **Obypay** — à emporter
- **Eazee-Link** — carte digitale
- **Gusty** — réservation

## Vérification
- `grep -rni "flipdish\|clickCollect" src scripts` → aucun résultat
- `npx next build` → build vert (44 routes)
- Note : le `prebuild` (`sanity typegen`) échoue déjà avant ce changement —
  pas de `sanity.config.ts` à la racine. Non lié.

## Reste à faire (hors code)
- Le champ `clickCollectUrl` peut encore exister dans le dataset Sanity ;
  plus aucune requête ne le lit, donc sans effet. À purger dans le Studio si souhaité.
