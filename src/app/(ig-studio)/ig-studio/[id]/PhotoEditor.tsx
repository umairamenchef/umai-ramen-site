'use client';

/**
 * Per-photo editor client component.
 * Sections: Plat | Affichage | Aperçu (avec drag logo) | Légende | Actions
 *
 * v3 (drag-position rework):
 *  - 3 explicit overlay modes: photo-only / logo-only / logo-name
 *  - Logo position = normalized {x, y} in [0,1] (logo center as fraction of canvas)
 *  - 9 quick-position presets (3×3 grid: HG/HC/HD / CG/C/CD / BG/BC/BD)
 *  - Freely draggable logo handle on the live preview
 *  - Logo size (Petit/Moyen/Grand) control
 *  - "Afficher le prix" checkbox (logo-name only, OFF by default)
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
type OverlayMode  = 'photo-only' | 'logo-only' | 'logo-name';
type LogoSize     = 'small' | 'medium' | 'large';

const FORMAT_LABELS: Record<PreviewFormat, string> = {
  feed:   'Feed 1080×1350',
  square: 'Carré 1080×1080',
  story:  'Story 1080×1920',
};

const SIZE_LABELS: Record<LogoSize, string> = {
  small:  'Petit',
  medium: 'Moyen',
  large:  'Grand',
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

export function PhotoEditor({ id, entry, caption: initialCaption, groups, nap }: PhotoEditorProps) {
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
      ? ''
      : (entry?.dishName ?? initialItem?.name ?? initialSlug),
  );
  const [price, setPrice]       = useState<number | null>(entry?.price ?? null);
  const [baseline, setBaseline] = useState(entry?.baseline ?? '');

  // Overlay mode — 3 explicit options
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(
    normalizeMode(entry?.overlayMode, initialIsAmbiance),
  );

  // Logo position — normalized {x, y} center in [0,1]
  const initPos = typeof entry?.logoPosX === 'number' && typeof entry?.logoPosY === 'number'
    ? { x: entry.logoPosX, y: entry.logoPosY }
    : legacyEnumToXY(entry?.logoPosition);
  const [logoPosX, setLogoPosX] = useState<number>(initPos.x);
  const [logoPosY, setLogoPosY] = useState<number>(initPos.y);

  // Logo size
  const [logoSize, setLogoSize] = useState<LogoSize>(
    (entry?.logoSize as LogoSize | undefined) ?? 'medium',
  );
  const [showPrice, setShowPrice] = useState<boolean>(entry?.showPrice ?? false);

  // Caption
  const [caption, setCaption] = useState(initialCaption);

  // Format toggle for preview
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('feed');

  // UI state
  const [saveStatus, setSaveStatus]               = useState<'idle' | 'saved' | 'error'>('idle');
  const [captionSaveStatus, setCaptionSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [regenStatus, setRegenStatus]             = useState<'idle' | 'success' | 'error' | 'dirty'>('idle');
  const [regenMsg, setRegenMsg]                   = useState('');
  const [captionError, setCaptionError]           = useState('');

  const [isSaving, startSave]       = useTransition();
  const [isCapSaving, startCapSave] = useTransition();
  const [isCapGen, startCapGen]     = useTransition();
  const [isRegen, startRegen]       = useTransition();

  // Live preview state
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevObjectUrl = useRef<string | null>(null);

  // Dirty / unsaved state
  const [isDirty, setIsDirty] = useState(false);

  // Drag refs
  const previewImgRef = useRef<HTMLImageElement>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isAmbiance  = dishSlug === 'ambiance' || slugMap.get(dishSlug)?.overlay === 'none';
  const currentItem = slugMap.get(dishSlug);
  const showLogoControls = overlayMode !== 'photo-only';
  const showNameControls = overlayMode === 'logo-name' && !isAmbiance;

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
    if (isAmb) {
      setOverlayMode('photo-only');
    } else if (overlayMode === 'photo-only') {
      setOverlayMode('logo-only');
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
  }, [id, dishSlug, dishName, price, baseline, overlayMode, logoPosX, logoPosY, logoSize, showPrice, previewFormat, entry?.shotType, entry?.confidence]);

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
    setIsDirty(true);
  }

  function handleDragPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    // Preview auto-fires via triggerPreview debounce (logoPosX/Y changed)
  }

  // ─── Save override ─────────────────────────────────────────────────────────

  function handleSave() {
    startSave(async () => {
      const fields: OverrideFields = {
        dishSlug,
        dishName,
        price,
        baseline,
        overlayMode,
        logoPosX,
        logoPosY,
        logoSize,
        showPrice,
      };
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

  // ─── Regenerate ────────────────────────────────────────────────────────────

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

      {/* ── Fil conducteur ────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-500 leading-relaxed border border-gray-800 rounded-lg px-4 py-3">
        <span className="font-semibold text-gray-400">Comment utiliser :</span>{' '}
        1. Choisir le plat → 2. Régler l&apos;affichage → 3. Positionner le logo (glisser ou preset) → 4. Générer / éditer la légende → 5. Enregistrer → 6. Régénérer les 3 formats.
      </p>

      {/* ── Suggestion IA (lecture seule) ─────────────────────────────────── */}
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

            {currentItem?.vege && (
              <p className="text-xs text-green-400">🌱 Option végétarienne</p>
            )}
            {currentItem?.signature && (
              <p className="text-xs text-yellow-400">★ Spécialité signature Umaï</p>
            )}
          </>
        )}

        {isAmbiance && (
          <p className="text-xs text-gray-500 italic">
            Photo d&apos;ambiance — aucun texte ou nom ne sera incrusté sur l&apos;image.
          </p>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Affichage sur l'image
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Affichage sur l&apos;image</h2>
          <p className="text-xs text-gray-500 mt-1">
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
              onChange={() => { setOverlayMode('photo-only'); setIsDirty(true); }}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-200">Photo seule</p>
              <p className="text-xs text-gray-500 mt-0.5">Rien de dessiné — photo brute publiée telle quelle.</p>
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
              onChange={() => { setOverlayMode('logo-only'); setIsDirty(true); }}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-200">Logo seul</p>
              <p className="text-xs text-gray-500 mt-0.5">Uniquement le logo Umaï, positionné librement. Défaut recommandé.</p>
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
              onChange={() => { setOverlayMode('logo-name'); setIsDirty(true); }}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-200">Logo + nom du plat</p>
              <p className="text-xs text-gray-500 mt-0.5">Logo + nom en texte élégant (ivoire, ombre subtile). Prix optionnel ci-dessous.</p>
            </div>
          </label>
        </div>

        {/* ── Logo controls (shown when mode != photo-only) ─────────────────── */}
        {showLogoControls && (
          <div className="flex flex-col gap-4 pt-1 border-t border-gray-800">

            {/* Size buttons */}
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Taille du logo</p>
              <div className="flex gap-2">
                {(Object.keys(SIZE_LABELS) as LogoSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => { setLogoSize(sz); setIsDirty(true); }}
                    className={`flex-1 min-h-[44px] rounded-lg text-xs font-medium transition-colors ${
                      logoSize === sz
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {SIZE_LABELS[sz]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">Petit = discret, Grand = bien visible.</p>
            </div>

            {/* 9-preset position grid */}
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Position rapide du logo</p>
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
                        setIsDirty(true);
                      }}
                      className={`min-h-[40px] rounded-lg text-xs font-medium transition-colors ${
                        isPresetActive(preset.x, preset.y)
                          ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Position actuelle : x={logoPosX.toFixed(2)} y={logoPosY.toFixed(2)}
                {' '}— ou glissez le cadre dans l&apos;aperçu.
              </p>
            </div>

            {/* showPrice checkbox (logo-name only) */}
            {showNameControls && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => { setShowPrice(e.target.checked); setIsDirty(true); }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800"
                  />
                  <div>
                    <p className="text-sm text-gray-200 font-medium">Afficher le prix sur l&apos;image</p>
                    <p className="text-xs text-gray-500">Désactivé par défaut — le prix va dans la légende.</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {isAmbiance && (
          <p className="text-xs text-gray-500">
            Photo d&apos;ambiance — « Photo seule » par défaut. Vous pouvez quand même ajouter le logo (« Logo seul ») si vous le souhaitez.
          </p>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Aperçu (avec drag logo)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Aperçu</h2>
          <p className="text-xs text-gray-500 mt-1">
            Visualisez le rendu final pour chaque format Meta.
            {showLogoControls && ' Glissez le cadre pointillé pour repositionner le logo.'}
          </p>
        </div>

        {/* Format toggle */}
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

        {/* Source photo + preview side by side */}
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
              /* Drag container — relative so the ghost box can be absolute-positioned */
              <div className="relative select-none">
                {/* Ghost drag handle (shown when logo controls visible) */}
                {showLogoControls && (
                  <div
                    title="Glissez le logo pour le positionner"
                    className="absolute z-10 border-2 border-dashed border-white/80 bg-white/10 hover:bg-white/20 rounded cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
                    style={{
                      left:      `${logoPosX * 100}%`,
                      top:       `${logoPosY * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width:     '26%',
                      height:    '8%',
                      minWidth:  '56px',
                      minHeight: '16px',
                    }}
                    onPointerDown={handleDragPointerDown}
                    onPointerMove={handleDragPointerMove}
                    onPointerUp={handleDragPointerUp}
                  >
                    <span className="text-white/60 text-xs font-mono select-none pointer-events-none">⠿ logo</span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={previewImgRef}
                  src={previewUrl}
                  alt="Aperçu avec overlay"
                  className="w-full object-contain pointer-events-none"
                  draggable={false}
                />
                {showLogoControls && (
                  <p className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-white/50 select-none pointer-events-none">
                    Glissez le logo pour le positionner
                  </p>
                )}
              </div>
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
          SECTION 4 — Légende (caption)
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
          SECTION 5 — Actions
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-800 p-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Actions</h2>
          <p className="text-xs text-gray-500 mt-1">
            Enregistrez les réglages, puis régénérez les 3 formats pour exporter.
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
