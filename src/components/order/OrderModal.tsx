'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export type OrderUrls = {
  uberEats?: string | null;
  obypay?: string | null;
};

/**
 * Order-choice modal: lets the visitor pick a channel (delivery / takeaway).
 * Options with no configured URL are hidden.
 */
export function OrderModal({
  open,
  onClose,
  urls,
}: {
  open: boolean;
  onClose: () => void;
  urls: OrderUrls;
}) {
  const t = useTranslations('orderModal');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const valid = (u?: string | null) => !!u && u !== '#';
  const options = [
    valid(urls.uberEats) && { href: urls.uberEats!, label: t('delivery'), desc: t('deliveryDesc'), icon: '🛵' },
    valid(urls.obypay) && { href: urls.obypay!, label: t('takeaway'), desc: t('takeawayDesc'), icon: '🥡' },
  ].filter(Boolean) as { href: string; label: string; desc: string; icon: string }[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-umai-bg p-6 sm:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full text-umai-text-muted hover:text-umai-text"
        >
          ✕
        </button>
        <h2 className="text-center font-display text-2xl text-umai-text">{t('title')}</h2>
        <div className="mx-auto mb-6 mt-2 h-0.5 w-12 bg-umai-accent" />
        <div className="flex flex-col gap-3">
          {options.map((o) => (
            <a
              key={o.label}
              href={o.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[64px] items-center gap-4 rounded-xl border border-umai-line bg-white/60 px-5 py-4 transition-colors hover:bg-umai-accent hover:text-white"
            >
              <span className="text-2xl" aria-hidden>{o.icon}</span>
              <span className="flex flex-col">
                <span className="font-body text-sm font-semibold uppercase tracking-wider">{o.label}</span>
                <span className="text-xs text-umai-text-muted group-hover:text-white/80">{o.desc}</span>
              </span>
              <span className="ml-auto opacity-40 transition-opacity group-hover:opacity-100" aria-hidden>→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
