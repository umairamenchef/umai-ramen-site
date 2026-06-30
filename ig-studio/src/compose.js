/**
 * Umaï IG Studio — Compose pipeline + CLI (BRAND-07)
 *
 * composePhoto(file, entry, kb): cover-crops to 3 Meta formats + applies overlay → writes out/{photoId}/
 * CLI modes:
 *   node src/compose.js [--pilot|--all] [--limit=N]     — batch (existing)
 *   node src/compose.js --photo <id>                    — single photo, all formats
 *   node src/compose.js --photo <id> --preview --format <f> --out <path> [--entry-file <path>]
 *                                                       — preview render (no out/{photoId}/ write)
 *
 * No network, no Anthropic import — fully offline.
 */

import sharp from 'sharp';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { FORMATS, coverCrop } from './crop.js';
import { applyOverlay } from './overlay.js';
import { readStore } from './store.js';
import { listPhotos, selectPilot, photoPath, PKG_ROOT } from './photos.js';

// ─── composePhoto ─────────────────────────────────────────────────────────────

/**
 * Cover-crop the source photo to all 3 Meta formats, apply the shotType-driven
 * overlay on each canvas, and write PNGs to out/{photoId}/.
 *
 * @param {string} file — filename, e.g. "umai_057.jpg"
 * @param {{ shotType:string, dishSlug:string, confidence:number }} entry — classification row
 * @param {object} kb — loaded KB (from loadKB())
 * @returns {Promise<{ photoId:string, dir:string, formats:string[], applied:{ logo:boolean, chip:boolean } }>}
 */
export async function composePhoto(file, entry, kb) {
  const photoId = file.replace(/\.jpg$/i, '');
  const outDir = resolve(PKG_ROOT, 'out', photoId);
  mkdirSync(outDir, { recursive: true });

  let applied = { logo: false, chip: false };

  for (const [name, { w, h }] of Object.entries(FORMATS)) {
    const cropped = await coverCrop(photoPath(file), w, h);
    const result  = await applyOverlay(cropped, { width: w, height: h }, entry, kb);
    writeFileSync(resolve(outDir, `${name}.png`), result.buffer);
    // applied flags are identical per-photo (shotType is photo-level, not format-level)
    applied = result.applied;
  }

  return { photoId, dir: outDir, formats: ['feed', 'square', 'story'], applied };
}

// ─── composeOne ───────────────────────────────────────────────────────────────

/**
 * Render a single format and write it to an explicit outPath.
 * Used for live preview: no writes under out/{photoId}/.
 *
 * @param {string} file — filename, e.g. "umai_057.jpg"
 * @param {object} entry — classification row (may include overlayMode/dishName/price)
 * @param {object} kb — loaded KB
 * @param {{ format: string, outPath: string }} opts
 * @returns {Promise<void>}
 */
export async function composeOne(file, entry, kb, { format, outPath }) {
  const fmt = FORMATS[format];
  if (!fmt) throw new Error(`Unknown format "${format}". Use: ${Object.keys(FORMATS).join(', ')}`);

  const cropped = await coverCrop(photoPath(file), fmt.w, fmt.h);
  const result  = await applyOverlay(cropped, { width: fmt.w, height: fmt.h }, entry, kb);
  writeFileSync(outPath, result.buffer);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // ── Single-photo mode ───────────────────────────────────────────────────────
  const photoIdx = args.indexOf('--photo');
  if (photoIdx !== -1) {
    const rawId = args[photoIdx + 1];
    if (!rawId || rawId.startsWith('--')) {
      console.error('[compose] --photo requires a photo id, e.g. --photo umai_057');
      process.exit(1);
    }

    // Normalise: strip extension if given, then re-add .jpg
    const photoId = rawId.replace(/\.jpg$/i, '');
    const file = `${photoId}.jpg`;

    // Optional flags
    const isPreview   = args.includes('--preview');
    const formatIdx   = args.indexOf('--format');
    const format      = formatIdx !== -1 ? args[formatIdx + 1] : null;
    const outIdx      = args.indexOf('--out');
    const outPath     = outIdx !== -1 ? args[outIdx + 1] : null;
    const entryIdx    = args.indexOf('--entry-file');
    const entryFile   = entryIdx !== -1 ? args[entryIdx + 1] : null;

    const store = readStore();

    // Resolve entry: --entry-file JSON beats store lookup
    let entry;
    if (entryFile) {
      entry = JSON.parse(readFileSync(entryFile, 'utf-8'));
      // Ensure `file` is set so overlay / photo path resolution works
      if (!entry.file) entry.file = file;
    } else {
      entry = store.find(e => e.file === file);
      if (!entry) {
        console.error(`[compose] No classification entry found for "${file}". Run classify first or pass --entry-file.`);
        process.exit(1);
      }
    }

    if (isPreview) {
      // Preview: single format to explicit outPath — no out/{photoId}/ write
      if (!format || !outPath) {
        console.error('[compose] --preview requires both --format <f> and --out <path>');
        process.exit(1);
      }
      await composeOne(file, entry, undefined, { format, outPath });
      process.stdout.write(JSON.stringify({ photoId, format, out: outPath }) + '\n');
    } else {
      // Single-photo full export: all 3 formats → out/{photoId}/
      const result = await composePhoto(file, entry);
      process.stdout.write(JSON.stringify({ photoId: result.photoId, dir: result.dir, out: result.dir, applied: result.applied }) + '\n');
    }

    return;
  }

  // ── Batch mode (--pilot / --all / --limit) — existing behavior unchanged ────
  const isAll    = args.includes('--all');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit    = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;

  const store = readStore();

  // Index classification entries by file
  const storeMap = new Map(store.map(e => [e.file, e]));

  const allFiles = listPhotos();
  const selected = isAll ? allFiles : selectPilot(allFiles, limit);

  const total = selected.length;
  console.log(`\n[compose] ${isAll ? 'All' : 'Pilot'} run — ${total} photos`);
  console.log(`[compose] Output → ${resolve(PKG_ROOT, 'out')}/\n`);

  let countPackshotChip  = 0;
  let countPackshotLogo  = 0;
  let countAmbiance      = 0;
  let countSkipped       = 0;

  for (let i = 0; i < selected.length; i++) {
    const file  = selected[i];
    const entry = storeMap.get(file);

    if (!entry) {
      console.warn(`[${i + 1}/${total}] SKIP ${file} — no classification entry`);
      countSkipped++;
      continue;
    }

    const result = await composePhoto(file, entry);

    const { applied } = result;
    let statusTag;
    if (entry.shotType === 'ambiance') {
      statusTag = 'photo-only';
      countAmbiance++;
    } else if (applied.logo && applied.name) {
      statusTag = 'logo+name';
      countPackshotChip++;
    } else {
      statusTag = 'logo-only';
      countPackshotLogo++;
    }

    console.log(`[${i + 1}/${total}] ${file} → feed/square/story (${statusTag})`);
  }

  console.log('\n─────────────────────────────────────');
  console.log('[compose] Summary:');
  console.log(`  Logo + name            : ${countPackshotChip}`);
  console.log(`  Logo only              : ${countPackshotLogo}`);
  console.log(`  Ambiance (photo-only)  : ${countAmbiance}`);
  if (countSkipped > 0) console.log(`  Skipped (no entry)     : ${countSkipped}`);
  console.log(`\n[compose] Output path: ${resolve(PKG_ROOT, 'out')}/`);
  console.log('[compose] Done.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error(e); process.exit(1); });
}
