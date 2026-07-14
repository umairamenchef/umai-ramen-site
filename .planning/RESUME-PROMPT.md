# RESUME PROMPT — Umaï Ramen v2.1 (post-/clear)

Copie-colle ce prompt après un `/clear` pour reprendre le travail avec le contexte complet.

---

Tu reprends le projet **Umaï Ramen — site web 2026** (`/Users/ekitcho/Desktop/dev-claude-lab/umai2026`), milestone GSD **v2.1 = mise en ligne production & bascule umai-ramen.fr**. Lis d'abord `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/08-audit-go-live/08-AUDIT-GAP-LIST.md`. Travaille en autonomie (EK édite/corrige au feedback), commit par chemin (JAMAIS `git add -A` ni les fichiers infra), déploie et vérifie en live à chaque étape.

## Stack & déploiement
- Next.js 16.1.6 / React 19.2 / Sanity v5 (projet `c7twe801`, dataset `production`) / next-intl 4.8 (FR/EN/DE) / Tailwind 4. `proxy.ts` (src/proxy.ts, matcher path-based). Studio à /studio.
- Repo GitHub `umairamenchef/umai-ramen-site`, branche **`v2-2026`**. **Deploy = `git push origin v2-2026`** → webhook HMAC sur le VPS → `git reset --hard` + `docker compose up -d --build web` (rebuild ~2-3 min). SSH alias **`umai-app`**.
- Vérif live après deploy : attendre la recréation du container (`docker inspect -f {{.State.StartedAt}} umai-web-1`), puis `curl https://umai.turfu.in/...`. Les changements **Sanity** (données) passent en ISR ~60s sans rebuild.
- **Token d'écriture Sanity** (pour muter données) : `ssh umai-app 'grep -m1 "SANITY_TOKEN=" /home/ek/apps/umai/docker-compose.yml | sed "s/.*SANITY_TOKEN=//;s/[\" ]//g"'` → passer en env `SANITY_WRITE_TOKEN`, NE JAMAIS l'afficher/commit. API mutate : `POST https://c7twe801.api.sanity.io/v2021-06-07/data/mutate/production` (Bearer). Query publique : `https://c7twe801.apicdn.sanity.io/v2021-10-21/data/query/production?query=...`.
- `.env.local`, `docker-compose.yml`, `Caddyfile`, `Dockerfile` vivent sur l'hôte (`/home/ek/apps/umai/`), NON trackés git — les éditer via ssh, jamais via git.

## Fait & déployé (umai.turfu.in) — ne pas refaire
- **Audit go-live** complet (AUDIT-01..07 ✓) + dossier cutover.
- **Carte reconstruite** depuis eazee-link (source de vérité, sticker `GIK39GHKQZ`, API `api-menu.vazeetap.com/v2/public/stickers/GIK39GHKQZ/menu`) : **167 menuItems + 26 menuCategories** (plats+desserts+menus+extras+boissons), prix exacts, catégories FR/EN/DE. CONTENT-02 ✓.
- **Pages légales** remplies FR/EN/DE : éditeur **MOKORITA** SAS (SIREN 892 691 619, SIRET 892 691 619 00019, capital 20 000 €, RCS Strasbourg, APE 5610A), directeur pub **Christopher Keopraseuth (DG & co-fondateur) — EK SARL**, hébergeur Hostinger, contact@umai-ramen.fr. CONTENT-04 ✓.
- **Notre Histoire** : 4 sections avec photos Nis&For (page `page-notre-histoire`). Galerie = 9 photos (OK). CONTENT-01/03/05/06 ✓.
- **i18n** : traductions EN/DE des leaks + **ré-accentuation complète FR/DE** (Straßburg, etc.). og-image 1200×630. **bundle-analyzer** branché (DEBT-02 ✓).
- **Popup « Commander » à 3 choix** (Livraison Uber Eats / À emporter obypay / Click&Collect Flipdish) : composants `src/components/order/{OrderModal,OrderButton}.tsx`, câblés Header/MobileBar/Footer/MobileMenu, liens Sanity siteSettings (`uberEatsUrl`/`obypayUrl`/`clickCollectUrl`), i18n `orderModal`. Champ `obypayUrl` ajouté au schéma + valeur en base.

