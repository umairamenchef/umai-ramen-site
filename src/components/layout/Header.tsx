'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { MobileMenu } from '@/components/layout/MobileMenu';

interface HeaderProps {
  reservationUrl: string;
  uberEatsUrl: string;
}

export function Header({ reservationUrl, uberEatsUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  return (
    <>
      <header className="sticky top-0 z-50 bg-umai-bg/95 backdrop-blur-sm border-b border-umai-line">
        <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between gap-6">
          {/* Left: Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <Link
              href="/menu"
              className="font-body text-sm uppercase tracking-widest font-medium text-umai-text hover:text-umai-accent transition-colors duration-200"
            >
              {tNav('menu')}
            </Link>
            <Link
              href="/notre-histoire"
              className="font-body text-sm uppercase tracking-widest font-medium text-umai-text hover:text-umai-accent transition-colors duration-200"
            >
              {tNav('history')}
            </Link>
            <Link
              href="/infos"
              className="font-body text-sm uppercase tracking-widest font-medium text-umai-text hover:text-umai-accent transition-colors duration-200"
            >
              {tNav('infos')}
            </Link>
          </nav>

          {/* Center: Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className="font-display text-2xl tracking-[0.3em] uppercase text-umai-black hover:text-umai-accent transition-colors duration-200"
              aria-label={tCommon('siteTitle')}
            >
              UMAI
            </Link>
          </div>

          {/* Right: Desktop CTAs + Language Switcher */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <LanguageSwitcher />
            <Button
              variant="outline"
              href={reservationUrl}
              external
              className="py-2 px-5 text-xs"
            >
              {tCommon('reserve')}
            </Button>
            <Button
              variant="primary"
              href={uberEatsUrl}
              external
              className="py-2 px-5 text-xs"
            >
              {tCommon('order')}
            </Button>
          </div>

          {/* Right: Mobile — language switcher + hamburger */}
          <div className="flex md:hidden items-center gap-4 ml-auto">
            <button
              type="button"
              className="flex flex-col items-center justify-center w-10 h-10 gap-1.5 text-umai-text"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="w-6 h-0.5 bg-current" />
              <span className="w-6 h-0.5 bg-current" />
              <span className="w-6 h-0.5 bg-current" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        reservationUrl={reservationUrl}
        uberEatsUrl={uberEatsUrl}
      />
    </>
  );
}
