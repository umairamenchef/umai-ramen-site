/**
 * Umaï IG Studio — SET generator (make-set)
 *
 * Curates ~16–20 ready-to-publish Instagram posts from classification.json,
 * composes 3 Meta formats per post, generates FR captions via Claude,
 * writes out/SET-manifest.json and ig-studio/set-gallery.html.
 *
 * Run: node --env-file=.env src/make-set.js
 * Or:  npm run set
 *
 * Curation rules:
 *   - Packshots: top-1 per dish slug (top-2 for tantan-umai, tokyo-ramen, gyoza)
 *   - Confidence ≥ 0.7 required for packshots
 *   - 3–4 strongest ambiance photos (highest confidence)
 *   - Cap: MAX_POSTS (~20) total
 *
 * Overlay rules:
 *   - tantan-umai, tokyo-ramen → overlayMode 'logo-name' (dish name, no price)
 *   - other packshots           → overlayMode 'logo-only'
 *   - ambiance                  → overlayMode 'photo-only'
 *   - All packshots: logoColor 'auto', logoSize 'medium', logo center at (0.85, 0.9)
 */

import sharp from 'sharp';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { composePhoto } from './compose.js';
import { generateCaption } from './caption.js';
import { loadKB } from './kb.js';
import { readStore } from './store.js';
import { loadMenu } from './menu.js';
import { PKG_ROOT } from './photos.js';
import { FORMATS } from './crop.js';

// ─── Tuning constants ─────────────────────────────────────────────────────────

/** Dishes that get 2 picks instead of 1 (signature / most photogenic families) */
const TOP2_SLUGS = new Set(['tantan-umai', 'tokyo-ramen', 'gyoza']);

/** Dishes whose posts get 'logo-name' mode (dish name text overlay) */
const LOGO_NAME_SLUGS = new Set(['tantan-umai', 'tokyo-ramen']);

const MIN_CONFIDENCE = 0.7;
const MAX_AMBIANCE   = 4;
const MAX_POSTS      = 20;

// ─── HTML escape ─────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Curation ─────────────────────────────────────────────────────────────────

/**
 * Select ~16–20 posts from the store using the curation rules.
 * Returns an array of raw classification entries (not yet augmented).
 */
function curateSelection(store) {
  // Separate packshots and ambiance
  const packshots = store.filter(
    e => e.shotType === 'packshot' && e.confidence >= MIN_CONFIDENCE,
  );
  const ambianceCandidates = store.filter(
    e => e.shotType === 'ambiance' && e.confidence >= MIN_CONFIDENCE,
  );

  // Group packshots by dishSlug, sort each group by confidence desc
  /** @type {Map<string, object[]>} */
  const bySlug = new Map();
  for (const e of packshots) {
    if (!bySlug.has(e.dishSlug)) bySlug.set(e.dishSlug, []);
    bySlug.get(e.dishSlug).push(e);
  }
  for (const arr of bySlug.values()) {
    arr.sort((a, b) => b.confidence - a.confidence);
  }

  // Pick top-1 per dish (top-2 for signature families)
  const selected = [];
  for (const [slug, arr] of bySlug) {
    const limit = TOP2_SLUGS.has(slug) ? 2 : 1;
    selected.push(...arr.slice(0, limit));
  }

  // Sort packshot selection by confidence desc for a stable, quality-first order
  selected.sort((a, b) => b.confidence - a.confidence);

  // Top-N ambiance sorted by confidence desc
  const topAmbiance = [...ambianceCandidates]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_AMBIANCE);

  // Combine and cap
  return [...selected, ...topAmbiance].slice(0, MAX_POSTS);
}

// ─── Entry augmentation ───────────────────────────────────────────────────────

/**
 * Augment a raw classification entry with overlay / dish fields.
 * Returns a new object — does NOT mutate the original.
 *
 * @param {object} raw — entry from classification.json
 * @param {Map<string,object>} menuBySlug — from loadMenu().bySlug
 * @returns {object} augmented entry ready for composePhoto() and generateCaption()
 */
function augmentEntry(raw, menuBySlug) {
  if (raw.shotType === 'ambiance' || raw.dishSlug === 'ambiance') {
    return {
      ...raw,
      overlayMode: 'photo-only',
      dishName:    'Ambiance Umaï',
      price:       null,
      baseline:    '',
      showPrice:   false,
    };
  }

  const slug     = raw.dishSlug;
  const menuItem = menuBySlug.get(slug);

  const overlayMode = LOGO_NAME_SLUGS.has(slug) ? 'logo-name' : 'logo-only';

  return {
    ...raw,
    overlayMode,
    logoColor: 'auto',
    logoSize:  'medium',
    // Logo center at bottom-right (normalized coords)
    logoPosX:  0.85,
    logoPosY:  0.90,
    showPrice: false, // no price shown in overlay
    dishName:  menuItem?.name    ?? raw.dishName ?? slug,
    price:     menuItem?.price   ?? raw.price    ?? null,
    baseline:  menuItem?.baseline ?? raw.baseline ?? '',
  };
}

