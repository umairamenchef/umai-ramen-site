'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const localeLabels: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  de: 'DE',
};

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className={`flex items-center gap-2 font-body text-xs font-medium tracking-widest ${className}`}>
      {routing.locales.map((loc, index) => (
        <span key={loc} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => switchLocale(loc)}
            className={`uppercase transition-colors duration-200 ${
              loc === locale
                ? 'text-umai-accent border-b border-umai-accent'
                : 'text-umai-text-muted hover:text-umai-text'
            }`}
            aria-label={`Switch to ${localeLabels[loc]}`}
            aria-current={loc === locale ? 'true' : undefined}
          >
            {localeLabels[loc]}
          </button>
          {index < routing.locales.length - 1 && (
            <span className="text-umai-line" aria-hidden="true">
              |
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
