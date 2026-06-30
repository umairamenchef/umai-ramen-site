'use client';

/**
 * Per-photo editor client component.
 * Sections: Plat | Affichage | Aperçu (avec drag logo) | Légende | Actions
 *
 * v4 (quality pass):
 *  - One "Enregistrer" saves BOTH réglages + légende (caption can no longer be lost)
 *  - "Logo + nom" works on ambiance photos too (name editable in that mode)
 *  - Live preview: out-of-order guard (AbortController) + last-good image kept on error
 *  - Suivant / Précédent navigation for the 81-photo batch ("Enregistrer & suivant")
 *  - Plain-language labels, readable contrast, larger tap targets
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

interface PhotoEditorProps {
  id: string;
  entry: IgEntry | null;
  caption: string;
  groups: MenuGroup[];
  /** Adjacent photo ids for batch navigation (null at the ends). */
  prevId?: string | null;
  nextId?: string | null;
}

type PreviewFormat = 'feed' | 'square' | 'story';
type OverlayMode  = 'photo-only' | 'logo-only' | 'logo-name';
type LogoSize     = 'small' | 'medium' | 'large';
type LogoColor    = 'auto' | 'light' | 'dark';

const FORMAT_LABELS: Record<PreviewFormat, string> = {
  feed:   'Publication',
  square: 'Carré',
  story:  'Story',
};

const FORMAT_DIMS: Record<PreviewFormat, string> = {
  feed:   '1080×1350',
  square: '1080×1080',
  story:  '1080×1920',
};

const SIZE_LABELS: Record<LogoSize, string> = {
  small:  'Petit',
  medium: 'Moyen',
  large:  'Grand',
};

/** Ghost-box footprint per logo size, so the drag handle matches the real logo. */
const SIZE_GHOST: Record<LogoSize, { w: number; h: number }> = {
  small:  { w: 20, h: 6 },
  medium: { w: 26, h: 8 },
  large:  { w: 34, h: 11 },
};

const COLOR_LABELS: Record<LogoColor, string> = {
  auto:  'Auto',
  light: 'Clair',
  dark:  'Foncé',
};

const COLOR_DESC: Record<LogoColor, string> = {
  auto:  'Sélection automatique selon le fond',
  light: 'Forcer ivoire (fond sombre)',
  dark:  'Forcer charbon (fond clair)',
};

// ─── 9-preset grid ────────────────────────────────────────────────────────────

const PRESET_GRID = [
  [
    { label: 'HG',  longLabel: 'Haut gauche',    x: 0.12, y: 0.12 },
    { label: 'HC',  longLabel: 'Haut centre',    x: 0.50, y: 0.12 },
    { label: 'HD',  longLabel: 'Haut droite',    x: 0.88, y: 0.12 },
  ],
  [
    { label: 'CG',  longLabel: 'Centre gauche',  x: 0.12, y: 0.50 },
    { label: 'C',   longLabel: 'Centre',          x: 0.50, y: 0.50 },
    { label: 'CD',  longLabel: 'Centre droite',  x: 0.88, y: 0.50 },
  ],
  [
    { label: 'BG',  longLabel: 'Bas gauche',     x: 0.12, y: 0.88 },
    { label: 'BC',  longLabel: 'Bas centre',     x: 0.50, y: 0.88 },
    { label: 'BD',  longLabel: 'Bas droite',     x: 0.88, y: 0.88 },
  ],
] as const;

const PRESET_TOL = 0.05;

// ─── Backward compat: legacy logoPosition enum → {x, y} ──────────────────────

