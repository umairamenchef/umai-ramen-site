import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { siteLocaleFor } from '@/i18n/locales';
import { Logo } from '@/components/ui/Logo';
import { OrderButton } from '@/components/order/OrderButton';
import type { OrderUrls } from '@/components/order/OrderModal';
import { NAP } from '@/lib/seo';

interface FooterProps {
  reservationUrl: string;
  orderUrls: OrderUrls;
}

export function Footer({ reservationUrl, orderUrls }: FooterProps) {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');
  // IT/ZH are menu-only: links to non-menu pages go straight to /en (no redirect hop).
  // The « Menu » link carries no locale prop, so it stays on /it/menu or /zh/menu.
  const locale = useLocale();
  const siteLocale = siteLocaleFor(locale);

  return (
    <footer className="bg-umai-black text-umai-bg relative overflow-hidden">
      {/* Decorative seal — bottom right */}
      <img
        src="/seal.svg"
        alt=""
        aria-hidden="true"
        className="absolute bottom-8 right-8 w-36 h-36 opacity-[0.15] invert pointer-events-none select-none"
      />

      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 pt-20 pb-10 relative z-10">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 lg:gap-12 mb-16">
          {/* Column 1: Logo + tagline */}
          <div>
            <Link
              href="/"
              locale={siteLocale}
              className="block mb-4 hover:opacity-70 transition-opacity duration-200"
              aria-label={tCommon('siteTitle')}
            >
              <Logo className="h-10 w-auto text-umai-white" />
            </Link>
            <p className="font-body text-sm tracking-[0.06em] opacity-50">
              Ramen Noodle Bar — Strasbourg
            </p>
          </div>

          {/* Column 2: Contact */}
          <div>
            <h2 className="font-body text-xs uppercase tracking-[0.1em] text-umai-white opacity-60 mb-5">
              {tFooter('contact')}
            </h2>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${NAP.streetAddress} ${NAP.postalCode} ${NAP.addressLocality}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {NAP.streetAddress}
                </a>
              </li>
              <li>
                <span className="font-body text-sm text-umai-bg/60">
                  {NAP.postalCode} {NAP.addressLocality}
                </span>
              </li>
              <li>
                <a
                  href={`tel:${NAP.telephone}`}
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {NAP.telephoneDisplay}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div>
            <h2 className="font-body text-xs uppercase tracking-[0.1em] text-umai-white opacity-60 mb-5">
              {tFooter('navigation')}
            </h2>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/menu"
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {tNav('menu')}
                </Link>
              </li>
              <li>
                <Link
                  href="/notre-histoire"
                  locale={siteLocale}
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {tNav('history')}
                </Link>
              </li>
              <li>
                <a
                  href={reservationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {tCommon('reserve')}
                </a>
              </li>
              <li>
                <OrderButton
                  urls={orderUrls}
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {tCommon('order')}
                </OrderButton>
              </li>
              <li>
                <Link
                  href="/infos"
                  locale={siteLocale}
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {tNav('infos')}
                </Link>
              </li>
              <li>
                <Link
                  href="/galerie"
                  locale={siteLocale}
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  {tNav('gallery')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Social + Legal */}
          <div>
            <h2 className="font-body text-xs uppercase tracking-[0.1em] text-umai-white opacity-60 mb-5">
              {tFooter('followUs')}
            </h2>
            <ul className="space-y-2.5 mb-8">
              <li>
                <a
                  href="https://www.instagram.com/umai_ramen_strasbourg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/UmaiRamenStrasbourg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-umai-bg/60 hover:text-umai-accent transition-colors duration-200"
                >
                  Facebook
                </a>
              </li>
            </ul>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/mentions-legales"
                  locale={siteLocale}
                  className="font-body text-xs text-umai-bg/40 hover:text-umai-accent transition-colors duration-200"
                >
                  {tFooter('legalNotice')}
                </Link>
              </li>
              <li>
                <Link
                  href="/politique-confidentialite"
                  locale={siteLocale}
                  className="font-body text-xs text-umai-bg/40 hover:text-umai-accent transition-colors duration-200"
                >
                  {tFooter('privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/politique-cookies"
                  locale={siteLocale}
                  className="font-body text-xs text-umai-bg/40 hover:text-umai-accent transition-colors duration-200"
                >
                  {tFooter('cookies')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cgv"
                  locale={siteLocale}
                  className="font-body text-xs text-umai-bg/40 hover:text-umai-accent transition-colors duration-200"
                >
                  {tFooter('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-umai-white/10 pt-6 text-center">
          <p className="font-body text-xs text-umai-bg/40">
            {tFooter('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