// ─── Patch classification.json with resolved overlay fields ──────────────────

/**
 * Write augmented overlay/dish fields back into classification.json
 * for the selected entries so the editor and future compose runs reflect them.
 *
 * Only patches the selected files; leaves all other entries untouched.
 * Preserves the `override` flag.
 */
function patchStore(store, augmented) {
  const storePath    = resolve(PKG_ROOT, 'classification.json');
  const storeByFile  = new Map(store.map(e => [e.file, { ...e }]));

  for (const aug of augmented) {
    const entry = storeByFile.get(aug.file);
    if (!entry) continue;

    // Patch only overlay / label fields — never touch classification fields
    Object.assign(entry, {
      overlayMode: aug.overlayMode,
      logoColor:   aug.logoColor   ?? undefined,
      logoSize:    aug.logoSize    ?? undefined,
      logoPosX:    aug.logoPosX   ?? undefined,
      logoPosY:    aug.logoPosY   ?? undefined,
      showPrice:   aug.showPrice,
      dishName:    aug.dishName,
      price:       aug.price,
      baseline:    aug.baseline,
    });
  }

  const sorted = [...storeByFile.values()].sort((a, b) =>
    a.file.localeCompare(b.file)
  );
  writeFileSync(storePath, JSON.stringify(sorted, null, 2), 'utf-8');
}

// ─── Verification ─────────────────────────────────────────────────────────────

