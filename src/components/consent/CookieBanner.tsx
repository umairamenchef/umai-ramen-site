'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getConsent, setConsent, updateGtagConsent } from '@/lib/consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('consent');

  useEffect(() => {
    const existing = getConsent();
    if (existing === null) {
      setVisible(true);
      // Small delay so the slide-up animation is visible
      requestAnimationFrame(() => setMounted(true));
    } else if (existing === 'accepted') {
      // Restore consent on return visits
      updateGtagConsent(true);
    }
  }, []);

  function handleChoice(accepted: boolean) {
    setConsent(accepted ? 'accepted' : 'rejected');
    updateGtagConsent(accepted);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-umai-line/20 bg-umai-black text-umai-bg transition-transform duration-500 ease-out"
      style={{
        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
      }}
      role="dialog"
      aria-label={t('message')}
    >
      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-4 flex flex-col sm:flex-row items-center gap-4">
        <p className="font-body text-sm text-umai-bg/80 flex-1 text-center sm:text-left">
          {t('message')}{' '}
          <Link
            href="/politique-cookies"
            className="underline hover:text-umai-accent transition-colors"
          >
            {t('moreInfo')}
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => handleChoice(false)}
            className="px-6 py-2.5 min-w-[120px] border border-umai-bg text-umai-bg font-body text-sm tracking-wide hover:bg-umai-bg/10 transition-colors duration-200"
          >
            {t('reject')}
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="px-6 py-2.5 min-w-[120px] bg-umai-accent text-white font-body text-sm tracking-wide hover:bg-umai-accent/90 transition-colors duration-200"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
