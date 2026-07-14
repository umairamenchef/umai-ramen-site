import Image from 'next/image';
import { FadeInUp } from '@/components/ui/FadeInUp';
import { Button } from '@/components/ui/Button';

interface SignatureSectionProps {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  price?: number;
}

/**
 * Signature-dish showcase (the Tantan). Full-width band with a large editorial
 * photo (public/signature-tantan.jpg) beside the pitch. Price is optional and
 * fed live from Sanity so it stays in sync with the menu.
 */
export function SignatureSection({
  label,
  title,
  description,
  ctaLabel,
  price,
}: SignatureSectionProps) {
  return (
    <section className="bg-umai-bg border-y border-umai-line">
      <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
        {/* Image */}
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[520px]">
          <Image
            src="/signature-tantan.jpg"
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Text */}
        <FadeInUp>
          <div className="flex flex-col justify-center h-full px-6 py-16 lg:px-16">
            <span className="font-body text-xs uppercase tracking-[0.25em] text-umai-accent">
              {label}
            </span>
            <h2 className="font-display text-4xl md:text-5xl uppercase tracking-wide mt-3">
              {title}
            </h2>
            <p className="font-body text-base text-umai-text-muted leading-relaxed mt-5 max-w-md">
              {description}
            </p>
            <div className="flex items-center gap-6 mt-8">
              <Button variant="outline" href="/menu">
                {ctaLabel}
              </Button>
              {typeof price === 'number' && (
                <span className="font-display text-2xl text-umai-text">
                  {price.toFixed(2).replace('.', ',')} €
                </span>
              )}
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
