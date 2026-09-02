---
quick_id: 260902-lmz
description: Supprimer le Click & Collect Flipdish du site
date: 2026-09-02
mode: quick
---

# Quick Task 260902-lmz — Supprimer le Click & Collect Flipdish

## Contexte

Umai ne passe plus par Flipdish pour le click & collect. Retour de Loan : plusieurs
clients sont passés directement par le site. Le lien Flipdish
(`https://my.flipdish.com/umai-ramen/order`) doit disparaître du site public.

Flipdish était le seul fournisseur C&C câblé : supprimer le lien revient à supprimer
l'option Click & Collect. Les autres canaux restent en place — Uber Eats (livraison),
Obypay (à emporter), Eazee-Link (carte digitale).

## Tâches

### T1 — Retirer l'option Click & Collect du front
- **files:** `src/app/(site)/[locale]/commander/page.tsx`, `src/components/order/OrderModal.tsx`,
  `src/app/(site)/[locale]/layout.tsx`, `src/app/(site)/[locale]/page.tsx`
- **action:** supprimer la carte C&C de /commander (grille 3 → 2 colonnes, icône `BagIcon`
  devenue inutile), l'option `clickCollect` de `OrderModal`, et le champ des types/props amont.
- **verify:** `grep -ri clickCollect src/app src/components` ne retourne rien
- **done:** aucune mention de C&C rendue sur /commander ni dans la modale de commande

### T2 — Retirer le champ côté données + i18n
- **files:** `src/sanity/schemaTypes/siteSettings.ts`, `src/sanity/lib/queries.ts`,
  `scripts/seed-sanity.mjs`, `src/messages/{fr,en,de}.json`
- **action:** supprimer le champ `clickCollectUrl` (schema, GROQ, seed) et les clés
  i18n `commander.clickCollectTitle/Desc` + `orderModal.clickCollect/clickCollectDesc`.
- **verify:** `grep -ri flipdish src --include='*.ts*' --include='*.json'` vide ; build OK
- **done:** plus aucune trace de Flipdish dans le code applicatif

### T3 — Vérification build
- **action:** `npm run build`
- **done:** build vert

## Must-haves
- Le lien `my.flipdish.com` n'est plus servi nulle part sur le site.
- Les canaux Uber Eats / Obypay / Eazee-Link restent fonctionnels.
- Le build Next.js passe.

## Note
La valeur `clickCollectUrl` peut subsister dans le dataset Sanity ; elle n'est plus
lue par aucune requête, donc sans effet. Elle pourra être purgée dans le Studio.
