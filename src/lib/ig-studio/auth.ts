/**
 * Cross-runtime auth helpers for /ig-studio.
 * Uses Web Crypto (globalThis.crypto.subtle) — works on both Edge and Node 20+.
 * NO next-intl / React imports — safe to import from proxy.ts (edge middleware).
 */

export const COOKIE_NAME = 'ig_studio_auth';

async function sha256Hex(s: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(s),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute the hex token for an arbitrary plain-text string.
 * Exposed so the login action can hash the submitted password and compare.
 */
export async function tokenFor(plain: string): Promise<string> {
  return sha256Hex(plain);
}

/**
 * Returns the expected cookie value (SHA-256 hex of IG_STUDIO_PASSWORD),
 * or null if the env var is unset / empty (fail-closed).
 */
export async function expectedToken(): Promise<string | null> {
  const password = process.env.IG_STUDIO_PASSWORD;
  if (!password) return null;
  return sha256Hex(password);
}

/**
 * Returns true iff the supplied cookie value matches the expected token.
 * Fails closed on unset env var or missing value.
 */
export async function isValidStudioCookie(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  const expected = await expectedToken();
  if (!expected) return false;
  return value === expected;
}

/**
 * Server-context guard (route handlers / server actions / server components).
 * Throws 'UNAUTHORIZED' if the request cookie is missing or invalid.
 * Callers turn the throw into a 401 response or redirect('/ig-studio/login').
 */
export async function requireStudioAuth(): Promise<void> {
  const { cookies } = await import('next/headers');
  const jar = await cookies();
  const ok = await isValidStudioCookie(jar.get(COOKIE_NAME)?.value);
  if (!ok) throw new Error('UNAUTHORIZED');
}
