/**
 * Claude Vision classifier for Umaï IG Studio.
 *
 * classifyPhoto(filename) → { file, dishSlug, shotType, confidence, reasoning }
 *
 * Pipeline:
 *   1. Read photo from ig-studio/photos/<filename>
 *   2. Downscale to max 1024px via sharp (cost/token control)
 *   3. Build vision prompt with summer KB context (kb.js)
 *   4. Call claude-opus-4-8 with image block
 *   5. Parse + validate JSON response
 *   6. Return validated classification (never throws — safe fallback on parse error)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { loadKB, buildPromptContext } from './kb.js';
import { PKG_ROOT, photoPath } from './photos.js';

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

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Classify a single photo against the summer 2026 KB.
 * @param {string} file - filename (e.g. "umai_007.jpg")
 * @returns {Promise<{ file: string, dishSlug: string, shotType: string, confidence: number, reasoning: string }>}
 */
export async function classifyPhoto(file) {
  const kb = loadKB();
  const validSlugs = new Set(kb.slugs);
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
  const promptContext = buildPromptContext();

  // 2. Build prompt
  const systemPrompt = `Tu es un classificateur visuel expert en ramen japonais pour le restaurant Umaï Ramen (Strasbourg).
Tu reçois une photo et tu dois la classifier selon la base de connaissances ci-dessous.
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
- Ne classe PAS par chashu seul — utilise bouillon + type de nouilles.

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

  // Validate dishSlug against KB
  if (!validSlugs.has(dishSlug)) {
    reasoning = `[slug_coerced from "${dishSlug}" — not in KB] ${reasoning}`;
    dishSlug = 'ambiance';
    shotType = 'ambiance';
    confidence = Math.min(confidence, 0.3);
  }

  return { file, dishSlug, shotType, confidence, reasoning: String(reasoning || '') };
}
