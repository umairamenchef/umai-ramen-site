import Image from 'next/image';
import type { SanityImageSource } from '@sanity/image-url';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { urlFor } from '@/sanity/lib/image';

interface GalleryPhoto {
  _id: string;
  title?: string;
  alt?: string;
  image: SanityImageSource;
}

interface GalleryPreviewProps {
  photos: GalleryPhoto[];
  locale: string;
  title: string;
  ctaLabel: string;
}

export function GalleryPreview({ photos, title, ctaLabel }: GalleryPreviewProps) {
  const displayPhotos = photos.slice(0, 6);

  return (
    <section className="py-[var(--spacing-section)]">
      <SectionHeader title={title} centered />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayPhotos.map((photo) => {
          const imageUrl = photo.image
            ? urlFor(photo.image).width(400).auto('format').url()
            : null;

          return (
            <div key={photo._id} className="aspect-[4/3] relative overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={photo.alt ?? photo.title ?? 'UMAI Ramen'}
                  fill
                  className="object-cover object-center hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-umai-bg-alt" />
              )}
            </div>
          );
        })}
      </div>

      {/* CTA link to full gallery */}
      <div className="text-center mt-10">
        <Link
          href="/galerie"
          className="font-body text-sm uppercase tracking-widest text-umai-accent hover:text-umai-accent-hover underline underline-offset-4 transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