## À FAIRE (ordre suggéré)
1. **Finaliser le Hero** sur la popup : `src/components/home/Hero.tsx` et `src/app/(site)/[locale]/page.tsx` utilisent encore `uberEatsUrl` en lien direct. Les passer sur `<OrderButton urls={orderUrls}>` (buttonClasses('outline-white')). Le home page doit fetch `obypayUrl`+`clickCollectUrl` (la HOME query `src/sanity/lib/queries.ts` ligne ~53 ne sélectionne que `uberEatsUrl` sous settings) et passer `orderUrls` au Hero.
2. **3 points contenu d'EK** :
   a. **Story/texte fondateur** (nouilles maison, bouillons 6h, formation au Japon par grands chefs ramen, 100% local & fait-maison) → enrichir Notre Histoire (`page-notre-histoire` sections) + teaser home ; FR/EN/DE.
   b. **Tantan = spécialité signature Umaï** (belles photos tantan dispo dans `ig-studio/photos/`, ex. umai_009) → bloc « signature » sur la home + mise en avant du Tantan dans la carte (photo sur le menuItem `Tantan Ramen`).
   c. **Carte d'été à promouvoir cet été** → bandeau/section « Été » sur la home. (La carte d'été 2026 : PDF `~/Downloads/UMAI_MENU_ETE2026_210x300 (1).pdf` — Hiyashi Chuka, tsukemen Gyokai/Curry Tomato ; pas dans l'eazee actuel.)
3. **Dette restante** : DEBT-01 (footer câblé aux constantes NAP `src/lib/seo.ts`), DEBT-03 (réduire JS first-load / mesurer via `ANALYZE=true npm run build`), DEBT-04 (correctifs bloquants audit).
4. **Affinages carte** (edit later, non bloquant) : traductions EN/DE des 167 plats (actuellement noms fr pour les 3 langues, descriptions fr avec fallback), tags végé/sans-gluten par plat (posés à l'estime), photos plats.
5. **CUTOVER (Phase 11, seulement sur « go cutover » d'EK)** : ajouter bloc Caddy `umai-ramen.fr` + `www.umai-ramen.fr` (www→apex 301) sur l'hôte ; flip `NEXT_PUBLIC_BASE_URL=https://umai-ramen.fr` dans docker-compose.yml + .env.local + **rebuild** (var build-time) ; bascule DNS GitHub Pages (`185.199.10x.153`)→VPS (`76.13.61.239`), TTL bas, fenêtre courte ; redirections anciennes URLs (ancien site = one-pager, redirect `/`→`/fr`) ; post-cutover 301 turfu.in→umai-ramen.fr (anti-duplicate SEO) ; vérifs (TLS, Lighthouse>90, CWV, sitemap, JSON-LD, flux commander/réserver) ; Search Console. Runbook détaillé dans `08-AUDIT-GAP-LIST.md §1.3`. Rollback = revert DNS.

## Confirmations en attente d'EK (non bloquantes)
- contact@umai-ramen.fr : boîte active ?
- « EK SARL » : simple mention (fait) ou entité éditrice distincte (→ son SIREN) ?
- Périmètre carte confirmé : plats+boissons+extras (fait).

## Statut requirements v2.1 (maj 2026-07-14 session 2)
AUDIT 7/7 ✓ · CONTENT 6/6 ✓ · **DEBT 4/4 ✓** (01 footer NAP, 02 analyzer, 03 first-load JS mesuré ~228KB/floor documenté, 04 blockers audit clos) · CUTOVER 0/7. Reste avant go-live : rien de bloquant côté code/contenu — **CUTOVER (Phase 11) sur « go cutover »** uniquement.

### Fait session 2 (tout déployé + vérifié live umai.turfu.in) — ne pas refaire
- Hero CTA → modale Commander (d85b741).
- Story fondateur : 4 bodies Notre Histoire remplis FR/EN/DE (Sanity) ; teaser home enrichi.
- Tantan signature : `SignatureSection` home (photo `public/signature-tantan.jpg`, prix live) + photo umai_022 sur menuItem Tantan (Sanity).
- Bandeau « Carte d'été » : `SummerBanner` home. i18n `signature*`/`summer*` FR/EN/DE.
- DEBT-01 footer NAP→seo.ts (8166a38). DEBT-03/04 documentés/clos.
- ⚠️ CONFIRM EK : bouillons **6h** (aligné partout ; brief=6h, ancien site=12h).

### Reste « edit-later » (non bloquant, cf. §À FAIRE.4)
Trad EN/DE des 167 plats (noms+desc, actuellement fallback FR) · tags végé/sans-gluten à l'estime · photos plats manquantes · contact@umai-ramen.fr à confirmer actif · EK-SARL entité.
