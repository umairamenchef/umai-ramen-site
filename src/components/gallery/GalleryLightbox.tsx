'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { urlFor } from '@/sanity/lib/image';
import { localized } from '@/lib/localized';

type LocaleString = {
  fr: string;
  en?: string;
  de?: string;
};

type GalleryPhoto = {
  _id: string;
  title?: LocaleString;
  alt?: LocaleString;
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

interface GalleryLightboxProps {
  photos: GalleryPhoto[];
  locale: string;
}

export function GalleryLightbox({ photos, locale }: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = photos.map((photo) => ({
    src: `${photo.image.asset.url}?auto=format&w=1600`,
    width: photo.image.asset.metadata.dimensions.width,
    height: photo.image.asset.metadata.dimensions.height,
    alt: localized(photo.alt, locale) || localized(photo.title, locale) || 'UMAI Ramen',
  }));

  if (photos.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="font-body text-base text-umai-text-muted">
          La galerie arrive bientôt...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, i) => {
          const thumbnailUrl = urlFor(photo.image).width(600).auto('format').url();
          const altText = localized(photo.alt, locale) || localized(photo.title, locale) || 'UMAI Ramen';

          return (
            <button
              key={photo._id}
              onClick={() => {
                setIndex(i);
                setOpen(true);
              }}
              className="aspect-[4/3] relative overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-umai-accent focus:ring-offset-2"
              aria-label={`Voir la photo : ${altText}`}
              type="button"
            >
              <Image
                src={thumbnailUrl}
                alt={altText}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </button>
          );
        })}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
      />
    </>
  );
}
