import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { menuOnlyRedirectPath } from './i18n/locales';
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

  // IT/ZH are menu-only (I18N-02): /it, /zh/infos, … → same path under /en (query kept).
  // 307, not 308: it stays reversible while « IT/ZH for the rest of the site » is a
  // deferred idea (browsers cache a 308 forever); next-intl's own redirects are 307 too.
  const menuOnlyTarget = menuOnlyRedirectPath(pathname);
  if (menuOnlyTarget) {
    const url = req.nextUrl.clone();
    url.pathname = menuOnlyTarget;
    return NextResponse.redirect(url, 307);
  }

  // Everything else flows through next-intl (locale routing, /fr, /en, /de, /{it,zh}/menu).
  const response = intl(req);

  // Locale detection on unprefixed URLs (NEXT_LOCALE cookie or Accept-Language = it/zh)
  // must never land on a non-menu IT/ZH page: retarget next-intl's redirect to /en.
  const location = response.headers.get('location');
  if (location) {
    const target = new URL(location, req.url);
    const fixed = menuOnlyRedirectPath(target.pathname);
    if (fixed) {
      target.pathname = fixed;
      response.headers.set('location', target.toString());
    }
  }
  return response;
}

// Keep the existing matcher UNCHANGED.
// /ig-studio is already matched (it does not start with 'studio', 'api', '_next', etc.).
// /api/ig-studio/* is excluded (auth there is handled per-route via requireStudioAuth()).
export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|studio|.*\\..*).*)',
};
