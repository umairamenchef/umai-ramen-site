import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { WithContext, Menu as SchemaMenu } from 'schema-dts';
import { sanityFetch } from '@/sanity/lib/client';
import {
  MENU_CATEGORIES_QUERY,
  MENU_EXTRAS_QUERY,
  MENU_FORMULES_QUERY,
} from '@/sanity/lib/queries';
import { localized } from '@/lib/localized';
import {
  buildOffers,
  groupBySection,
  variantQuantityText,
  type LocaleField,
  type MenuCategoryData,
  type PriceVariant,
} from '@/lib/menu';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';
import { DEFAULT_LOCALE, LOCALES, MENU_ONLY_LOCALES, ogLocale } from '@/i18n/locales';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MenuLanguageSwitcher } from '@/components/menu/MenuLanguageSwitcher';
import { MenuStickyNav } from '@/components/menu/MenuStickyNav';
import { MenuCategory } from '@/components/menu/MenuCategory';
import { ExtrasGrid } from '@/components/menu/ExtrasGrid';
import { FormulesSection } from '@/components/menu/FormulesSection';

type Props = {
  params: Promise<{ locale: string }>;
};

// IT/ZH are menu-only (I18N-02). The [locale] layout prerenders fr/en/de only; this page adds
// it/zh. Next calls a child generateStaticParams once per parent param set and merges
// {...parent, ...child}, so the menu-only locales are emitted once, from the default-locale
// branch. If a future Next ignored this, /it/menu and /zh/menu would still render on demand
// (dynamicParams defaults to true): it can only save work, never break the route.
export function generateStaticParams({ params }: { params?: { locale?: string } } = {}) {
  const parent = params?.locale;
  if (!parent) return LOCALES.map((locale) => ({ locale }));
  if (parent !== DEFAULT_LOCALE) return [{ locale: parent }];
  return [{ locale: parent }, ...MENU_ONLY_LOCALES.map((locale) => ({ locale }))];
}

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
      locale: ogLocale(locale),
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

  try {
    [categories, extras, formules] = await Promise.all([
      sanityFetch({ query: MENU_CATEGORIES_QUERY, tags: ['menuCategory', 'menuItem'] }),
      sanityFetch({ query: MENU_EXTRAS_QUERY, tags: ['menuExtra'] }),
      sanityFetch({ query: MENU_FORMULES_QUERY, tags: ['menuFormule'] }),
    ]);
  } catch {
    // Sanity not configured — render empty menu structure
  }

  const typedCategories = (categories as MenuCategoryData[] | null) ?? [];

  const typedExtras = (extras as Array<{
    _id: string;
    name: LocaleField;
    price: number;
  }>) ?? [];

  const typedFormules = (formules as Array<{
    _id: string;
    name: LocaleField;
    price: number;
    description?: LocaleField | null;
    includedItems?: string[] | null;
  }>) ?? [];

  // Filter out categories with no visible items, then group them under
  // « Plats » / « Boissons ». The sticky nav, the page and the JSON-LD all use
  // this same order. Legacy categories have no section: they form one unlabelled group.
  const visibleCategories = typedCategories.filter(
    (cat) => (cat.items?.length ?? 0) > 0
  );
  const groups = groupBySection(visibleCategories);
  const orderedCategories = groups.flatMap((group) => group.categories);

  // The quick-nav is a client component: give it slug / name / section only, never the
  // item objects (every dish used to be serialized into the page for it).
  const navCategories = orderedCategories.map(({ slug, name, section }) => ({
    slug,
    name,
    section: section ?? null,
  }));

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
        <MenuLanguageSwitcher
          locale={locale}
          label={t('languageSwitcherLabel')}
          className="-mt-8 mb-12"
        />
      </div>

      {navCategories.length > 0 && (
        <MenuStickyNav
          categories={navCategories}
          locale={locale}
          label={t('categoriesNavLabel')}
        />
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
      </div>
    </div>
  );
}
