import Image from 'next/image';
import type { SanityImageSource } from '@sanity/image-url';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { urlFor } from '@/sanity/lib/image';
import { localized } from '@/lib/localized';

interface MenuCategory {
  _id: string;
  name: { fr: string; en?: string; de?: string } | string;
  slug: { current: string };
  image?: SanityImageSource;
}

interface MenuPreviewProps {
  categories: MenuCategory[];
  locale: string;
  title: string;
  ctaLabel: string;
}

export function MenuPreview({ categories, locale, title, ctaLabel }: MenuPreviewProps) {
  return (
    <section className="py-[var(--spacing-section)]">
      <SectionHeader title={title} centered />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const imageUrl = category.image
            ? urlFor(category.image).width(600).auto('format').url()
            : null;

          const categoryName =
            typeof category.name === 'string'
              ? category.name
              : localized(category.name, locale);

          return (
            <Link
              key={category._id}
              href="/menu"
              scroll={false}
            >
              <div className="relative aspect-[4/3] overflow-hidden group">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={categoryName}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-umai-bg-alt" />
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                {/* Category name */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="font-display text-2xl text-white uppercase tracking-wide">
                    {categoryName}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA below grid */}
      <div className="text-center mt-10">
        <Link
          href="/menu"
          className="font-body text-sm uppercase tracking-widest text-umai-accent hover:text-umai-accent-hover border-b border-umai-accent pb-0.5 transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
