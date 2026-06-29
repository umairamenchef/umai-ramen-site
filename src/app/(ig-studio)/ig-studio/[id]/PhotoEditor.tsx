'use client';

/**
 * Per-photo editor client component.
 * Sections: Plat | Affichage | Légende | Aperçu | Actions
 *
 * Fixes applied (07-UX):
 *  - FIX-1: initialOverlayMode computed from dishSlug — ambiance never gets 'packshot'
 *  - FIX-3: format toggle (Feed / Carré / Story) threaded into preview API
 *  - FIX-4: FR UI with labeled sections and contextual helper text
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  saveOverride,
  saveCaption,
  generateCaptionAction,
  regeneratePhoto,
  type OverrideFields,
} from '@/lib/ig-studio/actions';
import type { IgEntry, MenuGroup } from '@/lib/ig-studio/data';

interface Nap {
  name: string;
  address: string;
  phone: string;
  instagram: string;
  website: string;
}

interface PhotoEditorProps {
  id: string;
  entry: IgEntry | null;
  caption: string;
  groups: MenuGroup[];
  nap: Nap;
}

type PreviewFormat = 'feed' | 'square' | 'story';

const FORMAT_LABELS: Record<PreviewFormat, string> = {
  feed:   'Feed 1080×1350',
  square: 'Carré 1080×1080',
  story:  'Story 1080×1920',
};

// Build a flat slug → item map from all groups
function buildSlugMap(groups: MenuGroup[]) {
  const map = new Map<string, { name: string; price: number | null; baseline: string; overlay?: string; vege?: boolean; signature?: boolean }>();
  for (const g of groups) {
    for (const item of g.items) {
      map.set(item.slug, item);
    }
  }
  return map;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PhotoEditor({ id, entry, caption: initialCaption, groups, nap }: PhotoEditorProps) {
  const slugMap = buildSlugMap(groups);

  // ── FIX-1: compute initial overlayMode from dishSlug, not from stored value alone ──
  // Old entries in classification.json have no overlayMode field → default was 'packshot'
  // even for ambiance photos. Now we derive from the slug first.
  const initialSlug = entry?.dishSlug ?? 'ambiance';
  const initialItem = slugMap.get(initialSlug);
  const initialOverlayMode: 'packshot' | 'photo-only' =
    (initialSlug === 'ambiance' || initialItem?.overlay === 'none')
      ? 'photo-only'
      : (entry?.overlayMode ?? 'packshot') as 'packshot' | 'photo-only';

  // Seed state from server-loaded entry (or defaults)
  const [dishSlug, setDishSlug]   = useState(initialSlug);
  const [dishName, setDishName]   = useState(
    entry?.dishName ?? slugMap.get(initialSlug)?.name ?? 'Ambiance (photo-only)'
  );
  const [price, setPrice]         = useState<number | null>(entry?.price ?? null);
  const [baseline, setBaseline]   = useState(entry?.baseline ?? '');
  const [overlayMode, setOverlayMode] = useState<'packshot' | 'photo-only'>(initialOverlayMode);
  const [caption, setCaption]     = useState(initialCaption);

  // FIX-3: format toggle for preview
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('feed');

  // UI state
  const [saveStatus, setSaveStatus]             = useState<'idle' | 'saved' | 'error'>('idle');
  const [captionSaveStatus, setCaptionSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [regenStatus, setRegenStatus]           = useState<'idle' | 'success' | 'error' | 'dirty'>('idle');
  const [regenMsg, setRegenMsg]                 = useState('');
  const [captionError, setCaptionError]         = useState('');

  const [isSaving, startSave]     = useTransition();
  const [isCapSaving, startCapSave] = useTransition();
  const [isCapGen, startCapGen]   = useTransition();
  const [isRegen, startRegen]     = useTransition();

  // Live preview state
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]   = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevObjectUrl = useRef<string | null>(null);

  // Track dirty state (unsaved changes vs what's in classification.json)
  const [isDirty, setIsDirty] = useState(false);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isAmbiance  = dishSlug === 'ambiance' || slugMap.get(dishSlug)?.overlay === 'none';
  const currentItem = slugMap.get(dishSlug);

  // ─── Dish selection autofill ───────────────────────────────────────────────

  function handleDishChange(slug: string) {
    const item = slugMap.get(slug);
    setDishSlug(slug);
    setDishName(item?.name ?? slug);
    setPrice(item?.price ?? null);
    setBaseline(item?.baseline ?? '');
    if (slug === 'ambiance' || item?.overlay === 'none') {
      setOverlayMode('photo-only');
    } else {
      setOverlayMode('packshot');
    }
    setIsDirty(true);
    setRegenStatus('dirty');
  }

  // ─── Live preview (debounced 400 ms) ──────────────────────────────────────

  const triggerPreview = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');
      try {
        const res = await fetch('/api/ig-studio/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            format: previewFormat,   // FIX-3: thread format
            entry: {
              file: id + '.jpg',
              dishSlug,
              dishName,
              price,
              baseline,
              overlayMode,
              shotType: entry?.shotType ?? 'packshot',
              confidence: entry?.confidence ?? 0,
            },
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          setPreviewError('Aperçu indisponible : ' + text.slice(0, 100));
          return;
        }

        const blob = await res.blob();
        if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
        const url = URL.createObjectURL(blob);
        prevObjectUrl.current = url;
        setPreviewUrl(url);
      } catch (err) {
        setPreviewError(String(err));
      } finally {
        setPreviewLoading(false);
      }
    }, 400);
  }, [id, dishSlug, dishName, price, baseline, overlayMode, previewFormat, entry?.shotType, entry?.confidence]);

  useEffect(() => {
    triggerPreview();
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [triggerPreview]);

  useEffect(() => {
    return () => {
      if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
    };
  }, []);

  // ─── Save override ─────────────────────────────────────────────────────────

  function handleSave() {
    startSave(async () => {
      const fields: OverrideFields = { dishSlug, dishName, price, baseline, overlayMode };
      const res = await saveOverride(id, fields);
      if (res.ok) {
        setSaveStatus('saved');
        setIsDirty(false);
        setRegenStatus('idle');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    });
  }

  // ─── Save caption ──────────────────────────────────────────────────────────

  function handleSaveCaption() {
    startCapSave(async () => {
      const res = await saveCaption(id, caption);
      if (res.ok) {
        setCaptionSaveStatus('saved');
        setTimeout(() => setCaptionSaveStatus('idle'), 3000);
      } else {
        setCaptionSaveStatus('error');
        setTimeout(() => setCaptionSaveStatus('idle'), 4000);
      }
    });
  }

  // ─── Generate caption ──────────────────────────────────────────────────────

  function handleGenerateCaption() {
    setCaptionError('');
    startCapGen(async () => {
      const res = await generateCaptionAction(id, {
        dishSlug,
        dishName,
        price,
        baseline,
        overlayMode,
      });
      if (res.ok && res.caption) {
        setCaption(res.caption);
      } else {
        setCaptionError(res.error ?? 'Erreur lors de la génération');
      }
    });
  }

  // ─── Regenerate (3 formats) ────────────────────────────────────────────────

  function handleRegenerate() {
    setRegenMsg('');
    startRegen(async () => {
      const res = await regeneratePhoto(id);
      if (res.ok) {
        setRegenStatus('success');
        setRegenMsg('3 formats écrits dans out/' + id + '/');
      } else {
        setRegenStatus('error');
        setRegenMsg(res.error ?? 'Erreur lors de la régénération');
      }
      setTimeout(() => {
        setRegenStatus('idle');
        setRegenMsg('');
      }, 6000);
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 max-w-3xl mx-auto">

      {/* ── Fil conducteur ──────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-500 leading-relaxed border border-gray-800 rounded-lg px-4 py-3">
        <span className="font-semibold text-gray-400">Comment utiliser cet éditeur :</span>{' '}
        1. Choisir le plat → 2. Vérifier l&apos;affichage sur la photo → 3. Générer / éditer la légende → 4. Enregistrer → 5. Régénérer les 3 formats.
      </p>

      {/* ── Suggestion IA (lecture seule) ────────────────────────────────────── */}
      {entry && (
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-3">
          <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Suggestion IA</p>
          <p className="text-sm text-gray-300">
            {entry.dishName ?? entry.dishSlug}
            {' '}
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              entry.confidence >= 0.8 ? 'bg-green-900 text-green-300'
                : entry.confidence >= 0.5 ? 'bg-yellow-900 text-yellow-300'
                : 'bg-red-900 text-red-300'
            }`}>
              {Math.round(entry.confidence * 100)}%
            </span>
          </p>
          {entry.reasoning && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.reasoning}</p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Plat
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4 rounded-lg border border-gray-800 p-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Plat</h2>

        {/* Dropdown */}
        <div>
          <label htmlFor="dish-select" className="block text-xs text-gray-400 mb-1 font-medium">
            Sélectionner le plat
          </label>
          <select
            id="dish-select"
            value={dishSlug}
            onChange={(e) => handleDishChange(e.target.value)}
            className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {groups.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                    {item.vege ? ' 🌱' : ''}
                    {item.signature ? ' ★' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Editable fields — hidden for ambiance */}
        {!isAmbiance && (
          <>
            <div>
              <label htmlFor="dish-name" className="block text-xs text-gray-400 mb-1 font-medium">
                Nom affiché sur l&apos;image
              </label>
              <input
                id="dish-name"
                type="text"
                value={dishName}
                onChange={(e) => { setDishName(e.target.value); setIsDirty(true); }}
                className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="dish-price" className="block text-xs text-gray-400 mb-1 font-medium">
                  Prix (€)
                </label>
                <input
                  id="dish-price"
                  type="number"
                  step="0.10"
                  value={price ?? ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setPrice(isNaN(v) ? null : v);
                    setIsDirty(true);
                  }}
                  className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="dish-baseline" className="block text-xs text-gray-400 mb-1 font-medium">
                  Baseline
                </label>
                <input
                  id="dish-baseline"
                  type="text"
                  value={baseline}
                  onChange={(e) => { setBaseline(e.target.value); setIsDirty(true); }}
                  className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Badge info */}
            {currentItem?.vege && (
              <p className="text-xs text-green-400">🌱 Option végétarienne (tofu teriyaki)</p>
            )}
            {currentItem?.signature && (
              <p className="text-xs text-yellow-400">★ Spécialité signature Umaï</p>
            )}
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Affichage sur l'image
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Affichage sur l&apos;image</h2>
          <p className="text-xs text-gray-500 mt-1">
            Choisissez ce qui sera dessiné directement sur la photo publiée.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            overlayMode === 'packshot'
              ? 'border-indigo-500 bg-indigo-950'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          } ${isAmbiance ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="overlay-mode"
              value="packshot"
              checked={overlayMode === 'packshot'}
              disabled={isAmbiance}
              onChange={() => { if (!isAmbiance) { setOverlayMode('packshot'); setIsDirty(true); } }}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-200">Packshot — logo Umaï + nom du plat sur l&apos;image</p>
              <p className="text-xs text-gray-500 mt-0.5">Le logo et le nom du plat sont incrustés dans la photo finale.</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            overlayMode === 'photo-only'
              ? 'border-indigo-500 bg-indigo-950'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }`}>
            <input
              type="radio"
              name="overlay-mode"
              value="photo-only"
              checked={overlayMode === 'photo-only'}
              onChange={() => { setOverlayMode('photo-only'); setIsDirty(true); }}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-200">Photo seule — aucun texte sur l&apos;image</p>
              <p className="text-xs text-gray-500 mt-0.5">La photo est publiée telle quelle, sans aucune incrustation.</p>
              {overlayMode === 'photo-only' && (
                <p className="text-xs text-indigo-400 mt-1 font-medium">
                  Le texte ira uniquement dans la légende.
                </p>
              )}
            </div>
          </label>
        </div>

        {isAmbiance && (
          <p className="text-xs text-gray-500">
            Photo d&apos;ambiance — mode &quot;Photo seule&quot; activé automatiquement.
          </p>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Légende (caption)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Légende Instagram</h2>
          <p className="text-xs text-gray-500 mt-1">
            Texte publié sous la photo. Générez via IA ou saisissez librement.
          </p>
        </div>

        <textarea
          id="caption-area"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Légende Instagram (FR)…"
        />
        {captionError && (
          <p className="text-xs text-red-400">{captionError}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isCapGen}
            onClick={handleGenerateCaption}
            className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors ${isCapGen ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {isCapGen ? 'Génération en cours…' : 'Générer la légende (IA)'}
          </button>

          <button
            type="button"
            disabled={isCapSaving}
            onClick={handleSaveCaption}
            className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              captionSaveStatus === 'saved'
                ? 'bg-green-700 text-white'
                : captionSaveStatus === 'error'
                ? 'bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            } ${isCapSaving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {isCapSaving
              ? 'Enregistrement…'
              : captionSaveStatus === 'saved'
              ? '✓ Légende enregistrée'
              : captionSaveStatus === 'error'
              ? '✗ Erreur'
              : 'Enregistrer la légende'}
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Aperçu
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Aperçu</h2>
          <p className="text-xs text-gray-500 mt-1">
            Visualisez le rendu final pour chaque format Meta.
          </p>
        </div>

        {/* FIX-3: Format toggle */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(FORMAT_LABELS) as PreviewFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setPreviewFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                previewFormat === fmt
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {FORMAT_LABELS[fmt]}
            </button>
          ))}
        </div>

        {/* Source photo + preview side by side on wider screens */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 rounded-lg overflow-hidden bg-gray-900">
            <p className="text-xs text-gray-500 px-3 py-2 font-mono">Source originale</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/ig-studio/photo/${id}`}
              alt={`Photo source ${id}`}
              className="w-full object-contain max-h-72"
            />
          </div>

          <div className="flex-1 rounded-lg overflow-hidden bg-gray-900">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs text-gray-500 font-mono">{FORMAT_LABELS[previewFormat]}</p>
              {previewLoading && (
                <span className="text-xs text-yellow-400 animate-pulse">Rendu en cours…</span>
              )}
            </div>
            {previewError && (
              <p className="text-xs text-red-400 px-3 pb-2">{previewError}</p>
            )}
            {previewUrl && !previewError && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Aperçu avec overlay"
                className="w-full object-contain"
              />
            )}
            {!previewUrl && !previewLoading && !previewError && (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                Chargement…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — Actions
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Actions</h2>
          <p className="text-xs text-gray-500 mt-1">
            Enregistrez les réglages du plat, puis régénérez les 3 formats pour exporter.
          </p>
        </div>

        {/* Save status badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isDirty
              ? 'bg-yellow-900 text-yellow-300'
              : saveStatus === 'saved'
              ? 'bg-green-900 text-green-300'
              : 'bg-gray-800 text-gray-400'
          }`}>
            {isDirty
              ? 'Modifié • non enregistré'
              : saveStatus === 'saved'
              ? 'Enregistré ✓'
              : 'Aucune modification'}
          </span>
        </div>

        {isDirty && (
          <p className="text-xs text-yellow-400">
            Des modifications sont en attente. Enregistrez avant de régénérer.
          </p>
        )}

        {/* Save button */}
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className={`w-full min-h-[44px] rounded-lg font-semibold text-sm transition-colors ${
            saveStatus === 'saved'
              ? 'bg-green-700 text-white'
              : saveStatus === 'error'
              ? 'bg-red-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          } ${isSaving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
        >
          {isSaving
            ? 'Enregistrement…'
            : saveStatus === 'saved'
            ? '✓ Réglages enregistrés'
            : saveStatus === 'error'
            ? '✗ Erreur — réessayez'
            : 'Enregistrer'}
        </button>

        {/* Regenerate */}
        <button
          type="button"
          disabled={isRegen || isDirty}
          onClick={handleRegenerate}
          title={isDirty ? 'Enregistrez d\'abord vos modifications' : ''}
          className={`w-full min-h-[44px] rounded-lg text-sm font-semibold transition-colors ${
            regenStatus === 'success'
              ? 'bg-green-700 text-white'
              : regenStatus === 'error'
              ? 'bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          } ${(isRegen || isDirty) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isRegen
            ? 'Génération en cours…'
            : regenStatus === 'success'
            ? '✓ 3 formats générés'
            : regenStatus === 'error'
            ? '✗ Erreur'
            : 'Régénérer les 3 formats'}
        </button>
        {regenMsg && (
          <p className={`text-xs ${regenStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {regenMsg}
          </p>
        )}

        {/* Back to gallery */}
        <a
          href="/ig-studio"
          className="block text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
        >
          ← Retour à la galerie
        </a>
      </section>
    </div>
  );
}
