import { setRequestLocale, getTranslations } from 'next-intl/server';
import { sanityFetch } from '@/sanity/lib/client';
import { GALLERY_QUERY } from '@/sanity/lib/queries';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox';

type Props = {
  params: Promise<{ locale: string }>;
};

type GalleryPhoto = {
  _id: string;
  title?: { fr: string; en?: string; de?: string };
  alt?: { fr: string; en?: string; de?: string };
  image: {
    asset: {
      _id: string;
      url: string;
      metadata: {
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
  };
};

export default async function GaleriePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'gallery' });

  let photos: GalleryPhoto[] = [];
  try {
    const result = await sanityFetch({
      query: GALLERY_QUERY,
      tags: ['gallery'],
    });
    photos = (result as GalleryPhoto[]) ?? [];
  } catch {
    // Sanity not configured — graceful fallback
  }

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)]">
      <SectionHeader
        title={t('title')}
        jpLabel="ギャラリー"
        subtitle={t('subtitle')}
      />
      <GalleryLightbox photos={photos} locale={locale} />
    </div>
  );
}
