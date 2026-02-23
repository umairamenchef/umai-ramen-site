import { setRequestLocale, getTranslations } from 'next-intl/server';
import { sanityFetch } from '@/sanity/lib/client';
import {
  MENU_CATEGORIES_QUERY,
  MENU_EXTRAS_QUERY,
  MENU_FORMULES_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { MenuStickyNav } from '@/components/menu/MenuStickyNav';
import { MenuCategory } from '@/components/menu/MenuCategory';
import { ExtrasGrid } from '@/components/menu/ExtrasGrid';
import { FormulesSection } from '@/components/menu/FormulesSection';

type Props = {
  params: Promise<{ locale: string }>;
};

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

  return (
    <div className="py-[var(--spacing-section)]">
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
