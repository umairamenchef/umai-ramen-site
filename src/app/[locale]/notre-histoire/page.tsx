import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import { sanityFetch } from '@/sanity/lib/client';
import { NOTRE_HISTOIRE_QUERY } from '@/sanity/lib/queries';
import { urlFor } from '@/sanity/lib/image';
import { localized } from '@/lib/localized';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { FadeInUp } from '@/components/ui/FadeInUp';
import type { SanityImageSource } from '@sanity/image-url';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.histoire' });
  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, '/notre-histoire'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/notre-histoire`,
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

type Section = {
  heading?: { fr: string; en?: string; de?: string };
  body?: { fr: string; en?: string; de?: string };
  image?: SanityImageSource;
};

type PageData = {
  title?: { fr: string; en?: string; de?: string };
  sections?: Section[];
} | null;

export default async function NotreHistoirePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'histoire' });

  let page: PageData = null;
  try {
    page = (await sanityFetch({
      query: NOTRE_HISTOIRE_QUERY,
      tags: ['page'],
    })) as PageData;
  } catch {
    // Sanity not configured — graceful fallback
  }

  const sections = page?.sections ?? [];

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)]">
      <SectionHeader title={t('title')} jpLabel="私たちの物語" />

      {sections.length > 0 ? (
        <div className="space-y-24">
          {sections.map((section, index) => {
            const isEven = index % 2 === 0;
            const heading = localized(section.heading, locale);
            const body = localized(section.body, locale);

            return (
              <FadeInUp key={index} delay={index * 0.1}>
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                    !isEven ? 'md:grid-flow-col-dense' : ''
                  }`}
                >
                  {/* Photo */}
                  <div
                    className={`aspect-[4/5] relative overflow-hidden ${
                      !isEven ? 'md:order-2' : ''
                    }`}
                  >
                    {section.image ? (
                      <Image
                        src={urlFor(section.image).width(800).auto('format').url()}
                        alt={heading || 'Notre Histoire'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-umai-line" />
                    )}
                  </div>

                  {/* Text */}
                  <div className={!isEven ? 'md:order-1' : ''}>
                    {heading && (
                      <h2 className="font-display text-3xl uppercase tracking-wide mb-4">
                        {heading}
                      </h2>
                    )}
                    {body && (
                      <p className="font-body text-base text-umai-text-muted leading-relaxed">
                        {body}
                      </p>
                    )}
                  </div>
                </div>
              </FadeInUp>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="font-body text-base text-umai-text-muted">
            Notre histoire arrive bientôt...
          </p>
        </div>
      )}

      {/* Final CTA */}
      <div className="text-center py-16 mt-16 border-t border-umai-line">
        <p className="font-body text-base text-umai-text-muted mb-6">
          Venez vivre l&apos;expérience UMAI par vous-même
        </p>
        <Button variant="primary" href="/reservation">
          {t('ctaLabel')}
        </Button>
      </div>
    </div>
  );
}
