import { localized } from '@/lib/localized';
import { SUMMER_MENU } from '@/data/summerMenu2026';

function LeafIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 4 13C4 8 7 4 12 3c4 0 7 1 8 2-1 9-5 14-9 15Z" />
      <path d="M8 16c2-4 5-6 8-7" />
    </svg>
  );
}

/**
 * Native, brand-styled render of the summer menu (data in summerMenu2026.ts).
 * Two-column magazine flow on desktop → single column on mobile (reflows, no
 * zoom needed). Server component — 0 client JS.
 */
export function SummerMenu({ locale, vegOption }: { locale: string; vegOption: string }) {
  return (
    <div className="lg:columns-2 lg:gap-x-16">
      {SUMMER_MENU.map((section) => (
        <section key={section.key} className="mb-11 break-inside-avoid">
          <header className="mb-5 text-center">
            <h2 className="font-display text-2xl md:text-3xl tracking-wide text-umai-text">
              {localized(section.title, locale)}
              {section.unit && (
                <span className="ml-2 align-middle font-body text-sm text-umai-text-muted">({section.unit})</span>
              )}
            </h2>
            <div className="mx-auto mt-2 h-0.5 w-10 bg-umai-accent" />
            {section.sub && (
              <p className="mt-2 font-body text-sm italic text-umai-text-muted">
                {localized(section.sub, locale)}
              </p>
            )}
          </header>

          <ul className="space-y-3.5">
            {section.dishes.map((dish) => (
              <li key={dish.name}>
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 font-body font-medium text-umai-text">{dish.name}</span>
                  {dish.price && (
                    <>
                      <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-umai-line" aria-hidden="true" />
                      <span className="shrink-0 whitespace-nowrap font-body text-umai-accent">{dish.price} €</span>
                    </>
                  )}
                </div>
                {dish.portions && (
                  <p className="mt-0.5 font-body text-sm text-umai-text-muted">{dish.portions}</p>
                )}
                {dish.desc && (
                  <p className="mt-0.5 font-body text-sm italic text-umai-text-muted">{dish.desc}</p>
                )}
                {dish.veg && (
                  <p className="mt-1 inline-flex items-center gap-1.5 font-body text-xs text-umai-accent">
                    <LeafIcon />
                    {vegOption}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
