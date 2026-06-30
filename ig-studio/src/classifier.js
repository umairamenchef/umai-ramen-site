/**
 * Claude Vision classifier for Umaï IG Studio.
 *
 * classifyPhoto(filename) → { file, dishSlug, shotType, confidence, reasoning }
 *
 * Pipeline:
 *   1. Read photo from ig-studio/photos/<filename>
 *   2. Downscale to max 1024px via sharp (cost/token control)
 *   3. Build vision prompt using CANONICAL menu-options.json (via menu.js)
 *   4. Call claude-opus-4-8 with image block
 *   5. Parse + validate JSON response against canonical slug set
 *   6. Return validated classification (never throws — safe fallback on parse error)
 *
 * NOTE: summer-menu-2026.json / kb.js are no longer used by this classifier.
 * They remain in the repo but are orphaned from the classification pipeline.
 */

import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { loadMenu } from './menu.js';
import { photoPath } from './photos.js';

// Instantiate SDK once — reads ANTHROPIC_API_KEY from env automatically
const anthropic = new Anthropic();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Downscale a photo buffer to max 1024px on the long edge, output JPEG buffer.
 * @param {string} filepath - absolute path to the photo
 * @returns {Promise<Buffer>}
 */
async function downscalePhoto(filepath) {
  return sharp(filepath)
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Extract the first JSON object from a string (handles markdown fences, trailing text).
 * @param {string} text
 * @returns {object|null}
 */
function extractJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {}

  // Try extracting from ```json ... ``` fence
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }

  // Try finding the first { ... } block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  return null;
}

// ─── Canonical prompt builder ─────────────────────────────────────────────────

/**
 * Build the classifier prompt context from the CANONICAL menu-options.json.
 * Embeds classification_axes rules, grouped slug list, and disambiguation rules.
 * This replaces the old kb.js buildPromptContext().
 *
 * @returns {{ promptContext: string, validSlugs: Set<string> }}
 */
