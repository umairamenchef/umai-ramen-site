import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { COOKIE_NAME, isValidStudioCookie } from './lib/ig-studio/auth';

const intl = createMiddleware(routing);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /ig-studio branch — bypass next-intl locale rewriting entirely.
  if (pathname === '/ig-studio' || pathname.startsWith('/ig-studio/')) {
    // Login page is always public (no cookie check needed).
    if (pathname === '/ig-studio/login') return NextResponse.next();

    // All other /ig-studio/* paths require a valid auth cookie.
    const ok = await isValidStudioCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = '/ig-studio/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next(); // authenticated — serve the admin tool as-is
  }

  // Everything else flows through next-intl (locale routing, /fr, /en, /de, …).
  return intl(req);
}

// Keep the existing matcher UNCHANGED.
// /ig-studio is already matched (it does not start with 'studio', 'api', '_next', etc.).
// /api/ig-studio/* is excluded (auth there is handled per-route via requireStudioAuth()).
export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|studio|.*\\..*).*)',
};
