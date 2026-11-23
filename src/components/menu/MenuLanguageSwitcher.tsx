import { LOCALES, LOCALE_LABELS, LOCALE_NAMES, htmlLang } from '@/i18n/locales';

interface MenuLanguageSwitcherProps {
  locale: string;
  label: string;
  className?: string;
}

/** I18N-04: FR · EN · DE · IT · 中文 at the top of the menu page. Plain links (full navigation, no JS) keep the tourist on the menu. */
export function MenuLanguageSwitcher({ locale, label, className = '' }: MenuLanguageSwitcherProps) {
  return (
    <nav aria-label={label} data-menu-locale-switcher="" className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {LOCALES.map((loc) => {
          const active = loc === locale;
          return (
            <li key={loc}>
              <a
                href={`/${loc}/menu`}
                hrefLang={htmlLang(loc)}
                lang={htmlLang(loc)}
                title={LOCALE_NAMES[loc]}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 font-body text-sm font-medium tracking-wider transition-colors duration-200 ${
                  active
                    ? 'border-umai-text bg-umai-text text-umai-bg'
                    : 'border-umai-line text-umai-text hover:border-umai-text'
                }`}
              >
                {LOCALE_LABELS[loc]}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
