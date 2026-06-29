/**
 * Umaï IG Studio — Review Gallery HTML generator (BRAND-07)
 *
 * Reads classification.json + out/{photoId}/ → writes ig-studio/gallery.html
 * Self-contained HTML (inline CSS), no build step.
 * Opens from ig-studio/ so relative out/... paths resolve.
 *
 * Run: node src/gallery.js
 */

import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PKG_ROOT } from './photos.js';
import { readStore } from './store.js';
import { dishLabel } from './kb.js';

const OUTPUT_PATH = resolve(PKG_ROOT, 'gallery.html');

// ─── Text escaping ────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Overlay badge helpers ────────────────────────────────────────────────────

function overlayBadge(entry) {
  if (entry.shotType === 'ambiance') {
    return `<span class="badge badge-photo">PHOTO-ONLY</span>`;
  }
  if (entry.confidence >= 0.7) {
    return `<span class="badge badge-logo">LOGO</span><span class="badge badge-chip">CHIP</span>`;
  }
  return `<span class="badge badge-logo">LOGO</span>`;
}

function confidenceClass(c) {
  if (c < 0.5) return 'conf-red';
  if (c < 0.7) return 'conf-amber';
  return 'conf-green';
}

// ─── Per-photo card ───────────────────────────────────────────────────────────

function renderCard(entry, outDir) {
  const { file, dishSlug, shotType, confidence, override } = entry;
  const photoId = file.replace(/\.jpg$/i, '');

  const feedPath   = `out/${photoId}/feed.png`;
  const squarePath = `out/${photoId}/square.png`;
  const storyPath  = `out/${photoId}/story.png`;

  const label     = dishLabel(dishSlug);
  const labelName = label ? label.name : escapeHtml(dishSlug);
  const priceTxt  = label && label.price != null
    ? ` — ${label.price.toFixed(2).replace('.', ',')} €`
    : '';

  const confClass    = confidenceClass(confidence);
  const overrideTxt  = override ? `<span class="badge badge-override">CORRIGÉ</span>` : '';
  const confPct      = Math.round(confidence * 100) + '%';

  return `
<div class="card" data-slug="${escapeHtml(dishSlug)}" data-shottype="${escapeHtml(shotType)}" data-conf="${confidence}">
  <div class="card-header">
    <span class="photo-id">${escapeHtml(photoId)}</span>
    ${overrideTxt}
  </div>
  <div class="thumbnails">
    <div class="thumb-wrap" title="Feed 1080×1350">
      <img src="${feedPath}" alt="feed" loading="lazy"/>
      <span class="thumb-label">Feed</span>
    </div>
    <div class="thumb-wrap" title="Square 1080×1080">
      <img src="${squarePath}" alt="square" loading="lazy"/>
      <span class="thumb-label">Square</span>
    </div>
    <div class="thumb-wrap" title="Story 1080×1920">
      <img src="${storyPath}" alt="story" loading="lazy"/>
      <span class="thumb-label">Story</span>
    </div>
  </div>
  <div class="card-body">
    <div class="dish-info">
      <span class="dish-name">${escapeHtml(labelName)}${escapeHtml(priceTxt)}</span>
      <span class="badge badge-shot">${escapeHtml(shotType)}</span>
      ${overlayBadge(entry)}
    </div>
    <div class="conf-row">
      <span class="conf-label ${confClass}">${confPct}</span>
      <div class="conf-bar-bg">
        <div class="conf-bar ${confClass}" style="width:${confPct}"></div>
      </div>
    </div>
    <p class="filename">${escapeHtml(file)}</p>
  </div>
</div>`.trim();
}

// ─── Full HTML ────────────────────────────────────────────────────────────────

