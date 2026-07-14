import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button, buttonClasses } from '@/components/ui/Button';
import { FadeInUp } from '@/components/ui/FadeInUp';

type Props = {
  params: Promise<{ locale: string }>;
};

// Static assets rendered from the final summer PDF (public/) — the web page
// preserves the print design pixel-for-pixel. Source PDF stays downloadable.
const PDF_HREF = '/carte-ete-umai-2026.pdf';
const PAGES = ['/carte-ete-2026-1.jpg', '/carte-ete-2026-2.jpg'];
const PAGE_W = 1654;
const PAGE_H = 2363;

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
      <SectionHeader title={t('title')} jpLabel={t('jpLabel')} subtitle={t('subtitle')} />

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
        <a href={PDF_HREF} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline')}>
          {t('downloadPdf')}
        </a>
        <Button variant="primary" href="/menu">
          {t('viewFullMenu')}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-8 max-w-[880px] mx-auto">
        {PAGES.map((src, i) => (
          <FadeInUp key={src} delay={i * 0.1} className="w-full">
            <Image
              src={src}
              alt={t('imageAlt', { page: i + 1 })}
              width={PAGE_W}
              height={PAGE_H}
              priority={i === 0}
              className="w-full h-auto rounded-lg border border-umai-line shadow-lg"
              sizes="(max-width: 900px) 100vw, 880px"
            />
          </FadeInUp>
        ))}
      </div>
    </div>
  );
}
