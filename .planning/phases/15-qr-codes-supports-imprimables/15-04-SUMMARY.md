---
phase: 15-qr-codes-supports-imprimables
plan: 04
subsystem: deploy
tags: [deploy, ssh, docker, live-verification, qr, sanity, usecdn, freshness-probe, exaprint, playwright]

requires:
  - phase: 15-qr-codes-supports-imprimables
    provides: "15-01: QR contract + 10 code files + verify.mjs --urls; 15-02: A4 / A6 PDFs + 1 mm / 2 mm variants + pdftool checks; 15-03: /menu/qr page, X-Robots-Tag, useCdn: false, probe-freshness.mjs, verify-site.mjs, qr-mobile-check.mjs (scratch)"
  - phase: 13-fondations-multilingues-page-menu-touriste
    provides: "manual SSH deploy gated on PUSHED, verify-routing.mjs, verify-live.mjs, deferred item 3"
  - phase: 14-traductions-en-de-it-zh
    provides: "translated menus live (verify-translations.mjs)"
provides:
  - "Phase 15 live on umai-ramen.fr: deployed 475c880 (rollback point 86068ab)"
  - "Live proof of QR-01..04: 10 files + 35 printed codes decode to the 5 live menu URLs (200, no redirect, right <html lang>), /menu/qr in 5 locales with 14 working downloads, every /qr/* file byte-identical with X-Robots-Tag noindex"
  - "Live proof of the Sanity freshness fix: FRESHNESS OK check-on-attempt=1 control-cdn-stale=true; Phase 13 deferred item 3 RESOLVED"
  - "French hand-off for EK: download links, real-phone scan checklist, A4 printing, Exaprint order (which A6 file per bleed), regeneration, Studio publishing without the 2-minute wait, rollback"
