'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { FULL_SITE_LOCALES, LOCALE_LABELS } from '@/i18n/locales';

interface LanguageSwitcherProps {
  className?: string;
}

// IT/ZH are menu-only: they live in the menu page's MenuLanguageSwitcher, never here
// (a header link to /it or /zh from any other page would redirect away). On /it/menu and
// /zh/menu no button is active, and FR / EN / DE go to /{locale}/menu.
export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className={`flex items-center gap-2 font-body text-xs font-medium tracking-widest ${className}`}>
      {FULL_SITE_LOCALES.map((loc, index) => (
        <span key={loc} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => switchLocale(loc)}
            className={`uppercase transition-colors duration-200 ${
              loc === locale
                ? 'text-umai-accent border-b border-umai-accent'
                : 'text-umai-text-muted hover:text-umai-text'
            }`}
            aria-label={`Switch to ${LOCALE_LABELS[loc]}`}
            aria-current={loc === locale ? 'true' : undefined}
          >
            {LOCALE_LABELS[loc]}
          </button>
          {index < FULL_SITE_LOCALES.length - 1 && (
            <span className="text-umai-line" aria-hidden="true">
              |
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
