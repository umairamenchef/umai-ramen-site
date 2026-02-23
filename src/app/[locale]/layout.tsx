import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { routing } from '@/i18n/routing';
import { DM_Serif_Display, Outfit, Noto_Sans_JP } from 'next/font/google';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBar } from '@/components/layout/MobileBar';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { sanityFetch } from '@/sanity/lib/client';
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries';

export const revalidate = 60; // FOUND-04: ISR 60s baseline

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
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

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false, // decorative only — lazy load to protect LCP
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
  let uberEatsUrl = '#';
  try {
    const siteSettings = await sanityFetch({ query: SITE_SETTINGS_QUERY, tags: ['siteSettings'] });
    reservationUrl = (siteSettings as { reservationUrl?: string } | null)?.reservationUrl ?? '#';
    uberEatsUrl = (siteSettings as { uberEatsUrl?: string } | null)?.uberEatsUrl ?? '#';
  } catch {
    // Sanity not configured — fall back to '#' (non-blocking for dev builds without credentials)
  }

  return (
    <html
      lang={locale}
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
            <Header reservationUrl={reservationUrl} uberEatsUrl={uberEatsUrl} />
            <main className="min-h-screen pb-16 md:pb-0">
              {children}
            </main>
            <Footer reservationUrl={reservationUrl} uberEatsUrl={uberEatsUrl} />
            <MobileBar reservationUrl={reservationUrl} uberEatsUrl={uberEatsUrl} />
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
