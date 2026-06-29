/**
 * Photo discovery + pilot selection for ig-studio.
 * Reads local ig-studio/photos/ — no Drive/OAuth needed (INGEST-01).
 */

import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Package root = one level up from src/
const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * List all umai_NNN.jpg photos from the photos/ directory.
 * Returns a sorted array of filenames (not full paths).
 * @param {string} [dir='photos'] - relative to package root
 * @returns {string[]}
 */
export function listPhotos(dir = 'photos') {
  const photosDir = resolve(PKG_ROOT, dir);
  let entries;
  try {
    entries = readdirSync(photosDir);
  } catch (err) {
    throw new Error(
      `[photos] Cannot read photos directory "${photosDir}": ${err.message}\n` +
      `Place photos in ig-studio/photos/ and try again.`
    );
  }

  const photos = entries
    .filter(f => /^umai_\d{3}\.jpg$/i.test(f))
    .sort();

  if (photos.length === 0) {
    throw new Error(
      `[photos] No umai_NNN.jpg files found in "${photosDir}". ` +
      `Expected 81 photos — check the directory.`
    );
  }

  return photos;
}

/**
 * Select a deterministic, evenly-spread pilot subset from the full list.
 * Uses index interpolation so the pilot covers varied photos, not just the first N.
 * @param {string[]} files - full sorted photo list
 * @param {number} [n=10] - target pilot size
 * @returns {string[]} - deduplicated, ~n filenames
 */
export function selectPilot(files, n = 10) {
  if (files.length === 0) throw new Error('[photos] Empty file list passed to selectPilot');
  if (n >= files.length) return [...files];

  const indices = new Set();
  for (let i = 0; i < n; i++) {
    const idx = Math.round(i * (files.length - 1) / (n - 1));
    indices.add(idx);
  }

  return [...indices].sort((a, b) => a - b).map(i => files[i]);
}

/**
 * Full path for a given filename.
 * @param {string} filename
 * @param {string} [dir='photos']
 * @returns {string}
 */
export function photoPath(filename, dir = 'photos') {
  return resolve(PKG_ROOT, dir, filename);
}

export { PKG_ROOT };
