'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, expectedToken, tokenFor, timingSafeEqual } from '@/lib/ig-studio/auth';

export async function login(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | never> {
  const password = String(formData.get('password') ?? '');

  const expected = await expectedToken();
  if (expected === null) {
    return {
      error: 'IG_STUDIO_PASSWORD non configuré (voir .env.local).',
    };
  }

  const submitted = await tokenFor(password);
  if (!timingSafeEqual(submitted, expected)) {
    return { error: 'Mot de passe incorrect.' };
  }

  // Correct password — set httpOnly auth cookie and redirect.
  const jar = await cookies();
  jar.set(COOKIE_NAME, expected, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/', // must cover /ig-studio AND /api/ig-studio/* (image/preview routes)
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // redirect() throws — must NOT be wrapped in try/catch.
  redirect('/ig-studio');
}

export async function logout(): Promise<never> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  redirect('/ig-studio/login');
}
