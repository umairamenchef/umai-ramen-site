/**
 * Umaï IG Studio — Classification CLI
 *
 * Usage (from ig-studio/):
 *   npm run classify -- --pilot        classify ~10 varied photos (default)
 *   npm run classify -- --all          classify all 81 photos (blocked until sign-off)
 *   npm run classify -- --pilot --limit=5   custom pilot size
 *   npm run signoff                    create .pilot-signoff and unblock --all
 */

import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { listPhotos, selectPilot, PKG_ROOT } from './photos.js';
import { classifyPhoto } from './classifier.js';
import { mergeAndWrite } from './store.js';

// ─── Arg parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const hasFlag = f => args.includes(f);
const getArg = (prefix) => {
  const a = args.find(a => a.startsWith(prefix));
  return a ? a.slice(prefix.length) : null;
};

const isSignoff = hasFlag('--signoff');
const isAll = hasFlag('--all');
const isPilot = hasFlag('--pilot') || (!isAll && !isSignoff); // default
const limitArg = getArg('--limit=');
const pilotLimit = limitArg ? parseInt(limitArg, 10) : 10;

const SIGNOFF_PATH = resolve(PKG_ROOT, '.pilot-signoff');

// ─── Sign-off command ─────────────────────────────────────────────────────────

if (isSignoff) {
  const marker = {
    created: new Date().toISOString(),
    message: 'Pilot reviewed and signed off. --all run is now unblocked.',
  };
  writeFileSync(SIGNOFF_PATH, JSON.stringify(marker, null, 2));
  console.log('\n[signoff] Pilot sign-off marker created at .pilot-signoff');
  console.log('[signoff] You can now run: npm run classify -- --all\n');
  process.exit(0);
}

// ─── Pilot gate for --all ─────────────────────────────────────────────────────

if (isAll && !existsSync(SIGNOFF_PATH)) {
  console.error(
    '\n[error] Pilot not signed off.\n\n' +
    'You must complete the pilot review before running --all:\n' +
    '  1. npm run classify -- --pilot        (classify ~10 varied photos)\n' +
    '  2. Open contact-sheet.html in a browser and review labels\n' +
    '  3. Fix wrong labels in classification.json (set "override": true)\n' +
    '  4. npm run contact-sheet              (regenerate to confirm corrections)\n' +
    '  5. npm run signoff                    (create the sign-off marker)\n' +
    '  6. npm run classify -- --all          (now unblocked)\n'
  );
  process.exit(1);
}

// ─── Main classify loop ───────────────────────────────────────────────────────

async function main() {
  const allPhotos = listPhotos();
  const selected = isAll ? allPhotos : selectPilot(allPhotos, pilotLimit);
  const mode = isAll ? 'ALL' : 'PILOT';

  console.log(`\n[classify] Mode: ${mode} — ${selected.length} photos to classify`);
  if (!isAll) {
    console.log(`[classify] Pilot spread: ${selected.join(', ')}`);
  }
  console.log('');

  const results = [];
  let errors = 0;

  for (let i = 0; i < selected.length; i++) {
    const file = selected[i];
    const num = `[${i + 1}/${selected.length}]`;
    process.stdout.write(`${num} ${file} → `);

    try {
      const result = await classifyPhoto(file);
      results.push(result);
      console.log(`${result.dishSlug} / ${result.shotType} (confidence: ${result.confidence.toFixed(2)})`);
    } catch (err) {
      errors++;
      console.error(`ERROR: ${err.message}`);
      results.push({
        file,
        dishSlug: 'ambiance',
        shotType: 'ambiance',
        confidence: 0,
        reasoning: `classify_error: ${err.message}`,
      });
    }
  }

  console.log('');

  // Merge and write — override-wins semantics in store.js
  const { written, preservedOverrides } = mergeAndWrite(results);

  // Summary stats
  const counts = {};
  for (const r of results) {
    counts[r.dishSlug] = (counts[r.dishSlug] || 0) + 1;
  }

  console.log('[classify] Summary:');
  for (const [slug, count] of Object.entries(counts).sort()) {
    console.log(`  ${slug}: ${count}`);
  }
  if (preservedOverrides > 0) {
    console.log(`  (preserved ${preservedOverrides} human-overridden entries — not overwritten)`);
  }
  if (errors > 0) {
    console.log(`  (${errors} errors — classified as ambiance/fallback)`);
  }
  console.log(`\n[classify] Wrote ${written} entries to classification.json`);
  console.log('[classify] Done.\n');
}

main().catch(err => {
  console.error('[classify] Fatal error:', err.message);
  process.exit(1);
});
