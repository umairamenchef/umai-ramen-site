import '../../globals.css';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { routing } from '@/i18n/routing';
import { FULL_SITE_LOCALES, htmlLang } from '@/i18n/locales';
import { DM_Serif_Display, Outfit, Noto_Sans_JP } from 'next/font/google';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBar } from '@/components/layout/MobileBar';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { sanityFetch } from '@/sanity/lib/client';
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries';

export const revalidate = 60; // FOUND-04: ISR 60s baseline

// UI-04 perf headroom: only the font files that are actually rendered are requested.
// Every `italic` class sits on font-body (Outfit, synthesized), so no DM Serif italic.
const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal'],
  variable: '--font-dm-serif-display',
  display: 'swap',
  preload: true,
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
});

// Weight 300 trimmed (UI-04): nothing in src/** uses font-light, so it was never rendered
// but cost ~124 unicode-range @font-face rules in the render-blocking CSS.
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false, // decorative only — lazy load to protect LCP
});

// IT/ZH are menu-only (I18N-02): non-menu pages are NOT prerendered for it/zh. They are
// unreachable anyway (src/proxy.ts redirects every non-menu /it/* and /zh/* to /en/*).
// The menu page adds it/zh to its own static params (Plan 13-02); until then /it/menu and
// /zh/menu render on demand (dynamicParams default) and are cached.
export function generateStaticParams() {
  return FULL_SITE_LOCALES.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  let reservationUrl = '#';
  let orderUrls: { uberEats?: string | null; obypay?: string | null } = {};
  try {
    const s = (await sanityFetch({ query: SITE_SETTINGS_QUERY, tags: ['siteSettings'] })) as {
      reservationUrl?: string; uberEatsUrl?: string; obypayUrl?: string;
    } | null;
    reservationUrl = s?.reservationUrl ?? '#';
    orderUrls = { uberEats: s?.uberEatsUrl, obypay: s?.obypayUrl };
  } catch {
    // Sanity not configured — fall back (non-blocking for dev builds without credentials)
  }

  return (
    <html
      lang={htmlLang(locale)}
      className={`${dmSerifDisplay.variable} ${outfit.variable} ${notoSansJP.variable}`}
    >
      <head>
        {/* Consent Mode v2 defaults — MUST execute BEFORE GTM loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
              gtag('js', new Date());
            `,
          }}
        />
      </head>
      <body className="font-body bg-umai-bg text-umai-text antialiased">
        <NextIntlClientProvider messages={messages}>
          <MotionProvider>
            <Header reservationUrl={reservationUrl} orderUrls={orderUrls} />
            <main className="min-h-screen pb-16 md:pb-0">
              {children}
            </main>
            <Footer reservationUrl={reservationUrl} orderUrls={orderUrls} />
            <MobileBar reservationUrl={reservationUrl} orderUrls={orderUrls} />
          </MotionProvider>
          <CookieBanner />
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
          />
        )}
      </body>
    </html>
  );
}
