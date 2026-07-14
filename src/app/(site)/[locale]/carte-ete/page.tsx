import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button, buttonClasses } from '@/components/ui/Button';
import { SummerMenu } from '@/components/carte-ete/SummerMenu';

type Props = {
  params: Promise<{ locale: string }>;
};

// The designed print version stays downloadable; the page itself is native HTML.
const PDF_HREF = '/carte-ete-umai-2026.pdf';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.carteEte' });
  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, '/carte-ete'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/carte-ete`,
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

export default async function CarteEtePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'carteEte' });

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)]">
      {/* Brand emblem */}
      <img
        src="/seal.svg"
        alt=""
        aria-hidden="true"
        className="mx-auto mb-5 h-14 w-14 opacity-70 pointer-events-none select-none"
      />

      <SectionHeader title={t('title')} jpLabel={t('jpLabel')} subtitle={t('subtitle')} />

      <div className="mb-14 flex flex-col sm:flex-row gap-4 justify-center">
        <a href={PDF_HREF} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline')}>
          {t('downloadPdf')}
        </a>
        <Button variant="primary" href="/menu">
          {t('viewFullMenu')}
        </Button>
      </div>

      <SummerMenu locale={locale} vegOption={t('vegOption')} />

      {/* Closing band */}
      <div className="mt-14 rounded-lg bg-umai-accent px-6 py-5 text-center">
        <p className="font-body text-sm uppercase tracking-[0.15em] text-white">{t('footerNote')}</p>
      </div>
    </div>
  );
}
