import { redirect } from 'next/navigation';
import { requireStudioAuth } from '@/lib/ig-studio/auth';
import { getPhotos, loadMenuOptions } from '@/lib/ig-studio/data';
import { logout } from './login/actions';
import GalleryFilters from './GalleryFilters';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Umaï IG Studio — Galerie',
};

export default async function IgStudioPage() {
  // Defence in depth: proxy.ts redirects unauthenticated pages, but route handlers
  // and RSCs still need their own guard.
  try {
    await requireStudioAuth();
  } catch {
    redirect('/ig-studio/login');
  }

  const photos = await getPhotos();
  const menu = loadMenuOptions();

  // Collect unique group names in menu order for the filter dropdown
  const groupNames = menu.groups
    .map((g) => g.group)
    .filter((g) => photos.some((p) => p.group === g));

  const validatedCount = photos.filter((p) => p.status === 'validated').length;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-xl font-bold tracking-tight shrink-0">Umaï IG Studio</h1>
          <span className="text-sm text-neutral-400 hidden sm:inline">
            {validatedCount} validée{validatedCount !== 1 ? 's' : ''} / {photos.length} photos
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile count */}
          <span className="text-xs text-neutral-500 sm:hidden">
            {validatedCount}/{photos.length}
          </span>

          {/* Export button — always visible; styled by whether there are validated posts */}
          <a
            href="/api/ig-studio/export"
            download="umai-posts.zip"
            aria-disabled={validatedCount === 0}
            className={
              validatedCount > 0
                ? 'text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800 min-h-[44px] flex items-center gap-1.5 border border-emerald-800 hover:border-emerald-700'
                : 'text-sm font-medium text-neutral-600 cursor-not-allowed px-3 py-1.5 rounded-lg min-h-[44px] flex items-center gap-1.5 border border-neutral-800'
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            <span className="hidden sm:inline">Exporter les posts validés</span>
            <span className="sm:hidden">Export</span>
            <span className="ml-0.5 text-xs opacity-60">({validatedCount})</span>
          </a>

          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800 min-h-[44px] flex items-center"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {/* Gallery with client-side filters */}
      {photos.length === 0 ? (
        <section className="px-6 py-16 text-center">
          <p className="text-neutral-500 text-lg">
            Aucune photo trouvée dans{' '}
            <code className="text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded text-sm">
              ig-studio/photos/
            </code>
            .
          </p>
        </section>
      ) : (
        <GalleryFilters photos={photos} groups={groupNames} />
      )}
    </main>
  );
}
