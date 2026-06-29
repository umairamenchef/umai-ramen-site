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
