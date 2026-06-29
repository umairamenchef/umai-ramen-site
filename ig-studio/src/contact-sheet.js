/**
 * Umaï IG Studio — HTML Contact Sheet Generator
 *
 * Reads classification.json → writes ig-studio/contact-sheet.html
 * Self-contained HTML (inline CSS + JS), no build step needed.
 * Opens directly from ig-studio/ so relative photo paths work.
 *
 * Sort order: confidence ASCENDING by default (worst-first = review priority).
 * Client-side sort buttons: conf asc/desc, dishSlug A-Z.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PKG_ROOT } from './photos.js';

const STORE_PATH = resolve(PKG_ROOT, 'classification.json');
const OUTPUT_PATH = resolve(PKG_ROOT, 'contact-sheet.html');

// ─── Text escaping ────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

function confidenceClass(c) {
  if (c < 0.5) return 'conf-red';
  if (c < 0.7) return 'conf-amber';
  return 'conf-green';
}

function pct(c) {
  return Math.round(c * 100) + '%';
}

// ─── Card HTML ────────────────────────────────────────────────────────────────

function renderCard(entry) {
  const { file, dishSlug, shotType, confidence, reasoning, override } = entry;
  const confClass = confidenceClass(confidence);
  const overrideBadge = override
    ? `<span class="badge badge-override">CORRIGÉ</span>`
    : '';

  return `
  <div class="card" data-conf="${confidence}" data-slug="${escapeHtml(dishSlug)}">
    <div class="card-img-wrap">
      <img src="photos/${escapeHtml(file)}" alt="${escapeHtml(file)}" loading="lazy" />
    </div>
    <div class="card-body">
      <div class="card-title">
        <span class="dish-slug">${escapeHtml(dishSlug)}</span>
        <span class="badge badge-shot">${escapeHtml(shotType)}</span>
        ${overrideBadge}
      </div>
      <div class="conf-row">
        <span class="conf-label ${confClass}">${pct(confidence)}</span>
        <div class="conf-bar-bg">
          <div class="conf-bar ${confClass}" style="width:${pct(confidence)}"></div>
        </div>
      </div>
      <p class="reasoning">${escapeHtml(reasoning)}</p>
      <p class="filename">${escapeHtml(file)}</p>
    </div>
  </div>`.trim();
}

// ─── Full HTML ────────────────────────────────────────────────────────────────

function buildHTML(entries) {
  const sorted = [...entries].sort((a, b) => a.confidence - b.confidence);
  const cards = sorted.map(renderCard).join('\n');
  const total = entries.length;
  const overrideCount = entries.filter(e => e.override).length;
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Umaï IG Studio — Contact Sheet</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f0e8;
      color: #1a1a1a;
      padding: 1.5rem;
    }
    header {
      margin-bottom: 1.5rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #2d4a30; }
    .meta { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    .controls {
      display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1rem 0;
    }
    .controls button {
      padding: 0.4rem 0.9rem;
      border: 2px solid #77967a;
      border-radius: 6px;
      background: #fff;
      color: #2d4a30;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .controls button:hover { background: #77967a; color: #fff; }
    .controls button.active { background: #77967a; color: #fff; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .card {
      background: #fff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
    }
    .card-img-wrap {
      width: 100%;
      aspect-ratio: 1;
      overflow: hidden;
      background: #e8e0d0;
    }
    .card-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .card-body { padding: 0.75rem; flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
    .card-title { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; }
    .dish-slug { font-weight: 700; font-size: 0.95rem; color: #2d4a30; }
    .badge {
      font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.45rem;
      border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .badge-shot { background: #e8e0d0; color: #555; }
    .badge-override { background: #f5c842; color: #5a3e00; }
    .conf-row { display: flex; align-items: center; gap: 0.5rem; }
    .conf-label {
      font-size: 0.8rem; font-weight: 700; min-width: 2.5rem;
    }
    .conf-bar-bg {
      flex: 1; height: 6px; background: #e8e0d0; border-radius: 3px; overflow: hidden;
    }
    .conf-bar { height: 100%; border-radius: 3px; }
    .conf-red  { color: #c0392b; }
    .conf-amber { color: #d35400; }
    .conf-green { color: #27ae60; }
    .conf-bar.conf-red   { background: #e74c3c; }
    .conf-bar.conf-amber { background: #e67e22; }
    .conf-bar.conf-green { background: #2ecc71; }
    .reasoning {
      font-size: 0.72rem; color: #555; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .filename { font-size: 0.65rem; color: #aaa; margin-top: auto; }
  </style>
</head>
<body>
  <header>
    <h1>Umaï IG Studio — Contact Sheet</h1>
    <p class="meta">${total} photos · ${overrideCount} corrigées · Généré le ${escapeHtml(now)}</p>
    <p class="meta" style="color:#c0392b; font-weight:600; margin-top:0.3rem;">
      ⚠ Ordre par défaut : confiance croissante (pires en premier — priorité de révision)
    </p>
  </header>

  <div class="controls">
    <span style="font-size:0.8rem; font-weight:600; color:#555; align-self:center;">Trier par :</span>
    <button id="btn-conf-asc" class="active" onclick="sortCards('conf-asc')">Confiance ↑ (pires en premier)</button>
    <button id="btn-conf-desc" onclick="sortCards('conf-desc')">Confiance ↓ (meilleures en premier)</button>
    <button id="btn-slug-asc" onclick="sortCards('slug-asc')">Plat A–Z</button>
  </div>

  <div class="grid" id="grid">
${cards}
  </div>

  <script>
    function sortCards(mode) {
      const grid = document.getElementById('grid');
      const cards = [...grid.querySelectorAll('.card')];
      cards.sort((a, b) => {
        if (mode === 'conf-asc') return parseFloat(a.dataset.conf) - parseFloat(b.dataset.conf);
        if (mode === 'conf-desc') return parseFloat(b.dataset.conf) - parseFloat(a.dataset.conf);
        if (mode === 'slug-asc') return a.dataset.slug.localeCompare(b.dataset.slug);
        return 0;
      });
      cards.forEach(c => grid.appendChild(c));
      ['btn-conf-asc','btn-conf-desc','btn-slug-asc'].forEach(id => {
        document.getElementById(id).classList.remove('active');
      });
      document.getElementById('btn-' + mode.replace(/-/g, '-')).classList.add('active');
    }
  </script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(STORE_PATH)) {
    console.error(
      '[contact-sheet] Error: classification.json not found.\n' +
      'Run `npm run classify -- --pilot` first to generate it.'
    );
    process.exit(1);
  }

  let entries;
  try {
    const raw = readFileSync(STORE_PATH, 'utf-8');
    entries = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('empty or non-array');
    }
  } catch (err) {
    console.error('[contact-sheet] Error reading classification.json:', err.message);
    console.error('Run `npm run classify -- --pilot` first.');
    process.exit(1);
  }

  const html = buildHTML(entries);
  writeFileSync(OUTPUT_PATH, html, 'utf-8');

  const overrideCount = entries.filter(e => e.override).length;
  const redCount = entries.filter(e => e.confidence < 0.5).length;
  const amberCount = entries.filter(e => e.confidence >= 0.5 && e.confidence < 0.7).length;
  const greenCount = entries.filter(e => e.confidence >= 0.7).length;

  console.log(`\n[contact-sheet] Generated: ${OUTPUT_PATH}`);
  console.log(`[contact-sheet] ${entries.length} entries:`);
  console.log(`  Red   (conf < 0.5): ${redCount}`);
  console.log(`  Amber (0.5–0.7)   : ${amberCount}`);
  console.log(`  Green (>= 0.7)    : ${greenCount}`);
  if (overrideCount > 0) {
    console.log(`  Overridden (human): ${overrideCount}`);
  }
  console.log(`\n[contact-sheet] Open in browser: open ${OUTPUT_PATH}\n`);
}

main();
