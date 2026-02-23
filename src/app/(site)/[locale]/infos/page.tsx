import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/client';
import { INFOS_QUERY } from '@/sanity/lib/queries';
import { BASE_URL, OG_IMAGE, buildAlternates } from '@/lib/seo';
import { SectionHeader } from '@/components/ui/SectionHeader';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.infos' });
  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, '/infos'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/infos`,
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

type OpeningHourPeriod = {
  open: string;
  close: string;
};

type OpeningHour = {
  day: string;
  periods?: OpeningHourPeriod[];
};

type Address = {
  street?: string;
  postalCode?: string;
  city?: string;
};

type SocialLinks = {
  instagram?: string;
  facebook?: string;
};

type InfosData = {
  phone?: string;
  address?: Address;
  openingHours?: OpeningHour[];
  socialLinks?: SocialLinks;
} | null;

function InstagramIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function InfosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'infos' });

  let settings: InfosData = null;
  try {
    settings = (await sanityFetch({
      query: INFOS_QUERY,
      tags: ['siteSettings'],
    })) as InfosData;
  } catch {
    // Sanity not configured — graceful fallback
  }

  const phone = settings?.phone;
  const address = settings?.address;
  const openingHours = settings?.openingHours ?? [];
  const socialLinks = settings?.socialLinks;

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)]">
      {/* Section 1 — Opening Hours */}
      <section className="mb-20">
        <SectionHeader title={t('hoursTitle')} jpLabel="営業時間" />
        {openingHours.length > 0 ? (
          <div className="max-w-md mx-auto">
            {openingHours.map((entry, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-umai-line last:border-0">
                <span className="font-body text-sm font-medium">{entry.day}</span>
                <span className="font-body text-sm text-umai-text-muted">
                  {entry.periods && entry.periods.length > 0
                    ? entry.periods.map((p) => `${p.open} - ${p.close}`).join(', ')
                    : 'Fermé'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Static fallback hours */}
            {[
              { day: 'Lundi', closed: true },
              { day: 'Mardi', hours: '12:00 - 14:00, 19:00 - 22:00' },
              { day: 'Mercredi', hours: '12:00 - 14:00, 19:00 - 22:00' },
              { day: 'Jeudi', hours: '12:00 - 14:00, 19:00 - 22:00' },
              { day: 'Vendredi', hours: '12:00 - 14:00, 19:00 - 22:30' },
              { day: 'Samedi', hours: '12:00 - 14:30, 19:00 - 22:30' },
              { day: 'Dimanche', closed: true },
            ].map((entry, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-umai-line last:border-0">
                <span className="font-body text-sm font-medium">{entry.day}</span>
                <span className="font-body text-sm text-umai-text-muted">
                  {'closed' in entry && entry.closed ? 'Fermé' : 'hours' in entry ? entry.hours : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Address + Map */}
      <section className="mb-20">
        <SectionHeader title={t('addressTitle')} jpLabel="住所" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="font-body text-base text-umai-text-muted">
              {address?.street ? (
                <>
                  {address.street}<br />
                  {address.postalCode} {address.city}
                </>
              ) : (
                <>
                  5 rue des Orphelins<br />
                  67000 Strasbourg
                </>
              )}
            </p>
          </div>
          <div className="aspect-[16/9] w-full rounded overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2638.93!2d7.7456!3d48.5808!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4796c849b5b0c3e1%3A0x0!2s5%20Rue%20des%20Orphelins%2C%2067000%20Strasbourg!5e0!3m2!1sfr!2sfr!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              title="UMAI Ramen — 5 rue des Orphelins, Strasbourg"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — Phone */}
      {phone && (
        <section className="mb-20">
          <SectionHeader title={t('phoneTitle')} jpLabel="電話" />
          <div className="text-center">
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="font-body text-lg text-umai-accent hover:underline"
            >
              {phone}
            </a>
          </div>
        </section>
      )}

      {/* Section 4 — FAQ */}
      <section className="mb-20">
        <SectionHeader title={t('faqTitle')} jpLabel="よくある質問" />
        <div className="max-w-2xl mx-auto space-y-1">
          <details className="group border-b border-umai-line">
            <summary className="font-body text-sm font-medium cursor-pointer py-4 list-none flex items-center justify-between hover:text-umai-accent transition-colors">
              {t('faqAllergens')}
              <span className="text-umai-text-muted group-open:rotate-180 transition-transform text-lg leading-none">↓</span>
            </summary>
            <p className="font-body text-sm text-umai-text-muted pb-4 pl-4 leading-relaxed">
              {t('faqAllergensAnswer')}
            </p>
          </details>
          <details className="group border-b border-umai-line">
            <summary className="font-body text-sm font-medium cursor-pointer py-4 list-none flex items-center justify-between hover:text-umai-accent transition-colors">
              {t('faqGroups')}
              <span className="text-umai-text-muted group-open:rotate-180 transition-transform text-lg leading-none">↓</span>
            </summary>
            <p className="font-body text-sm text-umai-text-muted pb-4 pl-4 leading-relaxed">
              {t('faqGroupsAnswer')}
            </p>
          </details>
          <details className="group border-b border-umai-line">
            <summary className="font-body text-sm font-medium cursor-pointer py-4 list-none flex items-center justify-between hover:text-umai-accent transition-colors">
              {t('faqVegetarian')}
              <span className="text-umai-text-muted group-open:rotate-180 transition-transform text-lg leading-none">↓</span>
            </summary>
            <p className="font-body text-sm text-umai-text-muted pb-4 pl-4 leading-relaxed">
              {t('faqVegetarianAnswer')}
            </p>
          </details>
        </div>
      </section>

      {/* Section 5 — Contact / Social */}
      {(socialLinks?.instagram || socialLinks?.facebook) && (
        <section className="mb-20">
          <SectionHeader title={t('contactTitle')} jpLabel="連絡先" />
          <div className="flex justify-center gap-8">
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-umai-text-muted hover:text-umai-accent transition-colors flex items-center gap-2 font-body text-sm"
                aria-label="Instagram"
              >
                <InstagramIcon />
                Instagram
              </a>
            )}
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-umai-text-muted hover:text-umai-accent transition-colors flex items-center gap-2 font-body text-sm"
                aria-label="Facebook"
              >
                <FacebookIcon />
                Facebook
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