export function buildClassifierPrompt() {
  const { groups, items } = loadMenu();

  // Build canonical slug set from menu-options.json
  const validSlugs = new Set(items.map(i => i.slug));

  // Build grouped slug display
  const groupedSlugs = groups.map(g => {
    const slugs = g.items.map(i => i.slug).join(', ');
    return `  ${g.group}: ${slugs}`;
  }).join('\n');

  const promptContext = `
## Umaï Ramen — Menu canonique 2026 (source de vérité pour la classification)

### IMPORTANT — Slugs invalides
⛔ Il N'Y A PAS de tsukemen sur ce menu. Il N'Y A PAS de hiyashi sur ce menu.
Ne génère JAMAIS : tsukemen-*, hiyashi-*, tantan-ramen, tantan-mazesoba, tantan-tsukemen.
Utilise UNIQUEMENT les slugs de la liste ci-dessous.

### Slugs valides (utilise UNIQUEMENT l'un de ces slugs)
${groupedSlugs}

### Règles de classification (axes visuels)

**RAMEN CLAIR (bouillon translucide, assari) :**
- **tokyo-ramen** : bouillon clair shoyu + chashu PORC + pak choï + bambou
- **wantan-ramen** : bouillon clair shio + ravioli WANTAN (petits raviolis) + chashu poulet
- **yuzu-ramen** : bouillon clair shoyu + chashu POULET + agrumes/YUZU + ail frit
- **kamo-ramen** : bouillon clair + tranches de CANARD + narutomaki (spirale rose)
→ Bouillon translucide sans tofu ni wantan → tokyo-ramen par défaut

**RAMEN CRÉMEUX/RICHE (bouillon opaque, nokō) :**
- **tantan-umai** : bouillon rougeâtre-crème sésame + BŒUF HACHÉ 5 épices + pak choï, piment modéré
- **kara-tantan** : idem tantan-umai + huile piment INTENSE (rouge vif), aspect plus rouge
- **miso-ramen** : bouillon miso rouge crémeux + chashu PORC
- **miso-epice** : bouillon miso + negi, relevé

**RAMEN VÉGÉTARIENS (TOFU visible = végé) :**
- **yasai-tantan** : bouillon sésame crémeux + TOFU teriyaki visible → végé tantan
- **miso-vegetarien** : bouillon miso rouge + TOFU teriyaki visible → végé miso
→ Si TOFU teriyaki clairement visible dans un ramen crémeux : choisir yasai-tantan ou miso-vegetarien

**MAZESOBA (SANS bouillon, plat à mélanger) :**
- **mazesoba-karaage** : sans bouillon + poulet frit croustillant visible
- **mazesoba-chashu** : sans bouillon + tranches de chashu porc
- **mazesoba-tantan** : sans bouillon + bœuf haché + sésame
→ Aucun liquide visible = mazesoba (distingue des ramen)

**UDON (nouilles ÉPAISSES) :**
- **udon-tempura** : nouilles épaisses + tempura (crevettes en beignet)
- **udon-karaage** : nouilles épaisses + poulet frit
- **udon-curry** : nouilles épaisses + curry jaune/brun

**ENTRÉES :**
- **takoyaki** : petites boules rondes dorées (poulpe), sauce takoyaki
- **karaage** : morceaux de poulet frit croustillants
- **gyoza** : raviolis grillés (semi-circulaires, côté grillé doré)
- **edamame** : fèves de soja vertes dans leur cosse

**DESSERTS :** mochis, tiramisu-matcha, tiramisu-framboise-litchi, moelleux-chocolat, coupe-ichigo, glace

### Règle chashu (IMPORTANT)
Le chashu (porc braisé en tranches) est un TOPPING présent dans plusieurs plats.
→ Classe par BOUILLON + TYPE DE NOUILLES, PAS par la présence de chashu seul.

### Règle ambiance
Utilise **ambiance** (shotType: "ambiance") si :
- Scène intérieure ou décoration du restaurant
- Personnes / équipe
- Plusieurs plats ensemble sans plat unique identifiable
- Boissons uniquement (sans plat principal)
→ Préfère un dishSlug spécifique dès qu'un seul plat est clairement identifiable.

### shotType
- **packshot** : un seul plat clairement identifiable, centré
- **ambiance** : tout le reste (multi-plats, déco, personnes, boissons)
`.trim();

  return { promptContext, validSlugs };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Classify a single photo against the CANONICAL Umaï 2026 menu.
 * @param {string} file - filename (e.g. "umai_007.jpg")
 * @returns {Promise<{ file: string, dishSlug: string, shotType: string, confidence: number, reasoning: string }>}
 */
export async function classifyPhoto(file) {
  const { promptContext, validSlugs } = buildClassifierPrompt();
  const filepath = photoPath(file);

  // 1. Downscale
  let imageBuffer;
  try {
    imageBuffer = await downscalePhoto(filepath);
  } catch (err) {
    return {
      file,
      dishSlug: 'ambiance',
      shotType: 'ambiance',
      confidence: 0,
      reasoning: `read_error: ${err.message}`,
    };
  }

  const imageData = imageBuffer.toString('base64');

  // 2. Build prompt
  const systemPrompt = `Tu es un classificateur visuel expert en ramen japonais pour le restaurant Umaï Ramen (Strasbourg).
Tu reçois une photo et tu dois la classifier selon le menu canonique 2026 ci-dessous.
Réponds UNIQUEMENT en JSON valide, sans aucun texte autour. Format exact :
{"dishSlug": "<slug>", "shotType": "<packshot|ambiance>", "confidence": <0.0-1.0>, "reasoning": "<explication courte en français>"}`;

  const userContent = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: imageData,
      },
    },
    {
      type: 'text',
      text: `${promptContext}

---

Classifie cette photo selon les règles ci-dessus.
- Choisis un dishSlug parmi les slugs valides listés (ou "ambiance").
- Détermine le shotType : "packshot" si un seul plat identifiable, "ambiance" sinon.
- Évalue ta confiance (0.0 = aucune certitude, 1.0 = certitude totale).
- Si shotType est "ambiance", dishSlug DOIT être "ambiance".
- Si TOFU teriyaki est clairement visible : utilise yasai-tantan ou miso-vegetarien.
- Ne classe PAS par chashu seul — utilise bouillon + type de nouilles.
- N'utilise JAMAIS tsukemen-*, hiyashi-*, tantan-ramen, ni aucun slug absent de la liste.

Réponds UNIQUEMENT en JSON :
{"dishSlug": "...", "shotType": "...", "confidence": 0.0, "reasoning": "..."}`,
    },
  ];

  // 3. Call Claude Vision
  let responseText;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });
    responseText = message.content[0]?.text ?? '';
  } catch (err) {
    return {
      file,
      dishSlug: 'ambiance',
      shotType: 'ambiance',
      confidence: 0,
      reasoning: `api_error: ${err.message}`,
    };
  }

  // 4. Parse + validate
  let parsed;
  try {
    parsed = extractJSON(responseText);
    if (!parsed) throw new Error('null result');
  } catch (err) {
    return {
      file,
      dishSlug: 'ambiance',
      shotType: 'ambiance',
      confidence: 0,
      reasoning: `parse_failed: ${responseText.slice(0, 200)}`,
    };
  }

  // 5. Enforce contract rules
  let { dishSlug, shotType, confidence, reasoning } = parsed;

  // Clamp confidence
  confidence = Math.max(0, Math.min(1, Number(confidence) || 0));

  // shotType must be one of the two valid values
  if (shotType !== 'packshot' && shotType !== 'ambiance') {
    shotType = 'ambiance';
  }

  // If ambiance shotType → dishSlug must be ambiance
  if (shotType === 'ambiance') {
    dishSlug = 'ambiance';
  }

  // Validate dishSlug against canonical menu slugs
  if (!validSlugs.has(dishSlug)) {
    reasoning = `[slug_coerced from "${dishSlug}" — not in canonical menu] ${reasoning}`;
    dishSlug = 'ambiance';
    shotType = 'ambiance';
    confidence = Math.min(confidence, 0.3);
  }

  return { file, dishSlug, shotType, confidence, reasoning: String(reasoning || '') };
}
