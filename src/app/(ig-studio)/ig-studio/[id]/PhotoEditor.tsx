'use client';

/**
 * Per-photo editor client component.
 * Dish dropdown (grouped, autofill), overlay toggle, caption gen/edit/save,
 * debounced live preview, Save (override), Regenerate (3 formats).
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

  // Seed state from server-loaded entry (or defaults)
  const [dishSlug, setDishSlug] = useState(entry?.dishSlug ?? 'ambiance');
  const [dishName, setDishName] = useState(entry?.dishName ?? slugMap.get(entry?.dishSlug ?? 'ambiance')?.name ?? 'Ambiance (photo-only)');
  const [price, setPrice] = useState<number | null>(entry?.price ?? null);
  const [baseline, setBaseline] = useState(entry?.baseline ?? '');
  const [overlayMode, setOverlayMode] = useState(entry?.overlayMode ?? 'packshot');
  const [caption, setCaption] = useState(initialCaption);

  // UI state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [captionSaveStatus, setCaptionSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [regenStatus, setRegenStatus] = useState<'idle' | 'success' | 'error' | 'dirty'>('idle');
  const [regenMsg, setRegenMsg] = useState('');
  const [captionError, setCaptionError] = useState('');

  const [isSaving, startSave] = useTransition();
  const [isCapSaving, startCapSave] = useTransition();
  const [isCapGen, startCapGen] = useTransition();
  const [isRegen, startRegen] = useTransition();

  // Live preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevObjectUrl = useRef<string | null>(null);

  // Track dirty state (unsaved changes vs what's in classification.json)
  const [isDirty, setIsDirty] = useState(false);

  // ─── Dish selection autofill ───────────────────────────────────────────────

  function handleDishChange(slug: string) {
    const item = slugMap.get(slug);
    setDishSlug(slug);
    setDishName(item?.name ?? slug);
    setPrice(item?.price ?? null);
    setBaseline(item?.baseline ?? '');
    // Ambiance forces photo-only overlay
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
          setPreviewError('Preview failed: ' + text.slice(0, 100));
          return;
        }

        const blob = await res.blob();
        // Revoke previous object URL to avoid leaks
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
  }, [id, dishSlug, dishName, price, baseline, overlayMode, entry?.shotType, entry?.confidence]);

  // Trigger preview on mount and on relevant field changes
  useEffect(() => {
    triggerPreview();
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [triggerPreview]);

  // Cleanup object URL on unmount
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

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isAmbiance = dishSlug === 'ambiance' || slugMap.get(dishSlug)?.overlay === 'none';
  const currentItem = slugMap.get(dishSlug);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto">

      {/* ── LEFT: Photo + Live Preview ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4">

        {/* Source photo */}
        <div className="rounded-lg overflow-hidden bg-gray-900">
          <p className="text-xs text-gray-500 px-3 py-2 font-mono">Source</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/ig-studio/photo/${id}`}
            alt={`Photo ${id}`}
            className="w-full object-contain max-h-96"
          />
        </div>

        {/* Live preview */}
        <div className="rounded-lg overflow-hidden bg-gray-900">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-xs text-gray-500 font-mono">Preview (feed 1080×1350)</p>
            {previewLoading && (
              <span className="text-xs text-yellow-400 animate-pulse">Rendu...</span>
            )}
          </div>
          {previewError && (
            <p className="text-xs text-red-400 px-3 pb-2">{previewError}</p>
          )}
          {previewUrl && !previewError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Live preview"
              className="w-full object-contain"
            />
          )}
          {!previewUrl && !previewLoading && !previewError && (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              Preview...
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Controls ───────────────────────────────────────────────── */}
      <div className="w-full lg:w-96 flex flex-col gap-5">

        {/* AI suggestion (read-only hint) */}
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

        {/* Dish dropdown */}
        <div>
          <label htmlFor="dish-select" className="block text-xs text-gray-400 mb-1 font-semibold">
            Plat
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

        {/* Editable fields */}
        {!isAmbiance && (
          <>
            <div>
              <label htmlFor="dish-name" className="block text-xs text-gray-400 mb-1 font-semibold">
                Nom du plat
              </label>
              <input
                id="dish-name"
                type="text"
                value={dishName}
                onChange={(e) => { setDishName(e.target.value); setIsDirty(true); }}
                className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="dish-price" className="block text-xs text-gray-400 mb-1 font-semibold">
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

            <div>
              <label htmlFor="dish-baseline" className="block text-xs text-gray-400 mb-1 font-semibold">
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
          </>
        )}

        {/* Overlay mode toggle */}
        <div>
          <p className="text-xs text-gray-400 mb-2 font-semibold">Mode overlay</p>
          <div className="flex gap-2">
            {(['packshot', 'photo-only'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={isAmbiance}
                onClick={() => {
                  if (!isAmbiance) {
                    setOverlayMode(mode);
                    setIsDirty(true);
                  }
                }}
                className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  overlayMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                } ${isAmbiance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {mode === 'packshot' ? 'Packshot' : 'Photo-only'}
              </button>
            ))}
          </div>
          {isAmbiance && (
            <p className="text-xs text-gray-500 mt-1">Ambiance → overlay désactivé automatiquement</p>
          )}
        </div>

        {/* Save override */}
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
            ? 'Enregistrement...'
            : saveStatus === 'saved'
            ? '✓ Enregistré (override)'
            : saveStatus === 'error'
            ? '✗ Erreur'
            : 'Enregistrer le plat'}
        </button>

        {isDirty && regenStatus !== 'dirty' && (
          <p className="text-xs text-yellow-400 -mt-3">
            Modifications non enregistrées — sauvegardez avant de régénérer.
          </p>
        )}
        {isDirty && (
          <p className="text-xs text-yellow-400 -mt-3">
            Des modifications sont en attente. Enregistrez avant de régénérer.
          </p>
        )}

        {/* Divider */}
        <hr className="border-gray-800" />

        {/* Caption */}
        <div>
          <label htmlFor="caption-area" className="block text-xs text-gray-400 mb-1 font-semibold">
            Légende Instagram
          </label>
          <textarea
            id="caption-area"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Légende Instagram (FR)…"
          />
          {captionError && (
            <p className="text-xs text-red-400 mt-1">{captionError}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isCapGen}
            onClick={handleGenerateCaption}
            className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors ${isCapGen ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {isCapGen ? 'Génération...' : 'Générer caption (IA)'}
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
              ? 'Sauvegarde...'
              : captionSaveStatus === 'saved'
              ? '✓ Caption sauvée'
              : captionSaveStatus === 'error'
              ? '✗ Erreur'
              : 'Enregistrer caption'}
          </button>
        </div>

        {/* Divider */}
        <hr className="border-gray-800" />

        {/* Regenerate */}
        <div>
          {isDirty && (
            <p className="text-xs text-yellow-400 mb-2">
              ⚠ Enregistrez d&#39;abord — Régénérer lit classification.json.
            </p>
          )}
          <button
            type="button"
            disabled={isRegen}
            onClick={handleRegenerate}
            className={`w-full min-h-[44px] rounded-lg text-sm font-semibold transition-colors ${
              regenStatus === 'success'
                ? 'bg-green-700 text-white'
                : regenStatus === 'error'
                ? 'bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            } ${isRegen ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {isRegen
              ? 'Régénération...'
              : regenStatus === 'success'
              ? '✓ 3 formats générés'
              : regenStatus === 'error'
              ? '✗ Erreur'
              : 'Régénérer (3 formats)'}
          </button>
          {regenMsg && (
            <p className={`text-xs mt-1 ${regenStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {regenMsg}
            </p>
          )}
        </div>

        {/* Végé badge info */}
        {currentItem?.vege && (
          <p className="text-xs text-green-400">
            🌱 Option végétarienne (tofu teriyaki)
          </p>
        )}
        {currentItem?.signature && (
          <p className="text-xs text-yellow-400">
            ★ Spécialité signature Umaï
          </p>
        )}

      </div>
    </div>
  );
}
