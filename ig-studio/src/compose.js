/**
 * Umaï IG Studio — Compose pipeline + CLI (BRAND-07)
 *
 * composePhoto(file, entry, kb): cover-crops to 3 Meta formats + applies overlay → writes out/{photoId}/
 * CLI: node src/compose.js [--pilot|--all] [--limit=N]
 *
 * No network, no Anthropic import — fully offline.
 */

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { FORMATS, coverCrop } from './crop.js';
import { applyOverlay } from './overlay.js';
import { loadKB } from './kb.js';
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

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  const isAll    = args.includes('--all');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit    = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;

  const kb    = loadKB();
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

    const result = await composePhoto(file, entry, kb);

    const { applied } = result;
    let statusTag;
    if (entry.shotType === 'ambiance') {
      statusTag = 'photo-only';
      countAmbiance++;
    } else if (applied.logo && applied.chip) {
      statusTag = 'logo+chip';
      countPackshotChip++;
    } else {
      statusTag = 'logo-only';
      countPackshotLogo++;
    }

    console.log(`[${i + 1}/${total}] ${file} → feed/square/story (${statusTag})`);
  }

  console.log('\n─────────────────────────────────────');
  console.log('[compose] Summary:');
  console.log(`  Packshot + logo + chip : ${countPackshotChip}`);
  console.log(`  Packshot + logo only   : ${countPackshotLogo}`);
  console.log(`  Ambiance (photo-only)  : ${countAmbiance}`);
  if (countSkipped > 0) console.log(`  Skipped (no entry)     : ${countSkipped}`);
  console.log(`\n[compose] Output path: ${resolve(PKG_ROOT, 'out')}/`);
  console.log('[compose] Done.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error(e); process.exit(1); });
}
