'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type Page = { src: string; alt: string; w: number; h: number };

/**
 * Summer-menu viewer. The menu is a dense two-column A-format layout, so on
 * mobile the thumbnails are hard to read. Tapping a page opens a full-screen
 * viewer with real gesture controls (pinch-to-zoom, drag-to-pan, double-tap),
 * powered by react-zoom-pan-pinch — plus +/−/reset buttons and page nav.
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

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % pages.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + pages.length) % pages.length));
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, pages.length]);

  const ctrlBtn =
    'flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:bg-white/40';

  return (
    <>
      {/* Thumbnails */}
      <div className="flex flex-col items-center gap-8 max-w-[880px] mx-auto">
        {pages.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
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

      {/* Full-screen gesture viewer */}
      {open !== null && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/95" role="dialog" aria-modal="true">
          {/* Top bar */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <span className="text-sm tabular-nums opacity-80">
              {open + 1} / {pages.length}
            </span>
            <button type="button" onClick={close} aria-label={closeLabel} className={ctrlBtn}>
              ✕
            </button>
          </div>

          {/* Zoomable stage */}
          <div className="relative min-h-0 flex-1">
            <TransformWrapper
              key={open}
              minScale={1}
              maxScale={6}
              initialScale={1}
              centerOnInit
              doubleClick={{ mode: 'toggle', step: 2.5 }}
              wheel={{ step: 0.15 }}
              pinch={{ step: 8 }}
              panning={{ velocityDisabled: true }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pages[open].src}
                      alt={pages[open].alt}
                      draggable={false}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </TransformComponent>

                  {/* Prev / next page */}
                  {pages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpen((i) => (i === null ? i : (i - 1 + pages.length) % pages.length))}
                        aria-label="←"
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${ctrlBtn}`}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpen((i) => (i === null ? i : (i + 1) % pages.length))}
                        aria-label="→"
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${ctrlBtn}`}
                      >
                        ›
                      </button>
                    </>
                  )}

                  {/* Zoom controls */}
                  <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/40 p-1.5 backdrop-blur-sm">
                    <button type="button" onClick={() => zoomOut()} aria-label="−" className={ctrlBtn}>
                      −
                    </button>
                    <button type="button" onClick={() => resetTransform()} aria-label="reset" className={`${ctrlBtn} text-sm`}>
                      ⟲
                    </button>
                    <button type="button" onClick={() => zoomIn()} aria-label="+" className={ctrlBtn}>
                      +
                    </button>
                  </div>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}
    </>
  );
}
