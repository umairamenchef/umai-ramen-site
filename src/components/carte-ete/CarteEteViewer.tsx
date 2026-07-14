'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

type Page = { src: string; alt: string; w: number; h: number };

/**
 * Summer-menu image viewer with a tap-to-zoom lightbox. The menu is a dense
 * two-column A-format layout, so on mobile the thumbnails are hard to read —
 * tapping opens a full-screen overlay where the page can be zoomed (tap toggles
 * fit ↔ full resolution, and native pinch-zoom works on top) and panned.
 */
export function CarteEteViewer({
  pages,
  zoomHint,
  closeLabel,
}: {
  pages: Page[];
  zoomHint: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const close = useCallback(() => {
    setOpen(null);
    setZoomed(false);
  }, []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  return (
    <>
      <div className="flex flex-col items-center gap-8 max-w-[880px] mx-auto">
        {pages.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => {
              setOpen(i);
              setZoomed(false);
            }}
            aria-label={zoomHint}
            className="group relative w-full cursor-zoom-in"
          >
            <Image
              src={p.src}
              alt={p.alt}
              width={p.w}
              height={p.h}
              priority={i === 0}
              className="w-full h-auto rounded-lg border border-umai-line shadow-lg"
              sizes="(max-width: 900px) 100vw, 880px"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              {zoomHint}
            </span>
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/90"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="fixed top-4 right-4 z-[71] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
          >
            ✕
          </button>
          <div
            className="h-full w-full overflow-auto flex items-start justify-center p-3 sm:p-6"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pinch-zoom' }}
          >
            {/* Raw <img> so we control zoom sizing precisely; native pinch-zoom
                works on top of the tap-to-toggle fit ↔ full-resolution. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pages[open].src}
              alt={pages[open].alt}
              onClick={(e) => {
                e.stopPropagation();
                setZoomed((z) => !z);
              }}
              className={
                zoomed
                  ? 'max-w-none h-auto cursor-zoom-out'
                  : 'max-h-[92vh] w-auto max-w-full object-contain cursor-zoom-in'
              }
              style={zoomed ? { width: pages[open].w } : undefined}
            />
          </div>
        </div>
      )}
    </>
  );
}
