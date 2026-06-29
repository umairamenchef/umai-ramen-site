import { redirect } from 'next/navigation';
import { requireStudioAuth } from '@/lib/ig-studio/auth';
import { logout } from './login/actions';

export const metadata = {
  title: 'Umaï IG Studio — Galerie',
};

export default async function IgStudioPage() {
  // Defence in depth: middleware redirects unauthenticated, but we also check here.
  try {
    await requireStudioAuth();
  } catch {
    redirect('/ig-studio/login');
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Umaï IG Studio</h1>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <section className="px-6 py-12 text-center">
        <p className="text-neutral-500 text-lg">
          Galerie à venir — Phase 07-03
        </p>
      </section>
    </main>
  );
}