function legacyEnumToXY(pos: string | undefined): { x: number; y: number } {
  switch (pos) {
    case 'top-left':     return { x: 0.12, y: 0.12 };
    case 'top-right':    return { x: 0.88, y: 0.12 };
    case 'bottom-left':  return { x: 0.12, y: 0.88 };
    case 'bottom-right': return { x: 0.88, y: 0.88 };
    default:             return { x: 0.88, y: 0.12 }; // top-right default
  }
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

/** Normalize a stored overlayMode value to the 3-mode union. */
function normalizeMode(raw: string | undefined | null, isAmbiance: boolean): OverlayMode {
  if (raw === 'photo-only') return 'photo-only';
  if (raw === 'logo-name' || raw === 'packshot') return 'logo-name';
  if (raw === 'logo-only') return 'logo-only';
  return isAmbiance ? 'photo-only' : 'logo-only';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PhotoEditor({ id, entry, caption: initialCaption, groups, prevId, nextId }: PhotoEditorProps) {
  const slugMap = buildSlugMap(groups);

  // Derived initial slug / item
  const initialSlug = entry?.dishSlug ?? 'ambiance';
  const initialItem = slugMap.get(initialSlug);
  const initialIsAmbiance =
    initialSlug === 'ambiance' || initialItem?.overlay === 'none';

  // ── State ─────────────────────────────────────────────────────────────────

  const [dishSlug, setDishSlug] = useState(initialSlug);
  const [dishName, setDishName] = useState(
    initialIsAmbiance
      ? (entry?.dishName ?? '')
      : (entry?.dishName ?? initialItem?.name ?? initialSlug),
  );
  const [price, setPrice]       = useState<number | null>(entry?.price ?? null);
  const [baseline, setBaseline] = useState(entry?.baseline ?? '');

  // Overlay mode — 3 explicit options
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(
    normalizeMode(entry?.overlayMode, initialIsAmbiance),
  );

  // Logo position — normalized {x, y} center in [0,1]
  const initPos = Number.isFinite(entry?.logoPosX) && Number.isFinite(entry?.logoPosY)
    ? { x: entry!.logoPosX as number, y: entry!.logoPosY as number }
    : legacyEnumToXY(entry?.logoPosition);
  const [logoPosX, setLogoPosX] = useState<number>(initPos.x);
  const [logoPosY, setLogoPosY] = useState<number>(initPos.y);

  // Logo size
  const [logoSize, setLogoSize] = useState<LogoSize>(
    (entry?.logoSize as LogoSize | undefined) ?? 'medium',
  );
  const [showPrice, setShowPrice] = useState<boolean>(entry?.showPrice ?? false);

  // Logo color variant ('auto' = luminance-based; 'light' = ivoire; 'dark' = charcoal)
  const [logoColor, setLogoColor] = useState<LogoColor>(
    (entry?.logoColor as LogoColor | undefined) ?? 'auto',
  );

  // Caption
  const [caption, setCaption] = useState(initialCaption);
  const [captionDirty, setCaptionDirty] = useState(false);

  // Format toggle for preview
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('feed');

  // UI state
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saved' | 'error'>('idle');
  const [regenStatus, setRegenStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [regenMsg, setRegenMsg]       = useState('');
  const [captionError, setCaptionError] = useState('');

  const [isSaving, startSave]   = useTransition();
  const [isCapGen, startCapGen] = useTransition();
  const [isRegen, startRegen]   = useTransition();

  // Live preview state
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevObjectUrl = useRef<string | null>(null);
  const reqIdRef      = useRef(0);
  const abortRef      = useRef<AbortController | null>(null);

  // Réglages dirty (caption tracked separately, combined below)
  const [settingsDirty, setSettingsDirty] = useState(false);
  const isDirty = settingsDirty || captionDirty;

  // Drag refs
  const previewImgRef = useRef<HTMLImageElement>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isAmbiance  = dishSlug === 'ambiance' || slugMap.get(dishSlug)?.overlay === 'none';
  const currentItem = slugMap.get(dishSlug);
  const showLogoControls = overlayMode !== 'photo-only';
  const showNameControls = overlayMode === 'logo-name';
  const showNameInput    = showNameControls || !isAmbiance;

  // ─── Preset active check ──────────────────────────────────────────────────

  function isPresetActive(px: number, py: number): boolean {
    return Math.abs(logoPosX - px) < PRESET_TOL && Math.abs(logoPosY - py) < PRESET_TOL;
  }

  // ─── Dish selection ────────────────────────────────────────────────────────

  function handleDishChange(slug: string) {
    const item = slugMap.get(slug);
    const isAmb = slug === 'ambiance' || item?.overlay === 'none';
    setDishSlug(slug);
    setDishName(isAmb ? '' : (item?.name ?? slug));
    setPrice(item?.price ?? null);
    setBaseline(item?.baseline ?? '');
    setShowPrice(false); // price flag must not leak across dishes
    if (isAmb) {
      setOverlayMode('photo-only');
    } else if (overlayMode === 'photo-only') {
      setOverlayMode('logo-only');
    }
    setSettingsDirty(true);
  }

  // ─── Live preview (debounced 400 ms, out-of-order-safe) ────────────────────

  const triggerPreview = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      // Cancel any in-flight request so a stale response can't overwrite a newer one
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const myReq = ++reqIdRef.current;

      setPreviewLoading(true);
      try {
        const res = await fetch('/api/ig-studio/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ac.signal,
          body: JSON.stringify({
            id,
            format: previewFormat,
            entry: {
              file: id + '.jpg',
              dishSlug,
              dishName,
              price,
              baseline,
              overlayMode,
              logoPosX,
              logoPosY,
              logoSize,
              showPrice,
              logoColor,
              shotType: entry?.shotType ?? 'packshot',
              confidence: entry?.confidence ?? 0,
            },
          }),
        });

        if (myReq !== reqIdRef.current) return; // a newer request superseded this one

        if (!res.ok) {
          setPreviewError('Aperçu momentanément indisponible — réessayez.');
          return;
        }

        const blob = await res.blob();
        if (myReq !== reqIdRef.current) return;
        if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
        const url = URL.createObjectURL(blob);
        prevObjectUrl.current = url;
        setPreviewUrl(url);
        setPreviewError(''); // success clears any prior error, keeps last-good otherwise
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return; // expected on supersede
        if (myReq === reqIdRef.current) {
          setPreviewError('Aperçu momentanément indisponible — réessayez.');
        }
      } finally {
        if (myReq === reqIdRef.current) setPreviewLoading(false);
      }
    }, 400);
  }, [id, dishSlug, dishName, price, baseline, overlayMode, logoPosX, logoPosY, logoSize, showPrice, logoColor, previewFormat, entry?.shotType, entry?.confidence]);

  useEffect(() => {
    triggerPreview();
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [triggerPreview]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
    };
  }, []);

  // ─── Logo drag handlers ────────────────────────────────────────────────────

  function handleDragPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDragPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const img = previewImgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setLogoPosX(x);
    setLogoPosY(y);
    setSettingsDirty(true);
  }

  function handleDragPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  // ─── Save (réglages + légende en une fois) ─────────────────────────────────

  /** Returns true on full success. */
  async function persistAll(): Promise<boolean> {
    const fields: OverrideFields = {
      dishSlug, dishName, price, baseline, overlayMode,
      logoPosX, logoPosY, logoSize, showPrice, logoColor,
    };
    const res = await saveOverride(id, fields);
    let ok = res.ok;
    if (captionDirty) {
      const capRes = await saveCaption(id, caption);
      ok = ok && capRes.ok;
    }
    return ok;
  }

  function handleSave() {
    startSave(async () => {
      const ok = await persistAll();
      if (ok) {
        setSaveStatus('saved');
        setSettingsDirty(false);
        setCaptionDirty(false);
        setRegenStatus('idle');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    });
  }

  function handleSaveAndNext() {
    if (!nextId) return;
    startSave(async () => {
      const ok = await persistAll();
      if (ok) {
        window.location.href = `/ig-studio/${nextId}`;
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    });
  }

  // ─── Generate caption ──────────────────────────────────────────────────────

  function handleGenerateCaption() {
    setCaptionError('');
    startCapGen(async () => {
      const res = await generateCaptionAction(id, {
        dishSlug, dishName, price, baseline, overlayMode,
      });
      if (res.ok && res.caption) {
        setCaption(res.caption);
        setCaptionDirty(true);
      } else {
        setCaptionError(res.error ?? 'Erreur lors de la génération');
      }
    });
  }

  // ─── Regenerate ────────────────────────────────────────────────────────────

  function handleRegenerate() {
    setRegenMsg('');
    startRegen(async () => {
      const res = await regeneratePhoto(id);
      if (res.ok) {
        setRegenStatus('success');
        setRegenMsg('Les 3 formats ont été générés.');
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

  const ghost = SIZE_GHOST[logoSize];

  return (
    <div className="flex flex-col gap-6 p-4 pb-28 max-w-3xl mx-auto">

      {/* ── Fil conducteur ────────────────────────────────────────────────── */}
      <ol className="text-xs text-gray-300 leading-relaxed border border-gray-800 rounded-lg px-4 py-3 grid gap-1 sm:grid-cols-2">
        <li><span className="text-gray-500">1.</span> Choisir le plat</li>
        <li><span className="text-gray-500">2.</span> Régler l&apos;affichage (logo / nom)</li>
        <li><span className="text-gray-500">3.</span> Positionner le logo (glisser ou preset)</li>
        <li><span className="text-gray-500">4.</span> Générer / éditer la légende</li>
        <li><span className="text-gray-500">5.</span> Enregistrer</li>
        <li><span className="text-gray-500">6.</span> Régénérer les 3 formats</li>
      </ol>

      {/* ── Suggestion IA (lecture seule) ─────────────────────────────────── */}
      {entry && (
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-3">
          <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Suggestion IA</p>
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
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{entry.reasoning}</p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Plat
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4 rounded-lg border border-gray-800 p-4">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Plat</h2>

        {/* Dropdown */}
        <div>
          <label htmlFor="dish-select" className="block text-xs text-gray-300 mb-1 font-medium">
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

        {/* Name input — shown for any dish, and for ambiance when "logo + nom" is on */}
        {showNameInput && (
          <div>
            <label htmlFor="dish-name" className="block text-xs text-gray-300 mb-1 font-medium">
              Nom affiché sur l&apos;image
            </label>
            <input
              id="dish-name"
              type="text"
              value={dishName}
              placeholder={isAmbiance ? 'Ex. Tantan Umaï' : ''}
              onChange={(e) => { setDishName(e.target.value); setSettingsDirty(true); }}
              className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isAmbiance && (
              <p className="text-xs text-gray-400 mt-1">
                Photo d&apos;ambiance — saisissez un nom pour l&apos;incruster (mode « Logo + nom »).
              </p>
            )}
          </div>
        )}

        {/* Price / baseline — only for real dishes */}
        {!isAmbiance && (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="dish-price" className="block text-xs text-gray-300 mb-1 font-medium">
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
                    setSettingsDirty(true);
                  }}
                  className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="dish-baseline" className="block text-xs text-gray-300 mb-1 font-medium">
                  Accroche
                </label>
                <input
                  id="dish-baseline"
                  type="text"
                  value={baseline}
                  onChange={(e) => { setBaseline(e.target.value); setSettingsDirty(true); }}
                  className="w-full min-h-[44px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {currentItem?.vege && (
              <p className="text-xs text-green-400">🌱 Option végétarienne</p>
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
      <section className="flex flex-col gap-4 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Affichage sur l&apos;image</h2>
          <p className="text-xs text-gray-400 mt-1">
            Choisissez ce qui sera incrusté directement sur la photo publiée.
          </p>
        </div>

        {/* ── 3-mode radio ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">

          {/* Photo seule */}
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
              onChange={() => { setOverlayMode('photo-only'); setSettingsDirty(true); }}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="text-sm font-medium text-gray-100">Photo seule</p>
              <p className="text-xs text-gray-400 mt-0.5">Rien de dessiné — photo brute publiée telle quelle.</p>
            </div>
          </label>

          {/* Logo seul */}
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            overlayMode === 'logo-only'
              ? 'border-indigo-500 bg-indigo-950'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }`}>
            <input
              type="radio"
              name="overlay-mode"
              value="logo-only"
              checked={overlayMode === 'logo-only'}
              onChange={() => { setOverlayMode('logo-only'); setSettingsDirty(true); }}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="text-sm font-medium text-gray-100">Logo seul</p>
              <p className="text-xs text-gray-400 mt-0.5">Uniquement le logo Umaï, positionné librement. Défaut recommandé.</p>
            </div>
          </label>

          {/* Logo + nom */}
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            overlayMode === 'logo-name'
              ? 'border-indigo-500 bg-indigo-950'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }`}>
            <input
              type="radio"
              name="overlay-mode"
              value="logo-name"
              checked={overlayMode === 'logo-name'}
              onChange={() => { setOverlayMode('logo-name'); setSettingsDirty(true); }}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="text-sm font-medium text-gray-100">Logo + nom du plat</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Logo + nom en texte élégant (ivoire, ombre subtile).
                {isAmbiance ? ' Saisissez le nom dans le champ ci-dessus.' : ' Prix optionnel ci-dessous.'}
              </p>
            </div>
          </label>
        </div>

        {/* ── Logo controls (shown when mode != photo-only) ─────────────────── */}
        {showLogoControls && (
          <div className="flex flex-col gap-4 pt-1 border-t border-gray-800">

            {/* Size buttons */}
            <div>
              <p className="text-xs text-gray-300 font-medium mb-2">Taille du logo</p>
              <div className="flex gap-2">
                {(Object.keys(SIZE_LABELS) as LogoSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => { setLogoSize(sz); setSettingsDirty(true); }}
                    className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                      logoSize === sz
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    {SIZE_LABELS[sz]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Petit = discret, Grand = bien visible.</p>
            </div>

            {/* Logo color variant */}
            <div>
              <p className="text-xs text-gray-300 font-medium mb-2">Couleur du logo</p>
              <div className="flex gap-2">
                {(Object.keys(COLOR_LABELS) as LogoColor[]).map((col) => (
                  <button
                    key={col}
                    type="button"
                    title={COLOR_DESC[col]}
                    onClick={() => { setLogoColor(col); setSettingsDirty(true); }}
                    className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                      logoColor === col
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    {COLOR_LABELS[col]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{COLOR_DESC[logoColor]}</p>
            </div>

            {/* 9-preset position grid */}
            <div>
              <p className="text-xs text-gray-300 font-medium mb-2">Position rapide du logo</p>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_GRID.map((row, ri) =>
                  row.map((preset, ci) => (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      title={preset.longLabel}
                      onClick={() => {
                        setLogoPosX(preset.x);
                        setLogoPosY(preset.y);
                        setSettingsDirty(true);
                      }}
                      className={`min-h-[44px] rounded-lg text-xs font-medium transition-colors ${
                        isPresetActive(preset.x, preset.y)
                          ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
                          : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ou glissez le logo directement dans l&apos;aperçu ci-dessous.
              </p>
            </div>

            {/* showPrice checkbox (logo-name only, real dish only) */}
            {showNameControls && !isAmbiance && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => { setShowPrice(e.target.checked); setSettingsDirty(true); }}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800"
                  />
                  <div>
                    <p className="text-sm text-gray-100 font-medium">Afficher le prix sur l&apos;image</p>
                    <p className="text-xs text-gray-400">Désactivé par défaut — le prix va dans la légende.</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Aperçu (avec drag logo)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Aperçu</h2>
          <p className="text-xs text-gray-400 mt-1">
            Aperçu indicatif. Les fichiers finaux exportables sont créés par « Régénérer ».
            {showLogoControls && ' Glissez le cadre pour repositionner le logo.'}
          </p>
        </div>

        {/* Format toggle */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(FORMAT_LABELS) as PreviewFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setPreviewFormat(fmt)}
              className={`min-h-[44px] px-4 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-center leading-tight ${
                previewFormat === fmt
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              <span>{FORMAT_LABELS[fmt]}</span>
              <span className="text-[10px] opacity-60">{FORMAT_DIMS[fmt]}</span>
            </button>
          ))}
        </div>

        {/* Source photo + preview side by side */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 rounded-lg overflow-hidden bg-gray-900">
            <p className="text-xs text-gray-400 px-3 py-2">Source originale</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/ig-studio/photo/${id}`}
              alt={`Photo source ${id}`}
              className="w-full object-contain max-h-72"
            />
          </div>

          <div className="flex-1 rounded-lg overflow-hidden bg-gray-900 min-h-[16rem] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs text-gray-400">{FORMAT_LABELS[previewFormat]} · {FORMAT_DIMS[previewFormat]}</p>
              {previewLoading && (
                <span className="text-xs text-yellow-400 animate-pulse">Rendu en cours…</span>
              )}
            </div>

            {previewUrl ? (
              /* Drag container — relative so the ghost box can be absolute-positioned */
              <div className="relative select-none">
                {previewError && (
                  <p className="absolute top-1 left-1 right-1 z-20 text-center text-xs text-red-200 bg-red-900/80 rounded px-2 py-1">
                    {previewError}
                  </p>
                )}
                {/* Ghost drag handle (shown when logo controls visible) */}
                {showLogoControls && (
                  <div
                    title="Glissez le logo pour le positionner"
                    className="absolute z-10 border-2 border-dashed border-white/80 bg-white/10 hover:bg-white/20 rounded cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
                    style={{
                      left:      `${logoPosX * 100}%`,
                      top:       `${logoPosY * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width:     `${ghost.w}%`,
                      height:    `${ghost.h}%`,
                      minWidth:  '64px',
                      minHeight: '44px',
                    }}
                    onPointerDown={handleDragPointerDown}
                    onPointerMove={handleDragPointerMove}
                    onPointerUp={handleDragPointerUp}
                  >
                    <span className="text-white/70 text-xs font-medium select-none pointer-events-none">⠿ logo</span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={previewImgRef}
                  src={previewUrl}
                  alt="Aperçu avec overlay"
                  className="w-full object-contain pointer-events-none max-h-[60vh]"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-6">
                {previewError
                  ? previewError
                  : 'Préparation de l’aperçu…'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Légende (caption)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Légende Instagram</h2>
            <p className="text-xs text-gray-400 mt-1">
              Texte publié sous la photo. Générez via IA ou saisissez librement.
            </p>
          </div>
          {captionDirty && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300 shrink-0">
              Non enregistrée
            </span>
          )}
        </div>

        <textarea
          id="caption-area"
          value={caption}
          onChange={(e) => { setCaption(e.target.value); setCaptionDirty(true); }}
          rows={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Légende Instagram (FR)…"
        />
        {captionError && (
          <p className="text-xs text-red-400">{captionError}</p>
        )}

        <button
          type="button"
          disabled={isCapGen}
          onClick={handleGenerateCaption}
          className={`min-h-[44px] rounded-lg text-sm font-medium bg-indigo-700 hover:bg-indigo-600 text-white transition-colors ${isCapGen ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
        >
          {isCapGen ? 'Génération en cours…' : '✨ Générer la légende (IA)'}
        </button>
        <p className="text-xs text-gray-400">
          La légende est enregistrée avec le bouton « Enregistrer » plus bas.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — Actions
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Actions</h2>
          <p className="text-xs text-gray-400 mt-1">
            Enregistrez (réglages + légende), puis régénérez les 3 formats pour exporter.
          </p>
        </div>

        {/* Save status badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isDirty
              ? 'bg-yellow-900 text-yellow-300'
              : saveStatus === 'saved'
              ? 'bg-green-900 text-green-300'
              : 'bg-gray-800 text-gray-300'
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
            !isDirty && saveStatus === 'saved'
              ? 'bg-green-700 text-white'
              : saveStatus === 'error'
              ? 'bg-red-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          } ${isSaving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
        >
          {isSaving
            ? 'Enregistrement…'
            : !isDirty && saveStatus === 'saved'
            ? '✓ Enregistré'
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          Sticky batch navigation
          ══════════════════════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/80">
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-4 py-2">
          {prevId ? (
            <a
              href={`/ig-studio/${prevId}`}
              className="min-h-[44px] px-3 flex items-center rounded-lg text-sm text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              ← Préc.
            </a>
          ) : (
            <span className="min-h-[44px] px-3 flex items-center rounded-lg text-sm text-gray-600 bg-gray-900">← Préc.</span>
          )}

          <a
            href="/ig-studio"
            className="min-h-[44px] px-3 flex items-center rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
          >
            Galerie
          </a>

          <div className="flex-1" />

          {nextId ? (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAndNext}
                className={`min-h-[44px] px-3 flex items-center rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors ${isSaving ? 'opacity-60 cursor-wait' : ''}`}
                title="Enregistre puis passe à la photo suivante"
              >
                {isSaving ? '…' : 'Enregistrer & suivant'}
              </button>
              <a
                href={`/ig-studio/${nextId}`}
                className="min-h-[44px] px-3 flex items-center rounded-lg text-sm text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Suiv. →
              </a>
            </>
          ) : (
            <span className="min-h-[44px] px-3 flex items-center rounded-lg text-sm text-gray-600 bg-gray-900">Suiv. →</span>
          )}
        </div>
      </nav>
    </div>
  );
}
