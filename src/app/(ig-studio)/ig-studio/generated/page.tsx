/**
 * /ig-studio/generated — gallery of the already-rendered branded posts (out/).
 * Shows the feed.png of every generated post + caption + per-format downloads.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireStudioAuth } from '@/lib/ig-studio/auth';
import { getGeneratedPosts } from '@/lib/ig-studio/data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Umaï IG Studio — Série générée',
};

export default async function GeneratedPage() {
  try {
    await requireStudioAuth();
  } catch {
    redirect('/ig-studio/login');
  }

  const posts = await getGeneratedPosts();

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/ig-studio"
            className="text-sm text-neutral-400 hover:text-white transition-colors min-h-[44px] flex items-center"
          >
            ← Galerie
          </Link>
          <h1 className="text-xl font-bold tracking-tight shrink-0">Série générée</h1>
          <span className="text-sm text-neutral-400 hidden sm:inline">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {posts.length > 0 && (
          <a
            href="/api/ig-studio/export"
            download="umai-posts.zip"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800 min-h-[44px] flex items-center gap-1.5 border border-emerald-800 hover:border-emerald-700"
          >
            <span className="hidden sm:inline">Exporter (zip)</span>
            <span className="sm:hidden">Zip</span>
          </a>
        )}
      </header>

      {posts.length === 0 ? (
        <section className="px-6 py-16 text-center">
          <p className="text-neutral-400 text-lg">Aucun post généré pour l&apos;instant.</p>
          <p className="text-neutral-500 text-sm mt-2">
            Ouvrez une photo depuis la galerie, réglez l&apos;affichage, puis « Régénérer les 3 formats ».
          </p>
        </section>
      ) : (
        <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800"
            >
              {/* Feed render */}
              <Link href={`/ig-studio/${p.id}`} className="block group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/ig-studio/output/${p.id}?format=feed&size=thumb`}
                  alt={p.dishName}
                  loading="lazy"
                  className="w-full aspect-[4/5] object-cover bg-neutral-800 group-hover:opacity-90 transition-opacity"
                />
                <span className="absolute top-2 left-2 text-[10px] font-mono text-white/70 bg-black/40 rounded px-1.5 py-0.5">
                  {p.id}
                </span>
              </Link>

              {/* Info */}
              <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                <p className="text-sm font-medium text-white leading-tight line-clamp-1">
                  {p.dishName}
                </p>
                {p.caption && (
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {p.caption}
                  </p>
                )}

                {/* Per-format downloads */}
                <div className="mt-auto pt-1.5 flex flex-wrap gap-1.5">
                  {(['feed', 'square', 'story'] as const).map((fmt) =>
                    p.formats[fmt] ? (
                      <a
                        key={fmt}
                        href={`/api/ig-studio/output/${p.id}?format=${fmt}`}
                        download={`${p.id}-${fmt}.png`}
                        className="text-[11px] px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                      >
                        {fmt === 'feed' ? 'Publication' : fmt === 'square' ? 'Carré' : 'Story'} ↓
                      </a>
                    ) : null,
                  )}
                </div>

                <Link
                  href={`/ig-studio/${p.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
                >
                  Éditer / régénérer →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
