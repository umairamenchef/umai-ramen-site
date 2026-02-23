#!/usr/bin/env node
/**
 * Upload Nis&For photos to Sanity and assign to gallery + menu items.
 *
 * Usage: SANITY_TOKEN=<token> node scripts/upload-photos.mjs
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ID = 'c7twe801';
const DATASET = 'production';
const API_VERSION = '2025-01-01';
const TOKEN = process.env.SANITY_TOKEN;

if (!TOKEN) {
  console.error('Missing SANITY_TOKEN. Run with:\n  SANITY_TOKEN=<token> node scripts/upload-photos.mjs');
  process.exit(1);
}

const PHOTOS_DIR = resolve(import.meta.dirname, '..', 'photos');
const API = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}`;

// ─── Photo → Document mapping ──────────────────────────────────────
// Each entry: [filename, documentId, field] where field is 'image'
const ASSIGNMENTS = [
  // Gallery images (replace placeholders)
  ['Umaï_présélection_023.jpg', 'gal-01', 'image'],   // Tori paitan being assembled
  ['Umaï_présélection_001.jpg', 'gal-02', 'image'],   // Noodles being pulled
  ['Umaï_présélection_098.jpg', 'gal-03', 'image'],   // Gyoza top-down
  ['Umaï_présélection_032.jpg', 'gal-04', 'image'],   // Interior UMAÏ logo wall
  ['Umaï_présélection_056.jpg', 'gal-05', 'image'],   // Miso ramen top-down
  ['Umaï_présélection_169.jpg', 'gal-06', 'image'],   // Table spread lifestyle

  // Extra gallery entries (will create new documents)
  ['Umaï_présélection_173.jpg', 'gal-07', 'image'],   // Top-down 4 people eating
  ['Umaï_présélection_073.jpg', 'gal-08', 'image'],   // Kamo soba marble
  ['Umaï_présélection_039.jpg', 'gal-09', 'image'],   // Kanji wall + sake

  // Menu item images
  ['Umaï_présélection_098.jpg', 'item-gyoza', 'image'],
  ['Umaï_présélection_110.jpg', 'item-takoyaki', 'image'],
  ['Umaï_présélection_118.jpg', 'item-karaage', 'image'],
  ['Umaï_présélection_129.jpg', 'item-tori-paitan', 'image'],
  ['Umaï_présélection_056.jpg', 'item-miso', 'image'],
  ['Umaï_présélection_136.jpg', 'item-shoyu', 'image'],
  ['Umaï_présélection_140.jpg', 'item-shio', 'image'],
  ['Umaï_présélection_062.jpg', 'item-tantan', 'image'],
  ['Umaï_présélection_153.jpg', 'item-chashu-mazesoba', 'image'],
  ['Umaï_présélection_084.jpg', 'item-karaage-mazesoba', 'image'],
  ['Umaï_présélection_073.jpg', 'item-kamo-soba', 'image'],
  ['Umaï_présélection_147.jpg', 'item-udon-karaage', 'image'],
  ['Umaï_présélection_145.jpg', 'item-tsukemen', 'image'],  // Tempura udon is closest

  // Hero image
  ['Umaï_2024_Nis&For_72dpi_078.jpg', 'siteSettings', 'heroImage'],
];

// ─── Upload image to Sanity ────────────────────────────────────────
const uploadCache = new Map();

async function uploadImage(filename) {
  if (uploadCache.has(filename)) return uploadCache.get(filename);

  const filepath = resolve(PHOTOS_DIR, filename);
  const data = readFileSync(filepath);
  const label = filename.replace(/\.[^.]+$/, '').replace(/[_\s]+/g, '-');

  console.log(`  Uploading ${filename} (${(data.length / 1024 / 1024).toFixed(1)} MB)…`);

  const res = await fetch(`${API}/assets/images/${DATASET}?filename=${encodeURIComponent(filename)}&label=${encodeURIComponent(label)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: data,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for ${filename}: ${res.status} ${text}`);
  }

  const json = await res.json();
  const assetId = json.document._id;
  console.log(`  → ${assetId}`);
  uploadCache.set(filename, assetId);
  return assetId;
}

// ─── Create extra gallery docs ─────────────────────────────────────
async function createExtraGalleryDocs() {
  const extras = [
    {
      _id: 'gal-07',
      _type: 'gallery',
      title: { _type: 'localeString', fr: 'Table partagée', en: 'Shared table', de: 'Gemeinsamer Tisch' },
      alt: { _type: 'localeString', fr: 'Convives partageant ramen et saké à table', en: 'Guests sharing ramen and sake at the table', de: 'Gäste teilen Ramen und Sake am Tisch' },
      order: 7,
    },
    {
      _id: 'gal-08',
      _type: 'gallery',
      title: { _type: 'localeString', fr: 'Kamo Soba', en: 'Kamo Soba', de: 'Kamo Soba' },
      alt: { _type: 'localeString', fr: 'Bol de kamo soba au canard sur marbre blanc', en: 'Duck kamo soba bowl on white marble', de: 'Enten-Kamo-Soba-Schüssel auf weißem Marmor' },
      order: 8,
    },
    {
      _id: 'gal-09',
      _type: 'gallery',
      title: { _type: 'localeString', fr: 'Décoration 麺', en: 'Noodle kanji decor', de: 'Nudel-Kanji-Dekoration' },
      alt: { _type: 'localeString', fr: 'Kanji 麺 sur le mur avec bouteilles de saké et fleurs séchées', en: 'Noodle kanji on wall with sake bottles and dried flowers', de: 'Nudel-Kanji an der Wand mit Sake-Flaschen und Trockenblumen' },
      order: 9,
    },
  ];

  const mutations = extras.map((doc) => ({ createOrReplace: doc }));

  const res = await fetch(`${API}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create gallery docs: ${text}`);
  }
  console.log('Created 3 extra gallery documents.');
}

// ─── Patch document with image ref ─────────────────────────────────
async function patchImage(docId, field, assetId) {
  const mutations = [{
    patch: {
      id: docId,
      set: {
        [field]: {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
        },
      },
    },
  }];

  const res = await fetch(`${API}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  ⚠ Patch failed for ${docId}: ${text}`);
    return false;
  }
  return true;
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('Creating extra gallery documents…');
  await createExtraGalleryDocs();

  console.log(`\nProcessing ${ASSIGNMENTS.length} photo assignments…\n`);

  let uploaded = 0;
  let patched = 0;

  for (const [filename, docId, field] of ASSIGNMENTS) {
    try {
      const assetId = await uploadImage(filename);
      const ok = await patchImage(docId, field, assetId);
      if (ok) {
        console.log(`  ✓ ${docId}.${field} ← ${filename}\n`);
        patched++;
      }
      uploaded++;
    } catch (err) {
      console.error(`  ✗ ${filename} → ${docId}: ${err.message}\n`);
    }
  }

  console.log(`\nDone — ${uploadCache.size} unique photos uploaded, ${patched} documents patched.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
