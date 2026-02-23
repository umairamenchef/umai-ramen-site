import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';

export const revalidate = false; // Static — never changes dynamically (PERF-06 compliance)

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.politiqueConfidentialite' });
  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, '/politique-confidentialite'),
    openGraph: { title: t('title'), description: t('description'), siteName: 'Umaï Ramen', images: [OG_IMAGE] },
  };
}

export default async function PolitiqueConfidentialitePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal.politiqueConfidentialite' });

  const sections = ['controller', 'data', 'basis', 'retention', 'rights', 'cnil'] as const;

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-16 md:py-24">
      <h1 className="font-display text-3xl md:text-4xl text-umai-text mb-8">{t('title')}</h1>
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section}>
            <h2 className="font-display text-xl uppercase tracking-wide text-umai-text mb-3">
              {t(`${section}.heading`)}
            </h2>
            <p className="font-body text-sm text-umai-text/80 leading-relaxed whitespace-pre-line">
              {t(`${section}.content`)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
