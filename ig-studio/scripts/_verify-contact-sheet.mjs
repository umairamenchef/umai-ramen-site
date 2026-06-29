/**
 * Fixture-based verify script for contact-sheet.js
 * Used by 04-02 Task 1 verify step.
 *
 * 1. Writes a 2-entry classification.json fixture
 * 2. Runs contact-sheet.js
 * 3. Asserts the HTML contains expected content
 * 4. Cleans up fixture classification.json (leaves contact-sheet.html)
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STORE_PATH = resolve(PKG_ROOT, 'classification.json');
const OUTPUT_PATH = resolve(PKG_ROOT, 'contact-sheet.html');

// ─── Setup fixture ────────────────────────────────────────────────────────────

const fixture = [
  {
    file: 'umai_019.jpg',
    dishSlug: 'tokyo',
    shotType: 'packshot',
    confidence: 0.82,
    reasoning: 'Clear broth + pork chashu + bamboo → Tokyo.',
    override: false,
  },
  {
    file: 'umai_081.jpg',
    dishSlug: 'ambiance',
    shotType: 'ambiance',
    confidence: 0.97,
    reasoning: 'Restaurant interior, kimono decor, multi-dish table.',
    override: true,
  },
];

// Save current classification.json if it exists (don't wipe live data)
let backup = null;
if (existsSync(STORE_PATH)) {
  backup = readFileSync(STORE_PATH, 'utf-8');
}

writeFileSync(STORE_PATH, JSON.stringify(fixture, null, 2));

// ─── Run generator ────────────────────────────────────────────────────────────

try {
  execSync('node src/contact-sheet.js', { cwd: PKG_ROOT, stdio: 'inherit' });
} catch (err) {
  console.error('[verify] contact-sheet.js exited with error:', err.message);
  process.exit(1);
}

// ─── Assert output ────────────────────────────────────────────────────────────

if (!existsSync(OUTPUT_PATH)) {
  console.error('[verify] FAIL: contact-sheet.html was not created');
  process.exit(1);
}

const html = readFileSync(OUTPUT_PATH, 'utf-8');

const checks = [
  ['contains umai_019.jpg filename',   html.includes('umai_019.jpg')],
  ['contains umai_081.jpg filename',   html.includes('umai_081.jpg')],
  ['contains "tokyo" dishSlug',        html.includes('tokyo')],
  ['contains "ambiance" dishSlug',     html.includes('ambiance')],
  ['contains confidence "82%"',        html.includes('82%')],
  ['contains confidence "97%"',        html.includes('97%')],
  ['references photos/ folder',        html.includes('photos/')],
  ['shows override badge (CORRIGÉ)',   html.includes('CORRIG')],
  ['has sort controls',                html.includes('sortCards')],
  ['is valid HTML (has DOCTYPE)',      html.startsWith('<!DOCTYPE html>')],
];

let failed = false;
for (const [label, result] of checks) {
  if (result) {
    console.log(`  ✔ ${label}`);
  } else {
    console.error(`  ✖ FAIL: ${label}`);
    failed = true;
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

// Restore original classification.json if it existed
if (backup !== null) {
  writeFileSync(STORE_PATH, backup);
} else {
  unlinkSync(STORE_PATH);
}

if (failed) {
  console.error('\n[verify] contact-sheet verification FAILED');
  process.exit(1);
} else {
  console.log('\n[verify] contact-sheet verification PASSED');
  process.exit(0);
}