/** Expected pixel dimensions per format name */
const EXPECTED_DIMS = {
  feed:   { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  story:  { w: 1080, h: 1920 },
};

/**
 * Verify all generated PNGs exist and have correct dimensions.
 * Returns { ok: boolean, errors: string[] }.
 */
async function verifyOutputs(manifest) {
  const errors = [];

  for (const post of manifest) {
    for (const [fmt, relPath] of Object.entries(post.formats)) {
      const fullPath = resolve(PKG_ROOT, relPath);
      if (!existsSync(fullPath)) {
        errors.push(`MISSING PNG: ${relPath}`);
        continue;
      }
      const meta = await sharp(fullPath).metadata();
      const expected = EXPECTED_DIMS[fmt];
      if (meta.width !== expected.w || meta.height !== expected.h) {
        errors.push(
          `DIM MISMATCH: ${relPath} — got ${meta.width}×${meta.height}, want ${expected.w}×${expected.h}`,
        );
      }
    }

    // Caption check
    const captionFull = resolve(PKG_ROOT, post.captionPath);
    if (!existsSync(captionFull)) {
      errors.push(`MISSING CAPTION: ${post.captionPath}`);
    } else {
      const content = readFileSync(captionFull, 'utf-8').trim();
      if (!content) errors.push(`EMPTY CAPTION: ${post.captionPath}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// ─── Gallery HTML ─────────────────────────────────────────────────────────────

function buildGalleryHTML(manifest) {
  const now        = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const packshots  = manifest.filter(p => p.overlayMode !== 'photo-only');
  const ambianceN  = manifest.filter(p => p.overlayMode === 'photo-only').length;

  const cards = manifest.map((post, idx) => {
    const modeLabel = post.overlayMode === 'photo-only' ? 'Ambiance'
      : post.overlayMode === 'logo-name'  ? 'Logo + Nom'
      : 'Logo';

    const modeClass = post.overlayMode === 'photo-only' ? 'badge-photo'
      : post.overlayMode === 'logo-name'  ? 'badge-name'
      : 'badge-logo';

    const confPct = Math.round(post.confidence * 100) + '%';

    // Multiline caption with line-break preservation
    const captionHtml = post.caption
      ? esc(post.caption).replace(/\n/g, '<br>')
      : '<em style="color:#bbb">—</em>';

    const priceHtml = post.price != null
      ? ` <span class="price">${String(post.price).replace('.', ',')} €</span>`
      : '';

    return `
<div class="card" data-slug="${esc(post.dishSlug)}" data-mode="${esc(post.overlayMode)}">
  <div class="card-num">${idx + 1}</div>
  <div class="thumbnails">
    <div class="thumb-wrap" title="Feed 1080×1350">
      <img src="${esc(post.formats.feed)}" alt="Feed" loading="lazy"/>
      <span class="thumb-label">Feed</span>
    </div>
    <div class="thumb-wrap" title="Square 1080×1080">
      <img src="${esc(post.formats.square)}" alt="Square" loading="lazy"/>
      <span class="thumb-label">Square</span>
    </div>
    <div class="thumb-wrap" title="Story 1080×1920">
      <img src="${esc(post.formats.story)}" alt="Story" loading="lazy"/>
      <span class="thumb-label">Story</span>
    </div>
  </div>
  <div class="card-body">
    <div class="dish-row">
      <span class="dish-name">${esc(post.dishName ?? post.dishSlug)}${priceHtml}</span>
      <span class="badge ${modeClass}">${modeLabel}</span>
      <span class="conf">${confPct}</span>
    </div>
    <div class="photo-id">${esc(post.id)} · ${esc(post.dishSlug)}</div>
    <div class="caption-box">${captionHtml}</div>
  </div>
</div>`.trim();
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Umaï — SET Review Gallery</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#f5f0e8;color:#1a1a1a;padding:1.5rem}
    header{margin-bottom:1.5rem}
    h1{font-size:1.6rem;font-weight:800;color:#2d4a30;letter-spacing:-.01em}
    .subtitle{font-size:.85rem;color:#666;margin-top:.25rem}
    .stats{display:flex;gap:.65rem;flex-wrap:wrap;margin:.85rem 0}
    .stat-pill{background:#fff;border-radius:20px;padding:.28rem .75rem;font-size:.78rem;font-weight:600;color:#2d4a30;border:1.5px solid #77967a}
    .controls{display:flex;gap:.45rem;flex-wrap:wrap;margin:1rem 0;align-items:center}
    .controls-label{font-size:.8rem;font-weight:600;color:#777}
    .controls button{padding:.38rem .85rem;border:2px solid #77967a;border-radius:6px;background:#fff;color:#2d4a30;font-size:.8rem;font-weight:600;cursor:pointer;transition:background .15s}
    .controls button:hover,.controls button.active{background:#77967a;color:#fff}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:1.2rem}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.09);display:flex;flex-direction:column;position:relative}
    .card-num{position:absolute;top:.5rem;left:.5rem;width:1.7rem;height:1.7rem;background:#2d4a30;color:#f5f0e8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.25)}
    .thumbnails{display:flex;gap:4px;padding:6px;background:#e8e0d0}
    .thumb-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px}
    .thumb-wrap img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:4px;background:#d0c8b8}
    .thumb-label{font-size:.58rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
    .card-body{padding:.65rem .75rem;display:flex;flex-direction:column;gap:.3rem;flex:1}
    .dish-row{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}
    .dish-name{font-size:.93rem;font-weight:700;color:#2d4a30;flex:1;min-width:0}
    .price{font-size:.82rem;font-weight:600;color:#77967a;margin-left:.2rem}
    .conf{font-size:.73rem;font-weight:700;color:#77967a;white-space:nowrap}
    .photo-id{font-size:.63rem;color:#bbb;font-weight:500}
    .badge{font-size:.6rem;font-weight:700;padding:.1rem .4rem;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;flex-shrink:0}
    .badge-logo{background:#77967a;color:#fff}
    .badge-name{background:#2d4a30;color:#f5f0e8}
    .badge-photo{background:#e0dbd0;color:#888}
    .caption-box{font-size:.77rem;line-height:1.55;color:#444;border-top:1px solid #ece7dc;padding-top:.45rem;margin-top:.2rem;max-height:10rem;overflow-y:auto;white-space:pre-line;flex:1}
  </style>
</head>
<body>
  <header>
    <h1>Umaï — SET Review Gallery</h1>
    <p class="subtitle">Généré le ${esc(now)}</p>
    <div class="stats">
      <span class="stat-pill">${manifest.length} posts</span>
      <span class="stat-pill">${packshots.length} packshots</span>
      <span class="stat-pill">${ambianceN} ambiance</span>
      <span class="stat-pill">${manifest.length * 3} images</span>
    </div>
  </header>

  <div class="controls">
    <span class="controls-label">Filtrer :</span>
    <button id="btn-all" class="active" onclick="filter('all')">Tous (${manifest.length})</button>
    <button id="btn-packshot" onclick="filter('packshot')">Packshots (${packshots.length})</button>
    <button id="btn-ambiance" onclick="filter('photo-only')">Ambiance (${ambianceN})</button>
  </div>

  <div class="grid" id="grid">
${cards}
  </div>

  <script>
    function filter(mode) {
      document.querySelectorAll('.card').forEach(c => {
        const isAmbiance = c.dataset.mode === 'photo-only';
        const show = mode === 'all'
          || (mode === 'photo-only' && isAmbiance)
          || (mode === 'packshot' && !isAmbiance);
        c.style.display = show ? '' : 'none';
      });
      document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
      const idMap = { all: 'btn-all', 'photo-only': 'btn-ambiance', packshot: 'btn-packshot' };
      const btn = document.getElementById(idMap[mode] || 'btn-all');
      if (btn) btn.classList.add('active');
    }
  </script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();

  console.log('\n======================================');
  console.log(' Umaï IG Studio — SET Generator');
  console.log('======================================\n');

  // Load data
  const kb              = loadKB();
  const store           = readStore();
  const { nap, bySlug: menuBySlug } = loadMenu();

  if (store.length === 0) {
    console.error('[make-set] classification.json is empty. Run `npm run classify` first.');
    process.exit(1);
  }

  // ── 1. Curate ──────────────────────────────────────────────────────────────
  const rawSelection = curateSelection(store);
  console.log(`[make-set] Curated ${rawSelection.length} posts:\n`);

  // ── 2. Augment entries ─────────────────────────────────────────────────────
  const augmented = rawSelection.map(e => augmentEntry(e, menuBySlug));

  // Print selection table
  console.log(
    '  ' +
    'FILE'.padEnd(16) + ' | ' +
    'SLUG'.padEnd(22) + ' | ' +
    'CONF'.padEnd(6) + ' | ' +
    'MODE'
  );
  console.log('  ' + '-'.repeat(66));
  for (const e of augmented) {
    console.log(
      '  ' +
      e.file.padEnd(16) + ' | ' +
      e.dishSlug.padEnd(22) + ' | ' +
      e.confidence.toFixed(2).padEnd(6) + ' | ' +
      (e.overlayMode ?? 'logo-only')
    );
  }
  console.log();

  // ── 3. Write resolved fields back to classification.json ───────────────────
  patchStore(store, augmented);
  console.log('[make-set] classification.json patched with overlay fields.\n');

  // ── 4. Compose + caption each post ────────────────────────────────────────
  mkdirSync(resolve(PKG_ROOT, 'out'), { recursive: true });

  const manifest = [];
  let totalImages = 0;

  for (let i = 0; i < augmented.length; i++) {
    const aug     = augmented[i];
    const photoId = aug.file.replace(/\.jpg$/i, '');
    const prefix  = `[${String(i + 1).padStart(2, '0')}/${augmented.length}] ${photoId}`;

    // Compose 3 formats
    process.stdout.write(`${prefix} — compose... `);
    const { dir } = await composePhoto(aug.file, aug, kb);
    totalImages += 3;
    process.stdout.write('OK   caption... ');

    // Generate caption
    const caption = await generateCaption({
      dishName:    aug.dishName,
      baseline:    aug.baseline,
      price:       aug.price,
      overlayMode: aug.overlayMode,
      nap,
    });
    const captionPath = resolve(dir, 'caption.txt');
    writeFileSync(captionPath, caption, 'utf-8');
    process.stdout.write('OK\n');

    manifest.push({
      id:          photoId,
      file:        aug.file,
      dishSlug:    aug.dishSlug,
      dishName:    aug.dishName,
      price:       aug.price,
      baseline:    aug.baseline,
      overlayMode: aug.overlayMode,
      confidence:  aug.confidence,
      formats: {
        feed:   `out/${photoId}/feed.png`,
        square: `out/${photoId}/square.png`,
        story:  `out/${photoId}/story.png`,
      },
      captionPath: `out/${photoId}/caption.txt`,
      caption,
    });
  }

  // ── 5. Write SET-manifest.json ────────────────────────────────────────────
  const manifestPath = resolve(PKG_ROOT, 'out', 'SET-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n[make-set] Manifest  → ${manifestPath}`);

  // ── 6. Generate set-gallery.html ─────────────────────────────────────────
  const galleryPath = resolve(PKG_ROOT, 'set-gallery.html');
  writeFileSync(galleryPath, buildGalleryHTML(manifest), 'utf-8');
  console.log(`[make-set] Gallery   → ${galleryPath}`);

  // ── 7. Verify outputs ─────────────────────────────────────────────────────
  console.log('\n[make-set] Verifying outputs...');
  const { ok, errors } = await verifyOutputs(manifest);
  if (ok) {
    console.log('[make-set] All outputs verified OK.\n');
  } else {
    console.error('[make-set] Verification issues:');
    for (const err of errors) console.error('  ' + err);
    console.log();
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('======================================');
  console.log(` DONE — ${manifest.length} posts | ${totalImages} images | ${elapsed}s`);
  console.log('======================================\n');
  console.log(`Open gallery: open ${galleryPath}\n`);

  // Print final selection for caller inspection
  console.log('[make-set] Final selection:\n');
  for (const p of manifest) {
    const price = p.price != null ? ` (${p.price} €)` : '';
    console.log(`  ${p.id} → ${p.dishSlug}${price} [conf=${p.confidence.toFixed(2)}, mode=${p.overlayMode}]`);
  }
  console.log();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => {
    console.error('\n[make-set] Fatal error:', e?.message ?? e);
    process.exit(1);
  });
}