function buildHTML(entries, composedCount, packshotChipCount, ambianceCount) {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  const cards = entries.map(e => {
    const photoId = e.file.replace(/\.jpg$/i, '');
    const outDir  = resolve(PKG_ROOT, 'out', photoId);
    return renderCard(e, outDir);
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Umaï IG Studio — Review Gallery</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f0e8;
      color: #1a1a1a;
      padding: 1.5rem;
    }
    header { margin-bottom: 1.5rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #2d4a30; }
    .meta { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    .stats { display: flex; gap: 1rem; flex-wrap: wrap; margin: 0.75rem 0; }
    .stat-pill {
      background: #fff; border-radius: 20px; padding: 0.3rem 0.8rem;
      font-size: 0.78rem; font-weight: 600; color: #2d4a30;
      border: 1.5px solid #77967a;
    }
    .controls {
      display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1rem 0;
    }
    .controls button {
      padding: 0.4rem 0.9rem; border: 2px solid #77967a; border-radius: 6px;
      background: #fff; color: #2d4a30; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .controls button:hover, .controls button.active { background: #77967a; color: #fff; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.2rem;
    }
    .card {
      background: #fff; border-radius: 12px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10); display: flex; flex-direction: column;
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.5rem 0.75rem 0;
    }
    .photo-id { font-size: 0.75rem; font-weight: 700; color: #77967a; }
    .thumbnails {
      display: flex; gap: 4px; padding: 6px; background: #e8e0d0;
    }
    .thumb-wrap {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
    }
    .thumb-wrap img {
      width: 100%; aspect-ratio: 4/5; object-fit: cover; border-radius: 4px;
      background: #ccc;
    }
    .thumb-label { font-size: 0.6rem; color: #666; font-weight: 600; text-transform: uppercase; }
    .card-body { padding: 0.6rem 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .dish-info { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem; }
    .dish-name { font-size: 0.9rem; font-weight: 700; color: #2d4a30; flex: 1 1 100%; }
    .badge {
      font-size: 0.62rem; font-weight: 700; padding: 0.12rem 0.42rem;
      border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .badge-shot    { background: #e8e0d0; color: #555; }
    .badge-logo    { background: #77967a; color: #fff; }
    .badge-chip    { background: #2d4a30; color: #f5f0e8; }
    .badge-photo   { background: #e8e0d0; color: #777; }
    .badge-override { background: #f5c842; color: #5a3e00; }
    .conf-row { display: flex; align-items: center; gap: 0.5rem; }
    .conf-label { font-size: 0.78rem; font-weight: 700; min-width: 2.5rem; }
    .conf-bar-bg { flex: 1; height: 5px; background: #e8e0d0; border-radius: 3px; overflow: hidden; }
    .conf-bar    { height: 100%; border-radius: 3px; }
    .conf-red    { color: #c0392b; } .conf-bar.conf-red    { background: #e74c3c; }
    .conf-amber  { color: #d35400; } .conf-bar.conf-amber  { background: #e67e22; }
    .conf-green  { color: #27ae60; } .conf-bar.conf-green  { background: #2ecc71; }
    .filename    { font-size: 0.62rem; color: #aaa; margin-top: auto; }
  </style>
</head>
<body>
  <header>
    <h1>Umaï IG Studio — Review Gallery</h1>
    <p class="meta">Généré le ${escapeHtml(now)}</p>
    <div class="stats">
      <span class="stat-pill">${composedCount} photos composées</span>
      <span class="stat-pill">${packshotChipCount} packshot + chip</span>
      <span class="stat-pill">${ambianceCount} ambiance (photo-only)</span>
    </div>
  </header>

  <div class="controls">
    <span style="font-size:0.8rem; font-weight:600; color:#555; align-self:center;">Trier par :</span>
    <button id="btn-conf-desc" class="active" onclick="sortCards('conf-desc')">Confiance ↓</button>
    <button id="btn-conf-asc" onclick="sortCards('conf-asc')">Confiance ↑</button>
    <button id="btn-slug-asc" onclick="sortCards('slug-asc')">Plat A–Z</button>
    <button id="btn-packshot" onclick="filterCards('packshot')">Packshot</button>
    <button id="btn-ambiance" onclick="filterCards('ambiance')">Ambiance</button>
    <button id="btn-all"      onclick="filterCards('all')">Tous</button>
  </div>

  <div class="grid" id="grid">
${cards}
  </div>

  <script>
    let currentFilter = 'all';

    function sortCards(mode) {
      const grid = document.getElementById('grid');
      const cards = [...grid.querySelectorAll('.card')];
      cards.sort((a, b) => {
        if (mode === 'conf-asc')  return parseFloat(a.dataset.conf) - parseFloat(b.dataset.conf);
        if (mode === 'conf-desc') return parseFloat(b.dataset.conf) - parseFloat(a.dataset.conf);
        if (mode === 'slug-asc')  return a.dataset.slug.localeCompare(b.dataset.slug);
        return 0;
      });
      cards.forEach(c => grid.appendChild(c));
      ['btn-conf-asc','btn-conf-desc','btn-slug-asc'].forEach(id => {
        const el = document.getElementById(id); if(el) el.classList.remove('active');
      });
      const btn = document.getElementById('btn-' + mode);
      if (btn) btn.classList.add('active');
    }

    function filterCards(type) {
      currentFilter = type;
      const cards = document.querySelectorAll('.card');
      cards.forEach(c => {
        const match = type === 'all' || c.dataset.shottype === type;
        c.style.display = match ? '' : 'none';
      });
      ['btn-packshot','btn-ambiance','btn-all'].forEach(id => {
        const el = document.getElementById(id); if(el) el.classList.remove('active');
      });
      const btnId = type === 'all' ? 'btn-all' : type === 'packshot' ? 'btn-packshot' : 'btn-ambiance';
      const btn = document.getElementById(btnId);
      if (btn) btn.classList.add('active');
    }
  </script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const entries = readStore();

  // Filter to only photos that have composed outputs (out/{photoId}/feed.png exists)
  const composed = entries.filter(e => {
    const photoId = e.file.replace(/\.jpg$/i, '');
    return existsSync(resolve(PKG_ROOT, 'out', photoId, 'feed.png'));
  });

  if (composed.length === 0) {
    console.error('[gallery] No composed outputs found in out/. Run `npm run compose -- --pilot` first.');
    process.exit(1);
  }

  // Stats
  const packshotChipCount = composed.filter(e => e.shotType === 'packshot' && e.confidence >= 0.7).length;
  const ambianceCount     = composed.filter(e => e.shotType === 'ambiance').length;

  const html = buildHTML(composed, composed.length, packshotChipCount, ambianceCount);
  writeFileSync(OUTPUT_PATH, html, 'utf-8');

  console.log(`\n[gallery] Written: ${OUTPUT_PATH}`);
  console.log(`[gallery] ${composed.length} photos composed:`);
  console.log(`  Packshot + chip (conf>=0.7): ${packshotChipCount}`);
  console.log(`  Ambiance (photo-only)       : ${ambianceCount}`);
  console.log(`  Packshot logo-only          : ${composed.length - packshotChipCount - ambianceCount}`);
  console.log(`\n[gallery] Open in browser: open ${OUTPUT_PATH}\n`);
}

main();
