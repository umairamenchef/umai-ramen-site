import { FadeInUp } from '@/components/ui/FadeInUp';
import { Button } from '@/components/ui/Button';

interface HistoireTeaserProps {
  title: string;
  teaser: string;
  ctaLabel: string;
  locale: string;
}

export function HistoireTeaser({ title, teaser, ctaLabel }: HistoireTeaserProps) {
  return (
    <section className="py-[var(--spacing-section)]">
      <FadeInUp>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: decorative image placeholder */}
          <div className="aspect-[4/5] relative overflow-hidden bg-umai-bg-alt">
            {/* Placeholder — owner will add real photo via Sanity */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center opacity-30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="w-16 h-16 mx-auto text-umai-text-muted"
                  aria-hidden="true"
                >
                  <rect x="4" y="4" width="56" height="56" rx="2" />
                  <circle cx="22" cy="22" r="8" />
                  <path d="M4 44 L20 28 L32 40 L44 28 L60 44" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right: text + CTA */}
          <div>
            <h2 className="font-display text-3xl uppercase tracking-wide">
              {title}
            </h2>
            <p className="font-body text-base text-umai-text-muted mt-4">
              {teaser}
            </p>
            <div className="mt-8">
              <Button variant="outline" href="/notre-histoire">
                {ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      </FadeInUp>
    </section>
  );
}
