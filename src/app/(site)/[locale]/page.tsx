import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { SanityImageSource } from '@sanity/image-url';
import type { WithContext, Restaurant } from 'schema-dts';
import { sanityFetch } from '@/sanity/lib/client';
import { HOMEPAGE_QUERY } from '@/sanity/lib/queries';
import { localized } from '@/lib/localized';
import { NAP, BASE_URL, OG_IMAGE, OPENING_HOURS, buildAlternates } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import { SummerBanner } from '@/components/home/SummerBanner';
import { SignatureSection } from '@/components/home/SignatureSection';
import { MenuPreview } from '@/components/home/MenuPreview';
import { UspSection } from '@/components/home/UspSection';
import { HistoireTeaser } from '@/components/home/HistoireTeaser';
import { GalleryPreview } from '@/components/home/GalleryPreview';
import { SocialSection } from '@/components/home/SocialSection';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.home' });
  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, ''),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}`,
      siteName: 'Umaï Ramen',
      locale: locale === 'fr' ? 'fr_FR' : locale === 'en' ? 'en_US' : 'de_DE',
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [OG_IMAGE.url],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch translations (server-side)
  const tHome = await getTranslations({ locale, namespace: 'home' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  // Fetch Sanity data with graceful fallback
  let homepageData: {
    settings: {
      catchphrase?: { fr: string; en?: string; de?: string } | null;
      heroImage?: SanityImageSource;
      reservationUrl?: string;
      uberEatsUrl?: string;
      obypayUrl?: string;
      socialLinks?: { instagram?: string };
    } | null;
    menuCategories: Array<{
      _id: string;
      name: { fr: string; en?: string; de?: string } | string;
      slug: { current: string };
      image?: SanityImageSource;
    }>;
    galleryPreview: Array<{
      _id: string;
      title?: string;
      alt?: string;
      image: SanityImageSource;
    }>;
    signature?: { price?: number } | null;
  } = {
    settings: null,
    menuCategories: [],
    galleryPreview: [],
    signature: null,
  };

  try {
    const result = await sanityFetch({
      query: HOMEPAGE_QUERY,
      tags: ['siteSettings', 'menuCategory', 'menuItem', 'gallery'],
    });
    if (result) {
      // Cast through unknown to allow Sanity's inferred type → our typed structure
      homepageData = result as unknown as typeof homepageData;
    }
  } catch {
    // Sanity not configured — render with fallback content
  }

  const { settings, menuCategories, galleryPreview, signature } = homepageData;

  const catchphrase = settings?.catchphrase
    ? localized(settings.catchphrase, locale, 'Nouilles fraiches. Bouillons maison.')
    : 'Nouilles fraiches. Bouillons maison.';

  const reservationUrl = settings?.reservationUrl ?? '#';
  const orderUrls = {
    uberEats: settings?.uberEatsUrl ?? null,
    obypay: settings?.obypayUrl ?? null,
  };
  const instagramUrl = settings?.socialLinks?.instagram ?? 'https://instagram.com/umai_ramen_strasbourg';

  const usps = [
    {
      icon: 'noodles' as const,
      title: tHome('uspNouilles'),
      description: tHome('uspNouillesDesc'),
    },
    {
      icon: 'bouillon' as const,
      title: tHome('uspBouillons'),
      description: tHome('uspBouillonsDesc'),
    },
    {
      icon: 'local' as const,
      title: tHome('uspLocal'),
      description: tHome('uspLocalDesc'),
    },
  ];

  const restaurantJsonLd: WithContext<Restaurant> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: NAP.name,
    url: BASE_URL,
    telephone: NAP.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: NAP.streetAddress,
      addressLocality: NAP.addressLocality,
      postalCode: NAP.postalCode,
      addressCountry: NAP.addressCountry,
    },
    servesCuisine: 'Japanese',
    priceRange: '$$',
    openingHoursSpecification: OPENING_HOURS,
    image: `${BASE_URL}/og-image.jpg`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(restaurantJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* 1. Hero — full width, outside max-width container */}
      <Hero
        catchphrase={catchphrase}
        reservationUrl={reservationUrl}
        orderUrls={orderUrls}
        heroImage={settings?.heroImage}
        reserveLabel={tCommon('reserve')}
        orderLabel={tCommon('order')}
      />

      {/* 1b. Summer menu promo band */}
      <SummerBanner
        label={tHome('summerLabel')}
        title={tHome('summerTitle')}
        description={tHome('summerDesc')}
        ctaLabel={tHome('summerCta')}
      />

      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        {/* 2. Menu Preview */}
        <MenuPreview
          categories={menuCategories}
          locale={locale}
          title={tHome('menuPreviewTitle')}
          ctaLabel={tHome('menuPreviewCta')}
        />
      </div>

      {/* 2b. Signature dish — the Tantan */}
      <SignatureSection
        label={tHome('signatureLabel')}
        title={tHome('signatureTitle')}
        description={tHome('signatureDesc')}
        ctaLabel={tHome('signatureCta')}
        price={signature?.price}
      />

      {/* USP has its own full-width bg (bg-umai-bg-alt) */}
      <UspSection
        title={tHome('uspTitle')}
        usps={usps}
      />

      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        {/* 4. Notre Histoire Teaser */}
        <HistoireTeaser
          title={tHome('histoireTitle')}
          teaser={tHome('histoireTeaser')}
          ctaLabel={tHome('histoireCta')}
          locale={locale}
        />

        {/* 5. Gallery Preview */}
        <GalleryPreview
          photos={galleryPreview}
          locale={locale}
          title={tHome('title')}
          ctaLabel={tHome('galleryCta')}
        />
      </div>

      {/* 6. Social Section */}
      <SocialSection
        instagramUrl={instagramUrl}
        hashtag={tHome('socialHashtag')}
      />
    </>
  );
}
