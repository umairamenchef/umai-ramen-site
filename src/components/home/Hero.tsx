import Image from 'next/image';
import type { SanityImageSource } from '@sanity/image-url';
import { Button } from '@/components/ui/Button';
import { urlFor } from '@/sanity/lib/image';

interface HeroProps {
  catchphrase: string;
  reservationUrl: string;
  uberEatsUrl: string;
  heroImage?: SanityImageSource;
  reserveLabel: string;
  orderLabel: string;
}

export function Hero({
  catchphrase,
  reservationUrl,
  uberEatsUrl,
  heroImage,
  reserveLabel,
  orderLabel,
}: HeroProps) {
  const imageUrl = heroImage
    ? urlFor(heroImage).width(1920).height(1080).auto('format').url()
    : null;

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center">
      {/* Background image or fallback */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="UMAI Ramen — ambiance"
          fill
          // preload (not priority) — preferred approach in Next.js 16
          loading="eager"
          className="object-cover object-center"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-umai-black" aria-hidden="true" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <h1
          className="font-display text-4xl sm:text-5xl md:text-7xl uppercase tracking-[0.1em] text-white"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
        >
          {catchphrase}
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button variant="primary" href={reservationUrl} external>
            {reserveLabel}
          </Button>
          <Button variant="outline-white" href={uberEatsUrl} external>
            {orderLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
