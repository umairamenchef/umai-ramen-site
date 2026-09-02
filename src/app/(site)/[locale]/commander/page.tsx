import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/client';
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { FadeInUp } from '@/components/ui/FadeInUp';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.commander' });
  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, '/commander'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/commander`,
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

type SiteSettings = {
  uberEatsUrl?: string;
  eazeeLinkUrl?: string;
} | null;

function DeliveryIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto text-umai-accent"
      aria-hidden="true"
    >
      <path
        d="M6 34V18L18 10H42V34H36M6 34H12M36 34H30M12 34C12 36.2091 13.7909 38 16 38C18.2091 38 20 36.2091 20 34C20 31.7909 18.2091 30 16 30C13.7909 30 12 31.7909 12 34ZM30 34C30 36.2091 31.7909 38 34 38C36.2091 38 38 36.2091 38 34C38 31.7909 36.2091 30 34 30C31.7909 30 30 31.7909 30 34Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 10V24H42"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto text-umai-accent"
      aria-hidden="true"
    >
      <path
        d="M10 14H38M10 24H38M10 34H28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="34" r="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M38 31V34L40 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function CommanderPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'commander' });

  let settings: SiteSettings = null;
  try {
    settings = (await sanityFetch({
      query: SITE_SETTINGS_QUERY,
      tags: ['siteSettings'],
    })) as SiteSettings;
  } catch {
    // Sanity not configured — graceful fallback
  }

  const uberEatsUrl = settings?.uberEatsUrl ?? '#';
  const eazeeLinkUrl = settings?.eazeeLinkUrl ?? '#';

  const cards = [
    {
      icon: <DeliveryIcon />,
      title: t('uberEatsTitle'),
      desc: t('uberEatsDesc'),
      url: uberEatsUrl,
      variant: 'primary' as const,
    },
    {
      icon: <MenuIcon />,
      title: t('eazeeLinkTitle'),
      desc: t('eazeeLinkDesc'),
      url: eazeeLinkUrl,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)]">
      <SectionHeader
        title={t('title')}
        jpLabel="注文"
        subtitle={t('subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        {cards.map((card, i) => (
          <FadeInUp key={card.title} delay={i * 0.1}>
            <div className="border border-umai-line p-8 text-center flex flex-col items-center gap-4 h-full">
              {card.icon}
              <h3 className="font-display text-xl uppercase tracking-wide mt-2">
                {card.title}
              </h3>
              <p className="font-body text-sm text-umai-text-muted flex-1">
                {card.desc}
              </p>
              {card.url ? (
                <Button variant={card.variant} href={card.url} external>
                  {t('ctaLabel')}
                </Button>
              ) : (
                <span className="font-body text-sm text-umai-text-muted italic">
                  Bientôt disponible
                </span>
              )}
            </div>
          </FadeInUp>
        ))}
      </div>
    </div>
  );
}
