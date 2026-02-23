import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { WithContext, Menu as SchemaMenu } from 'schema-dts';
import { sanityFetch } from '@/sanity/lib/client';
import {
  MENU_CATEGORIES_QUERY,
  MENU_EXTRAS_QUERY,
  MENU_FORMULES_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries';
import { localized } from '@/lib/localized';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { MenuStickyNav } from '@/components/menu/MenuStickyNav';
import { MenuCategory } from '@/components/menu/MenuCategory';
import { ExtrasGrid } from '@/components/menu/ExtrasGrid';
import { FormulesSection } from '@/components/menu/FormulesSection';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.menu' });
  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, '/menu'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/menu`,
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

export default async function MenuPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'menu' });

  let categories: Awaited<ReturnType<typeof sanityFetch>> = [];
  let extras: Awaited<ReturnType<typeof sanityFetch>> = [];
  let formules: Awaited<ReturnType<typeof sanityFetch>> = [];
  let settings: Awaited<ReturnType<typeof sanityFetch>> = null;

  try {
    [categories, extras, formules, settings] = await Promise.all([
      sanityFetch({ query: MENU_CATEGORIES_QUERY, tags: ['menuCategory', 'menuItem'] }),
      sanityFetch({ query: MENU_EXTRAS_QUERY, tags: ['menuExtra'] }),
      sanityFetch({ query: MENU_FORMULES_QUERY, tags: ['menuFormule'] }),
      sanityFetch({ query: SITE_SETTINGS_QUERY, tags: ['siteSettings'] }),
    ]);
  } catch {
    // Sanity not configured — render empty menu structure
  }

  const typedCategories = (categories as Array<{
    _id: string;
    name: { fr: string; en?: string; de?: string };
    slug: { current: string };
    description?: { fr: string; en?: string; de?: string } | null;
    items: Array<{
      _id: string;
      name: { fr: string; en?: string; de?: string };
      nameJp?: string;
      description?: { fr: string; en?: string; de?: string } | null;
      price: number;
      isVegetarian: boolean;
      isGlutenFree: boolean;
    }>;
  }>) ?? [];

  const typedExtras = (extras as Array<{
    _id: string;
    name: { fr: string; en?: string; de?: string };
    price: number;
  }>) ?? [];

  const typedFormules = (formules as Array<{
    _id: string;
    name: { fr: string; en?: string; de?: string };
    price: number;
    description?: { fr: string; en?: string; de?: string } | null;
    includedItems?: string[] | null;
  }>) ?? [];

  const eazeeLinkUrl =
    (settings as { eazeeLinkUrl?: string } | null)?.eazeeLinkUrl ?? '#';

  // Filter out categories with no visible items
  const visibleCategories = typedCategories.filter(
    (cat) => cat.items && cat.items.length > 0
  );

  const menuJsonLd: WithContext<SchemaMenu> = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Umaï Ramen Menu',
    hasMenuSection: typedCategories.map((cat) => ({
      '@type': 'MenuSection' as const,
      name: localized(cat.name, locale, ''),
      hasMenuItem: cat.items
        ?.filter((item) => item.price !== undefined)
        .map((item) => ({
          '@type': 'MenuItem' as const,
          name: localized(item.name, locale, ''),
          description: localized(item.description, locale, ''),
          offers: {
            '@type': 'Offer' as const,
            price: String(item.price),
            priceCurrency: 'EUR',
          },
        })) ?? [],
    })),
  };

  return (
    <div className="py-[var(--spacing-section)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(menuJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />
      </div>

      {visibleCategories.length > 0 && (
        <MenuStickyNav categories={visibleCategories} locale={locale} />
      )}

      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        {visibleCategories.map((category) => (
          <MenuCategory key={category._id} category={category} locale={locale} />
        ))}

        {typedExtras.length > 0 && (
          <div className="mt-16">
            <ExtrasGrid
              extras={typedExtras}
              locale={locale}
              title={t('extrasTitle')}
            />
          </div>
        )}

        {typedFormules.length > 0 && (
          <div className="mt-16">
            <FormulesSection
              formules={typedFormules}
              locale={locale}
              title={t('formulesTitle')}
              includesLabel={t('includes')}
            />
          </div>
        )}

        <div className="mt-16 text-center">
          <Button variant="outline" href={eazeeLinkUrl} external>
            {t('eazeeLinkCta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
