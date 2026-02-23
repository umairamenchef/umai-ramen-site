import { setRequestLocale, getTranslations } from 'next-intl/server';
import { sanityFetch } from '@/sanity/lib/client';
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';

type Props = {
  params: Promise<{ locale: string }>;
};

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

type SiteSettings = {
  reservationUrl?: string;
  phone?: string;
  address?: Address;
  openingHours?: OpeningHour[];
} | null;

export default async function ReservationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'reservation' });

  let settings: SiteSettings = null;
  try {
    settings = (await sanityFetch({
      query: SITE_SETTINGS_QUERY,
      tags: ['siteSettings'],
    })) as SiteSettings;
  } catch {
    // Sanity not configured — graceful fallback
  }

  const reservationUrl = settings?.reservationUrl ?? '#';
  const phone = settings?.phone;
  const address = settings?.address;
  const openingHours = settings?.openingHours ?? [];

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)]">
      {/* Section 1 — Hero CTA */}
      <div className="text-center mb-24">
        <SectionHeader title={t('title')} jpLabel="予約" />
        <div className="mt-8">
          <Button variant="primary" href={reservationUrl} external>
            {t('ctaLabel')}
          </Button>
          <p className="font-body text-sm text-umai-text-muted text-center mt-3">
            {t('microCopy')}
          </p>
        </div>
      </div>

      {/* Section 2 — Practical Info */}
      <section>
        <SectionHeader title={t('practicalInfoTitle')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left column — hours, phone, address */}
          <div className="space-y-10">
            {/* Opening hours */}
            <div>
              <h3 className="font-display text-xl uppercase tracking-wide mb-4">
                {t('hoursTitle')}
              </h3>
              {openingHours.length > 0 ? (
                <div className="space-y-2">
                  {openingHours.map((entry, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-umai-line last:border-0">
                      <span className="font-body text-sm font-medium">{entry.day}</span>
                      <span className="font-body text-sm text-umai-text-muted">
                        {entry.periods && entry.periods.length > 0
                          ? entry.periods
                              .map((p) => `${p.open} - ${p.close}`)
                              .join(', ')
                          : 'Fermé'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-umai-text-muted">
                  Mar – Sam : 12h00 – 14h00, 19h00 – 22h00
                </p>
              )}
            </div>

            {/* Phone */}
            {phone && (
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide mb-4">
                  {t('phoneTitle')}
                </h3>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="font-body text-base text-umai-accent hover:underline"
                >
                  {phone}
                </a>
              </div>
            )}

            {/* Address */}
            {address && (
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide mb-4">
                  {t('addressTitle')}
                </h3>
                <p className="font-body text-base text-umai-text-muted">
                  {address.street && <>{address.street}<br /></>}
                  {address.postalCode} {address.city}
                </p>
              </div>
            )}

            {!address && (
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide mb-4">
                  {t('addressTitle')}
                </h3>
                <p className="font-body text-base text-umai-text-muted">
                  5 rue des Orphelins<br />
                  67000 Strasbourg
                </p>
              </div>
            )}
          </div>

          {/* Right column — Google Maps */}
          <div>
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
        </div>
      </section>
    </div>
  );
}
