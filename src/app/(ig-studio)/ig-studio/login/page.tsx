'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function IgStudioLoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Umaï IG Studio
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Accès réservé</p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-300">
              Mot de passe
            </span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </label>

          {state?.error && (
            <p className="text-red-400 text-sm rounded-lg bg-red-950/40 px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-semibold py-2.5 text-sm transition-colors"
          >
            {pending ? 'Vérification…' : 'Entrer'}
          </button>
        </form>
      </div>
    </main>
  );
}
