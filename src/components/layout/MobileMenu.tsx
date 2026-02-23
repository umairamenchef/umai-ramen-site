'use client';

import { useEffect } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  reservationUrl: string;
  uberEatsUrl: string;
}

export function MobileMenu({ isOpen, onClose, reservationUrl, uberEatsUrl }: MobileMenuProps) {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const navLinks = [
    { label: tNav('menu'), href: '/menu' },
    { label: tNav('history'), href: '/notre-histoire' },
    { label: tNav('gallery'), href: '/galerie' },
    { label: tNav('infos'), href: '/infos' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <m.nav
          className="fixed inset-0 z-40 bg-umai-bg flex flex-col overflow-y-auto"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          aria-label="Mobile navigation menu"
        >
          {/* Header bar with close button */}
          <div className="flex items-center justify-between px-6 h-20 border-b border-umai-line flex-shrink-0">
            <span className="font-display text-2xl tracking-[0.3em] uppercase text-umai-black">
              UMAI
            </span>
            <button
              type="button"
              className="flex flex-col items-center justify-center w-10 h-10 gap-1.5 text-umai-text"
              onClick={onClose}
              aria-label="Close menu"
            >
              <span className="w-6 h-0.5 bg-current rotate-45 translate-y-1" />
              <span className="w-6 h-0.5 bg-current -rotate-45 -translate-y-1" />
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 px-6 pt-12 pb-8">
            <ul className="space-y-8 mb-12">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-display text-3xl uppercase tracking-[0.08em] text-umai-text hover:text-umai-accent transition-colors duration-200"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="flex flex-col gap-4 mb-10">
              <Button
                variant="primary"
                href={reservationUrl}
                external
                className="w-full justify-center"
              >
                {tCommon('reserve')}
              </Button>
              <Button
                variant="outline"
                href={uberEatsUrl}
                external
                className="w-full justify-center"
              >
                {tCommon('order')}
              </Button>
            </div>

            {/* Language switcher */}
            <LanguageSwitcher />
          </div>
        </m.nav>
      )}
    </AnimatePresence>
  );
}
