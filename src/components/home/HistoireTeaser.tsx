import Image from 'next/image';
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
          {/* Left: story photo */}
          <div className="aspect-[4/5] relative overflow-hidden bg-umai-bg-alt">
            <Image
              src="/histoire-teaser.jpg"
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
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
