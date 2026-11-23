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
import {
  buildOffers,
  groupBySection,
  variantQuantityText,
  type MenuCategoryData,
  type PriceVariant,
} from '@/lib/menu';
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

  const typedCategories = (categories as MenuCategoryData[] | null) ?? [];

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

  // Filter out categories with no visible items, then group them under
  // « Plats » / « Boissons ». The sticky nav, the page and the JSON-LD all use
  // this same order. Legacy categories have no section: they form one unlabelled group.
  const visibleCategories = typedCategories.filter(
    (cat) => (cat.items?.length ?? 0) > 0
  );
  const groups = groupBySection(visibleCategories);
  const orderedCategories = groups.flatMap((group) => group.categories);

  const unitText = (unit: 'pcs' | 'scoop', count: number) =>
    t(`unit.${unit}`, { count });
  const describeVariant = (variant: PriceVariant) =>
    variantQuantityText(variant, locale, unitText);

  const menuJsonLd: WithContext<SchemaMenu> = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Umaï Ramen Menu',
    hasMenuSection: orderedCategories.map((cat) => ({
      '@type': 'MenuSection' as const,
      name: localized(cat.name, locale, ''),
      hasMenuItem: cat.items.map((item) => {
        const offers = buildOffers(item, describeVariant);
        return {
          '@type': 'MenuItem' as const,
          name: localized(item.name, locale, ''),
          description: localized(item.description, locale, ''),
          // No offer for « Prix sur demande » items; one Offer per price variant.
          ...(offers.length === 1
            ? { offers: offers[0] }
            : offers.length > 1
              ? { offers }
              : {}),
        };
      }),
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

      {orderedCategories.length > 0 && (
        <MenuStickyNav categories={orderedCategories} locale={locale} />
      )}

      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        {groups.map((group) => (
          <div
            key={group.section ?? 'other'}
            id={group.section ? `section-${group.section}` : undefined}
          >
            {group.section && (
              <div className="pt-16">
                <SectionHeader
                  title={group.section === 'food' ? t('sectionFood') : t('sectionDrinks')}
                  jpLabel={group.section === 'food' ? '料理' : 'ドリンク'}
                />
              </div>
            )}
            {group.categories.map((category) => (
              <MenuCategory key={category._id} category={category} locale={locale} />
            ))}
          </div>
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

        <div className="mt-16 border-t border-umai-line pt-10 text-center space-y-2">
          <p className="font-body text-sm text-umai-text-muted">{t('intro')}</p>
          <p className="font-body text-sm text-umai-text-muted">{t('allergens')}</p>
          <p className="font-body text-xs uppercase tracking-widest text-umai-accent">
            {t('serviceIncluded')}
          </p>
        </div>

        <div className="mt-16 text-center">
          <Button variant="outline" href={eazeeLinkUrl} external>
            {t('eazeeLinkCta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
