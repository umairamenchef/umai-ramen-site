import { FadeInUp } from '@/components/ui/FadeInUp';
import { Button } from '@/components/ui/Button';

interface SummerBannerProps {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
}

/**
 * Seasonal promo band for the summer menu (Hiyashi Chuka, tsukemen…). Text-only
 * accent band — the summer dishes are not permanent Sanity items, so this is a
 * teaser pointing to the menu rather than a live listing.
 */
export function SummerBanner({ label, title, description, ctaLabel }: SummerBannerProps) {
  return (
    <section className="bg-umai-accent text-white">
      <FadeInUp>
        <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-1">
            <span className="font-body text-xs uppercase tracking-[0.25em] text-white/70">
              {label}
            </span>
            <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wide mt-2">
              {title}
            </h2>
            <p className="font-body text-sm md:text-base text-white/90 leading-relaxed mt-3 max-w-2xl">
              {description}
            </p>
          </div>
          <div className="shrink-0">
            <Button variant="outline-white" href="/carte-ete">
              {ctaLabel}
            </Button>
          </div>
        </div>
      </FadeInUp>
    </section>
  );
}