affects: [future Studio menu edits (write then revalidate.mjs at once), EK's Exaprint order and real-phone scan]

tech-stack:
  added: []
  patterns:
    - "Deploy gate against PUSHED (captured just before the push), smoke with retries, then the full live verifier set"
    - "Production content probe with an API CDN control: a fresh page while the CDN is provably stale shows the page read the origin API"

key-files:
  created:
    - .planning/phases/15-qr-codes-supports-imprimables/backup/freshness-backup-20261124-003415.json
  modified:
    - .planning/phases/13-fondations-multilingues-page-menu-touriste/deferred-items.md

key-decisions:
  - "Phase 15-04: Phase 15 deployed (475c880, rollback 86068ab), first try, no Google Fonts flake; docs commits after it ride with the next push (no site code)"
  - "Phase 15-04: the Sanity freshness fix is live and proven (FRESHNESS OK check-on-attempt=1 control-cdn-stale=true): publishing Sanity content = write, then revalidate.mjs at once, no 2-minute CDN wait"
  - "Phase 15-04: QR-01 ticked on the automated proof (decode of all files and printed codes + live 200 / no redirect / <html lang>); EK's real-phone scan is the post-hoc check of the hand-off. Exaprint A6 file = the one whose bleed matches the product page (3 mm default, 1 mm flyers, 2 mm other products)"

patterns-established:
  - "Studio -> site publish since 475c880: publish, then node --env-file=.env.local scripts/menu-2026/revalidate.mjs (fresh on the next request)"

requirements-completed: [QR-01, QR-02, QR-03, QR-04]  # QR-01: decoded automatically and live 200 on 2026-11-24; real-phone scan = EK post-hoc check

duration: 10min
completed: 2026-11-24
---

# Phase 15 Plan 04: Deploy, live proof and EK hand-off Summary

**Phase 15 is live on umai-ramen.fr (475c880).**
- **Codes:** all 10 QR files and the 35 printed codes decode to the five live menu URLs.
- **`/menu/qr`:** answers in five locales with its 14 downloads, noindex, the files byte-identical to the repo.
- **No regression:** routing, the five menus, the home and the translations are unchanged.
- **Freshness fix:** a Sanity write followed by an immediate revalidation showed on /it/menu on the first request, while the API CDN still served the old value. It was then restored exactly.

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-24T00:27:22Z
- **Completed:** 2026-11-24T00:37Z
- **Tasks:** 2/2 (Task 1 = deploy, no commit; Task 2 = live proof + docs commit)
- **Files:** 1 created (probe backup), 1 modified (`deferred-items.md`)

## Rollback points and deployed commit

| What | Value | How |
|---|---|---|
| Code (VPS) before the deploy | `86068ab66230e6af6f9c917d4109fa44ef440ed0` (Phase 13 deploy; Phase 14 pushed no code) | `ssh umai-app 'cd /home/ek/apps/umai && git reset --hard 86068ab && docker compose -p umai up -d --build web'` |
| Deployed (`PUSHED`) | `475c880550d77fcfd4a7db530a22b70e0564509f` | VPS `git rev-parse HEAD` = `origin/v2-2026` = PUSHED (re-read after the probe); container `umai-web-1` recreated 2026-11-24 00:32:18 UTC |
| Content (Sanity) | unchanged by this plan | probe restored `name.it = "Karaage"`, final read identical to `backup/freshness-backup-20261124-003415.json` (apart from `_rev` / `_updatedAt`) |

After the deploy, only the docs commit `554cc98` and this plan's metadata commit exist locally. Neither touches site code: they ride with the next push, and no redeploy is needed.

## Accomplishments

- **QR-01:** the 5 code files (SVG + PNG) decode to `https://umai-ramen.fr/{fr,en,de,it,zh}/menu`. Each URL answers 200 live with no redirect, the right `<html lang>` (zh-Hans for zh) and the menu switcher.
- **QR-02 / QR-03:** the A4 sheet, the 3 mm A6 card and its 1 mm / 2 mm variants are downloadable live. They are byte-identical to the verified repo files, and all 35 printed codes decode at 300 dpi.
- **QR-04:** `/fr|en|de|it|zh/menu/qr` answers 200 with:
  - `noindex, nofollow`, no hreflang, absent from the sitemap (38 URLs);
  - the 5 labelled codes and 14 working downloads (at least 44 px at 375 px, no horizontal scroll).
- **No regression:** `ROUTING OK checks=84`, `VERIFY OK` on the 5 menus and the fr home, `VERIFY TRANSLATIONS OK locales=5`.
- **Sanity freshness (Phase 13 deferred item 3):** fixed and proven live, so Studio edits no longer need the 2-minute wait.

## Task Commits

1. **Task 1: pre-push sanity, secret scan, push, manual SSH deploy, gate against PUSHED**: no commit (deploy only). Deployed `475c880`.
2. **Task 2: live proof, freshness probe, deferred item 3, hand-off**: `554cc98` (docs: probe backup + `deferred-items.md`).

**Plan metadata:** final `docs(15-04)` commit (this SUMMARY, STATE, ROADMAP, REQUIREMENTS).

## Evidence

### Task 1: pre-push sanity, deploy and gate

```
15-03-SUMMARY.md present; git status --porcelain -- src scripts public package.json package-lock.json next.config.ts: empty
code commits after the Plan 03 gate (76c2d99..HEAD -- src public next.config.ts package*.json): none (gate still valid)
npx tsc --noEmit exit 0 | node --test (qr, menu, locales) 72/72 | MESSAGES OK checks=1818
QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15 variants=2 variantCodes=20 checks=337
live negative control before the deploy: https://umai-ramen.fr/fr/menu/qr -> 404
VPS HEAD before the deploy (rollback point): 86068ab66230e6af6f9c917d4109fa44ef440ed0 (umai-web-1 Up 2 hours)
secret scan (git log -p origin/v2-2026..HEAD, 18 commits): SANITY_TOKEN 0, SANITY_WEBHOOK_SECRET 0, DEPLOY_WEBHOOK_SECRET 0, IG_STUDIO_PASSWORD 0
PUSHED=475c880550d77fcfd4a7db530a22b70e0564509f   f125909..475c880  v2-2026 -> v2-2026   (no postBuffer retry needed)
origin/v2-2026 = PUSHED
deploy 00:28:20 -> 00:32:20 UTC: git reset --hard 475c880; [deps] npm install "added 1133 packages" (lockfile with qrcode + jsqr);
  [builder] next build "Compiled successfully", 50/50 static pages, ● /[locale]/menu/qr (/fr, /it, /zh [+2]);
  Image umai-web Built / Container umai-web-1 Recreated / Started  (first try, no next/font/google flake)
VPS = origin = PUSHED: OK
smoke attempt 1: /fr=200 /fr/menu=200 /fr/menu/qr=200 /zh/menu/qr=200 /qr/umai-qr-a4.pdf=200 /studio=200
TASK1 (15-04) VERIFY PASS
```

### Task 2: live proof

```
QR VERIFY OK assets=10 pdfFiles=2 pdfCodes=15 urls=5 variants=2 variantCodes=20 checks=352
QR SITE OK base=https://umai-ramen.fr checks=248          (first run, no retry)
ROUTING OK base=https://umai-ramen.fr checks=84
VERIFY OK target=https://umai-ramen.fr/fr/menu locale=fr expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/en/menu locale=en expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/de/menu locale=de expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/it/menu locale=it expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/zh/menu locale=zh expect=m26 checks=309
VERIFY OK target=https://umai-ramen.fr/fr locale=fr expect=m26 home checks=8
VERIFY TRANSLATIONS OK locales=5
QR MOBILE OK   (live, 375 px, 5 locales: scrollWidth 375, 5 images loaded, 14 targets: SVG/PNG 98-99x46,
                A4 277x44, A6 card 277x64, variants 277x46 (de 277x66), robots "noindex, nofollow")
TASK2 (15-04) VERIFY PASS  (the plan's <verify>, re-run after the docs commit)
```

Sample live headers: `/qr/umai-qr-chevalet-a6-fp2mm.pdf` answers `HTTP/2 200`, `content-type: application/pdf`, `x-robots-tag: noindex, nofollow`, `content-length: 125933`. `/fr/menu/qr` carries `<meta name="robots" content="noindex, nofollow"/>`.

`QR SITE OK` live covers:
- **Per locale:** 200, `<html lang>`, one robots meta, 0 hreflang alternates, the `<h1>`, the `lang="en"` wrapper only on it/zh, card order, labels in their `lang`, display URLs, localized `<img>` alts, exactly 14 download links.
- **Redirect:** `/menu/qr` answers 307 to `/fr/menu/qr`.
- **The 14 files (incl. the 2 Exaprint variants):** 200, content type, `X-Robots-Tag` noindex, sha256 equal to `public/`.
- **Sitemap and menu:** 38 sitemap URLs without `/menu/qr`; `/fr/menu` neither links to nor declares a `/menu/qr` URL.

### Screenshots (live, 375 px, read)

The fr and zh screenshots match the local ones of 15-03.
- **fr:** « QR CODES DU MENU », the dashed divider, the intro and the « Menu en français » card with its code.
- **zh:**
  - the « 中文菜单 » card shows real CJK glyphs, its code, `umai-ramen.fr/zh/menu` and the SVG / PNG buttons;
  - the English formats hint follows;
  - « PRINT FILES » shows « A4 SHEET (PDF) », « A6 TABLE CARD, BOTH SIDES (PDF) », « This file has a 3 mm bleed… » and « 1 MM BLEED (PDF) » / « 2 MM BLEED (PDF) ».
- Nothing is cut or overflowing. The fixed cookie banner (fr text on /fr) sits over the first card only because the screenshot is full-page.

### Sanity freshness probe (production write, autonomy grant, backup + exact restore)

Pre-checks:
- the deployed `src/sanity/lib/client.ts` has 1 × `useCdn: false` (`git show HEAD:` on the VPS);
- live `/it/menu` had 0 `PROBE-`.

Probe run:

```
Target: Sanity c7twe801/production, page https://umai-ramen.fr/it/menu, field m26-item-karaage name.it
BEFORE name.it = "Karaage" (rev lWwPwzVj4paFn3vV2NnUyI)
BASELINE OK /it/menu 200, no PROBE- (x-nextjs-cache HIT)
BACKUP .planning/phases/15-qr-codes-supports-imprimables/backup/freshness-backup-20261124-003415.json
PRIMED API CDN with the pre-write menu (name.it "Karaage")
PROBE APPLIED rev lWwPwzVj4paFn3vV2OdY22 marker « Karaage PROBE-20261124-003415 »
revalidate menuCategory -> 200 · menuItem -> 200
CHECK-ON OK attempt 1/3 (x-nextjs-cache MISS)
CONTROL API CDN stale=true 7s after the write (name.it "Karaage")
PROBE REVERTED rev lWwPwzVj4paFn3vV2OdaYQ
revalidate menuCategory -> 200 · menuItem -> 200
CHECK-OFF OK attempt 1/3 (x-nextjs-cache MISS)
FINAL READ OK: m26-item-karaage identical to the backup (apart from _rev/_updatedAt), name.it = "Karaage"
FRESHNESS OK check-on-attempt=1 control-cdn-stale=true
```

Both proof conditions hold at once:
- the page was fresh on the very first request after the revalidation;
- at that moment the API CDN still served the pre-write « Karaage », so the page's data came from the origin API.

In 13-03, the same sequence through the CDN failed 10 checks in a row.

After the probe:
- `/it/menu` has 0 `PROBE-` and gives `VERIFY OK … it … checks=309`;
- the backup holds the document only, with 0 hits for the 4 `.env.local` secrets.

`deferred-items.md` item 3 now carries the `RESOLVED in 15-03 / 15-04` line (commit `c23653a`, deploy `475c880`). Nothing else in that file changed.

### Phase 14 status at deploy time

The translated menus are live:

| Page | `data-fr-name` occurrences (HTML + RSC payload) | FR secondary lines in the markup |
|---|---|---|
| /en/menu | 50 | 25 |
| /de/menu | 52 | 26 |
| /it/menu | 52 | 26 |
| /zh/menu | 51 | 26 |

These are the same line counts as 14-03 (`VERIFY TRANSLATIONS OK locales=5` again today). The real-phone scan and the Exaprint order therefore do not need to wait.

## Gaps

None. The freshness probe passed on both proof conditions. Under the autonomy grant, the real-phone scan of QR-01 is EK's post-hoc check (hand-off item 2), not a gap.

## Decisions Made

See `key-decisions`:
- deployed first try, with rollback point `86068ab`;
- Studio publishing without the CDN wait, now proven;
- QR-01 ticked on the automated proof, with the phone scan handed to EK;
- the A6 file to send depends on the bleed of the Exaprint product page.

## Deviations from Plan

### Orchestrator additions (in scope by instruction)

**1. Exaprint variants in the live checks.** The live `/qr/*` checks cover 14 files (the 12 of `qrAllAssetPaths()` plus the 2 `QR_TENT_VARIANTS` PDFs) through `verify-site.mjs`. The live mobile check expects 14 downloads. The hand-off says which A6 file fits which Exaprint product.

**2. Extra live regressions.** `node scripts/menu-2026/verify-translations.mjs` (`VERIFY TRANSLATIONS OK locales=5`) was run on top of the plan's routing and menu checks.

### Process

**3. Scratch folder.** `pushed-sha.txt`, `rollback-sha.txt`, `deploy.log`, `freshness-run.log`, `qr-mobile-check.mjs` and the live screenshots are in the session scratchpad. The full path is `/private/tmp/claude-501/-Users-ekitcho-Desktop-dev-claude-lab-umai2026/138dd2fa-f644-4f9d-8363-b9a38aa26c48/scratchpad/umai-15/`, used instead of `${TMPDIR:-/tmp}/umai-15/` (environment rule, same as 15-03). The plan's `<verify>` commands were run with that path.

**4. Deploy in the background.** The SSH deploy outlived the tool's 180 s foreground window and finished in the background (exit 0, 00:32:20 UTC). Meanwhile the VPS was checked once (HEAD `475c880`, `umai-web-1 Up 26 seconds`), as the guardrail's poll suggests.

---

**Total deviations:** 2 orchestrator additions, 2 process notes. **Impact on plan:** none on the planned outputs; the variants add live checks.

## Issues Encountered

None. The push needed no `http.postBuffer` retry, and the image build did not hit the Google Fonts flake.

## Known Stubs

None.

## User Setup Required

EK (post-hoc, see the French hand-off):
1. the 5-minute real-phone scan;
2. the Exaprint order of the A6 card.

Optional: an A4 office print.

## Next Phase Readiness

- Phase 15 has all 4 plans complete. QR-01..04 are proven live and ticked.
- Open from earlier phases (unchanged): the GitHub deploy webhook (manual SSH deploy still required).
- Not pushed: `554cc98` and the metadata commit (docs only).

---

## Remise à EK (FR)

**En ligne depuis le 24/11/2026 (commit 475c880).** Les QR codes du menu, leur page de téléchargement et les fichiers d'impression sont sur le site.

### 1. Où trouver les fichiers

- **La page à garder en favori :** https://umai-ramen.fr/fr/menu/qr. Google ne la référence pas et aucun lien du site n'y mène : garde le lien. Elle marche aussi sur téléphone, et en anglais ou en allemand (`/en/menu/qr`, `/de/menu/qr`).
- **Les 5 QR codes** existent chacun en deux versions :
  - **SVG**, net à toutes les tailles, pour l'imprimeur ou un graphiste : https://umai-ramen.fr/qr/umai-menu-fr.svg (puis `-en`, `-de`, `-it`, `-zh`) ;
  - **PNG**, pour WhatsApp, l'e-mail ou les réseaux : https://umai-ramen.fr/qr/umai-menu-fr.png (même principe).
- **Les 4 PDF :**
  - Feuille A4 : https://umai-ramen.fr/qr/umai-qr-a4.pdf
  - Chevalet A6 recto verso, fond perdu 3 mm (fichier principal) : https://umai-ramen.fr/qr/umai-qr-chevalet-a6.pdf
  - Même chevalet, fond perdu 1 mm : https://umai-ramen.fr/qr/umai-qr-chevalet-a6-fp1mm.pdf
  - Même chevalet, fond perdu 2 mm : https://umai-ramen.fr/qr/umai-qr-chevalet-a6-fp2mm.pdf

Chaque code ouvre directement le menu dans sa langue : https://umai-ramen.fr/fr/menu, `/en/menu`, `/de/menu`, `/it/menu`, `/zh/menu`. Ce sont des adresses simples, sans suivi.

### 2. Le test réel à faire (5 minutes)

Affiche https://umai-ramen.fr/fr/menu/qr sur un ordinateur (ou imprime l'A4). Scanne chaque code avec l'appareil photo d'un iPhone, puis d'un Android, et coche :

- [ ] « Menu en français » ouvre la page « Notre Menu »
- [ ] « Menu in English » ouvre « Our Menu »
- [ ] « Speisekarte auf Deutsch » ouvre « Unsere Speisekarte »
- [ ] « Menù in italiano » ouvre « Il nostro menù »
- [ ] « 中文菜单 » ouvre « 菜单 »

Les titres s'affichent en majuscules sur le site. Si un code ouvre la mauvaise page, ou rien du tout, dis-le-moi.

Ce qui est déjà vérifié automatiquement :
- les 10 fichiers et les 35 codes imprimés dans les PDF donnent tous la bonne adresse ;
- chacune des 5 adresses répond directement, sans redirection, dans la bonne langue.

### 3. Imprimer l'A4 au bureau

Ouvre `umai-qr-a4.pdf` et imprime à **100 % (« Taille réelle »)**, jamais avec « Ajuster à la page », sur du papier blanc. Chaque code fait alors 4,35 cm de côté.

### 4. Commander le chevalet chez Exaprint

- **Le produit :** une carte A6 à plat (105 × 148 mm), recto verso. Les deux faces sont identiques et portent les 5 codes, pour que le chevalet se lise des deux côtés de la table. La page 1 du PDF est le recto, la page 2 le verso.
- **Quel fichier envoyer :** Exaprint veut un fichier au format fini plus le fond perdu demandé par le produit. Regarde la valeur indiquée sur la fiche du produit choisi, puis prends le fichier correspondant :

| Fond perdu demandé par Exaprint | Fichier à envoyer | Taille de la page |
|---|---|---|
| 3 mm (brochures ; fichier par défaut) | `umai-qr-chevalet-a6.pdf` | 111 × 154 mm |
| 1 mm (flyers et dépliants) | `umai-qr-chevalet-a6-fp1mm.pdf` | 107 × 150 mm |
| 2 mm (autres produits) | `umai-qr-chevalet-a6-fp2mm.pdf` | 109 × 152 mm |

- **Déjà conforme dans les 3 fichiers :**
  - zone de sécurité de 5 mm (Exaprint demande 3 mm et conseille 5 mm) ;
  - polices incorporées, y compris la police chinoise du libellé 中文菜单 ;
  - codes vectoriels de 2,55 cm de côté.
- **Couleurs :** les fichiers sont en RVB et Exaprint les convertit automatiquement en CMJN. Le fond ivoire peut changer légèrement de teinte ; les codes, noirs sur blanc, ne bougent pas. Une conversion CMJN faite par nos soins (PDF/X) reste possible plus tard si tu le souhaites.
- **Papier conseillé :** épais (350 g ou plus), pour tenir dans un support de table.
- **Autre fond perdu** (de 0 à 5 mm) : `node scripts/qr/print.mjs --only a6 --bleed 4 --out ~/Desktop/umai-chevalet-a6-fp4.pdf` (remplace 4 par la valeur demandée), ou demande-le-moi (10 secondes).

### 5. Quand

Les codes fonctionnent dès maintenant, et les menus traduits (phase 14) étaient en ligne au moment du déploiement. Sur chaque menu traduit, le nom français s'affiche sous le nom traduit : 25 plats sur le menu anglais, 26 sur les menus allemand, italien et chinois. Rien n'oblige donc à attendre pour le test réel et la commande Exaprint.

### 6. Ne jamais changer une adresse imprimée

Un code imprimé est définitif. Les adresses https://umai-ramen.fr/{fr,en,de,it,zh}/menu doivent rester valables tant que des cartes sont en circulation.

Pour changer un libellé ou un fichier :
1. modifier `src/lib/qr.ts` ;
2. lancer `node scripts/qr/generate.mjs && node scripts/qr/print.mjs && node scripts/qr/verify.mjs --urls` (régénère les 10 codes et les 4 PDF, puis vérifie tout) ;
3. déployer.

### 7. Studio vers le site : plus d'attente de 2 minutes

Depuis ce déploiement, le site lit Sanity sans passer par son CDN. Après une publication dans Studio, lance tout de suite :

```
node --env-file=.env.local scripts/menu-2026/revalidate.mjs
```

La page est à jour dès la requête suivante.

Preuve faite aujourd'hui en production : un nom modifié sur Karaage est apparu sur /it/menu dès la première requête après la revalidation, alors que le CDN de Sanity servait encore l'ancien nom 7 secondes après l'écriture. Le nom a ensuite été remis exactement comme avant (« Karaage »).

Toujours valable : rien ne se met à jour tout seul tant qu'aucun webhook Sanity ne pointe vers le site, donc la commande ci-dessus reste nécessaire.

### 8. Retour arrière si besoin

```
ssh umai-app 'cd /home/ek/apps/umai && git reset --hard 86068ab && docker compose -p umai up -d --build web'
```

Cette commande revient au code d'avant la phase 15 : la page `/menu/qr` et les fichiers disparaissent, et le site repasse par le CDN de Sanity, donc l'attente de 2 minutes redevient nécessaire. La phase 15 n'a pas modifié le contenu Sanity, à part la sonde, annulée puis vérifiée. Sauvegarde : `.planning/phases/15-qr-codes-supports-imprimables/backup/`.

---
*Phase: 15-qr-codes-supports-imprimables*
*Completed: 2026-11-24*

## Self-Check: PASSED

- FOUND: `backup/freshness-backup-20261124-003415.json` (tracked, 0 secrets), `deferred-items.md` (item 3 RESOLVED line), this SUMMARY
- FOUND commits: `475c880` (deployed), `554cc98` (docs)
- Deploy: VPS HEAD = `origin/v2-2026` = PUSHED = `475c880550d77fcfd4a7db530a22b70e0564509f` (re-read after the probe)
- Production content: `m26-item-karaage` `name.it` = « Karaage » (identical to the backup), live /it/menu 0 `PROBE-`, `VERIFY OK`
- No em-dash in the French hand-off
