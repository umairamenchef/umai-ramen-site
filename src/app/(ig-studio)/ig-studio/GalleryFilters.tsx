'use client';

import { useEffect, useState } from 'react';
import type { IgPhoto } from '@/lib/ig-studio/data';

interface Props {
  photos: IgPhoto[];
  groups: string[];
}

type StatusFilter = 'all' | 'validated' | 'pending';
type ConfFilter = 'all' | 'high' | 'low';

/** Read initial filter from the URL query so back-navigation restores it. */
function readParam<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const v = new URLSearchParams(window.location.search).get(key);
  return (v && (allowed as readonly string[]).includes(v)) ? (v as T) : fallback;
}

export default function GalleryFilters({ photos, groups }: Props) {
  const [status, setStatus] = useState<StatusFilter>(() => readParam('status', ['all', 'validated', 'pending'] as const, 'all'));
  const [group, setGroup] = useState<string>(() => readParam('group', ['all', ...groups], 'all'));
  const [conf, setConf] = useState<ConfFilter>(() => readParam('conf', ['all', 'high', 'low'] as const, 'all'));

  // Keep the URL query in sync so leaving and coming back (browser back) preserves filters.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (status !== 'all') qs.set('status', status);
    if (group !== 'all') qs.set('group', group);
    if (conf !== 'all') qs.set('conf', conf);
    const next = qs.toString();
    const url = next ? `?${next}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [status, group, conf]);

  const filtered = photos.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (group !== 'all' && p.group !== group) return false;
    if (conf === 'high' && p.confidence < 0.7) return false;
    if (conf === 'low' && p.confidence >= 0.7) return false;
    return true;
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 px-4 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-900">
        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 uppercase tracking-wider">Statut</label>
          <div className="flex gap-1">
            {(['all', 'validated', 'pending'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  status === s
                    ? 'bg-white text-neutral-950'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {s === 'all' ? 'Tous' : s === 'validated' ? 'Validés' : 'En attente'}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 uppercase tracking-wider">Confiance IA</label>
          <div className="flex gap-1">
            {(['all', 'high', 'low'] as ConfFilter[]).map((c) => (
              <button
                key={c}
                onClick={() => setConf(c)}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  conf === c
                    ? 'bg-white text-neutral-950'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {c === 'all' ? 'Toutes' : c === 'high' ? '≥ 70 %' : '< 70 %'}
              </button>
            ))}
          </div>
        </div>

        {/* Group filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 uppercase tracking-wider">Groupe</label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-neutral-300 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
          >
            <option value="all">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <div className="flex items-end ml-auto">
          <span className="text-sm text-neutral-500 min-h-[44px] flex items-center">
            {filtered.length} / {photos.length} photo{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="px-6 py-16 text-center text-neutral-500">
          Aucune photo ne correspond aux filtres.
        </div>
      ) : (
        <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <a
              key={p.id}
              href={`/ig-studio/${p.id}`}
              className="block rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-neutral-800">
                <img
                  src={`/api/ig-studio/photo/${p.id}?size=thumb`}
                  alt={p.dishName}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Status pill */}
                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'validated'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-500/90 text-white'
                  }`}
                >
                  {p.status === 'validated' ? 'Validé' : 'Attente'}
                </span>
              </div>

              {/* Card info */}
              <div className="p-2.5 space-y-1.5">
                {/* Dish name */}
                <p className="text-sm font-medium text-white leading-tight line-clamp-1">
                  {p.dishName}
                </p>

                {/* Shot type + confidence badge */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-neutral-400">{p.shotType}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                      p.confidence >= 0.7
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : 'bg-amber-900/60 text-amber-300'
                    }`}
                  >
                    {Math.round(p.confidence * 100)}%
                  </span>
                </div>

                {/* Reasoning excerpt */}
                {p.reasoning && (
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {p.reasoning}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
