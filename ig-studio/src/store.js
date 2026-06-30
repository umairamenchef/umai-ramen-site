/**
 * classification.json store — override-wins merge.
 *
 * OVERRIDE CONTRACT:
 *   Set `"override": true` on any entry you hand-correct in classification.json.
 *   Future `npm run classify` runs will NOT overwrite it — human correction wins.
 *   AI-generated entries always start with `"override": false`.
 */

import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { PKG_ROOT } from './photos.js';

const STORE_PATH = resolve(PKG_ROOT, 'classification.json');

/**
 * Read the current classification store.
 * Returns the parsed array, or [] if the file is missing or invalid JSON.
 * @returns {Array<object>}
 */
export function readStore() {
  if (!existsSync(STORE_PATH)) return [];
  try {
    const raw = readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Merge fresh classification results into the store, preserving overridden entries.
 *
 * Rules:
 *   1. If an existing entry has `override: true` → KEEP it (human correction wins).
 *   2. Otherwise → write the fresh result (with `override: false`).
 *   3. Entries for files NOT in the fresh batch are preserved as-is (partial run safe).
 *   4. Output is sorted by `file` and pretty-printed (2-space) for readability.
 *
 * @param {Array<{file: string, dishSlug: string, shotType: string, confidence: number, reasoning: string}>} fresh
 * @returns {{ written: number, preservedOverrides: number }}
 */
export function mergeAndWrite(fresh) {
  const existing = readStore();

  // Index existing entries by file
  const existingByFile = new Map(existing.map(e => [e.file, e]));

  let written = 0;
  let preservedOverrides = 0;

  // Process fresh results
  for (const result of fresh) {
    const prev = existingByFile.get(result.file);

    if (prev && prev.override) {
      // Human correction wins — keep the existing entry untouched
      preservedOverrides++;
      // (existingByFile already has prev — no update needed)
    } else {
      // Write the fresh result (ensure override defaults to false)
      existingByFile.set(result.file, {
        file: result.file,
        dishSlug: result.dishSlug,
        shotType: result.shotType,
        confidence: result.confidence,
        reasoning: result.reasoning,
        override: false,
      });
      written++;
    }
  }

  // Convert map back to sorted array
  const merged = [...existingByFile.values()].sort((a, b) =>
    a.file.localeCompare(b.file)
  );

  // Atomic write: write to a temp file in the same dir, then rename over target.
  const tmp = STORE_PATH + '.tmp-' + randomBytes(6).toString('hex');
  writeFileSync(tmp, JSON.stringify(merged, null, 2));
  renameSync(tmp, STORE_PATH);

  return { written, preservedOverrides };
}
