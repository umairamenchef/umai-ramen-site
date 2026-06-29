/**
 * Umaï IG Studio — Claude FR caption drafter (CAPTION-01, CAPTION-02, CAPTION-03)
 *
 * generateCaption({ dishName, baseline, price, overlayMode, nap }) → Promise<string>
 *   Calls claude-sonnet-4-6 to draft a FR Instagram caption for Strasbourg audience.
 *   - overlayMode 'photo-only' (ambiance): generic brand voice, no dish claim.
 *   - Packshot: dish name + baseline + price + NAP CTA + hashtags.
 *
 * CLI: node --env-file=.env src/caption.js --photo <id> [--entry-file <path>]
 *   Prints ONLY the caption text to stdout.
 *
 * Requires ANTHROPIC_API_KEY in environment (load via --env-file=.env).
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadMenu, menuLabel } from './menu.js';
import { readStore } from './store.js';

// ─── generateCaption ──────────────────────────────────────────────────────────

/**
 * Draft a FR Instagram caption via claude-sonnet-4-6.
 *
 * @param {{ dishName?: string, baseline?: string, price?: number|null, overlayMode?: string, nap: object }} opts
 * @returns {Promise<string>} trimmed caption text
 */
export async function generateCaption({ dishName, baseline, price, overlayMode, nap }) {
  const client = new Anthropic();

  const isAmbiance = overlayMode === 'photo-only';

  let prompt;

  if (isAmbiance) {
    prompt = `Tu es le community manager d'Umaï Ramen, restaurant japonais au cœur du quartier Krutenau à Strasbourg.
Rédige une légende Instagram en français, courte et appétissante (2-4 phrases max), pour une photo d'ambiance du restaurant (pas de plat précis).
Ton : chaleureux, convivial, Strasbourg fière de sa scène culinaire. Ne mentionne aucun plat spécifique.
Termine avec un appel à l'action doux (venir nous voir, réserver), les coordonnées ci-dessous, et une ligne de hashtags pertinents (#UmaiRamen #Strasbourg #Ramen #Krutenau #RestaurantJaponais + 3-5 hashtags additionnels adaptés).

Coordonnées :
- Adresse : ${nap.address}
- Téléphone : ${nap.phone}
- Instagram : ${nap.instagram}
- Site : ${nap.website}

Réponds UNIQUEMENT avec le texte de la légende (pas de guillemets, pas d'introduction, pas d'explication).`;
  } else {
    const priceStr = price != null
      ? `${String(price).replace('.', ',')} €`
      : null;

    prompt = `Tu es le community manager d'Umaï Ramen, restaurant japonais au cœur du quartier Krutenau à Strasbourg.
Rédige une légende Instagram en français pour ce plat :

Plat : ${dishName ?? 'Spécialité Umaï'}${baseline ? `\nBaseline : ${baseline}` : ''}${priceStr ? `\nPrix : ${priceStr}` : ''}

Instructions :
- Ton : appétissant, chaleureux, fier de la cuisine japonaise à Strasbourg — pas robotique, pas commercial-creux.
- 2-4 phrases max. Accroche sur le plat, une touche d'émotion ou de contexte Strasbourg/Krutenau si naturel.
- Termine avec un CTA doux (venir goûter, réserver, passer nous voir) + les coordonnées ci-dessous.
- Dernière ligne : hashtags (#UmaiRamen #Strasbourg #Ramen + hashtags du plat + #Krutenau #RestaurantJaponais + 2-3 hashtags additionnels adaptés).

Coordonnées :
- Adresse : ${nap.address}
- Téléphone : ${nap.phone}
- Instagram : ${nap.instagram}
- Site : ${nap.website}

Réponds UNIQUEMENT avec le texte de la légende (pas de guillemets, pas d'introduction, pas d'explication).`;
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();

  return text;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  const photoIdx = args.indexOf('--photo');
  if (photoIdx === -1 || !args[photoIdx + 1] || args[photoIdx + 1].startsWith('--')) {
    console.error('[caption] Usage: node --env-file=.env src/caption.js --photo <id> [--entry-file <path>]');
    process.exit(1);
  }

  const rawId   = args[photoIdx + 1];
  const photoId = rawId.replace(/\.jpg$/i, '');
  const file    = `${photoId}.jpg`;

  const entryIdx  = args.indexOf('--entry-file');
  const entryFile = entryIdx !== -1 ? args[entryIdx + 1] : null;

  // Resolve entry
  let entry;
  if (entryFile) {
    entry = JSON.parse(readFileSync(entryFile, 'utf-8'));
    if (!entry.file) entry.file = file;
  } else {
    const store = readStore();
    entry = store.find(e => e.file === file);
    if (!entry) {
      console.error(`[caption] No classification entry found for "${file}". Run classify first or pass --entry-file.`);
      process.exit(1);
    }
  }

  // Resolve display fields
  const { nap } = loadMenu();

  // overlayMode: explicit > shotType-based
  const overlayMode = entry.overlayMode ??
    (entry.shotType === 'ambiance' || entry.dishSlug === 'ambiance'
      ? 'photo-only'
      : 'packshot');

  // dishName + price: entry fields win, else try canonical menuLabel
  let dishName  = entry.dishName ?? null;
  let price     = entry.price !== undefined ? entry.price : null;
  let baseline  = entry.baseline ?? null;

  if (!dishName && overlayMode !== 'photo-only') {
    const ml = menuLabel(entry.dishSlug);
    if (ml) {
      dishName = ml.name;
      if (price === null) price = ml.price;
      if (!baseline) baseline = ml.baseline;
    }
  }

  const caption = await generateCaption({ dishName, baseline, price, overlayMode, nap });

  // Print ONLY the caption (so caller can capture cleanly)
  process.stdout.write(caption + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error('[caption] Error:', e.message ?? e); process.exit(1); });
}
