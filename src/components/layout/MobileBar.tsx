import { useTranslations } from 'next-intl';

interface MobileBarProps {
  reservationUrl: string;
  uberEatsUrl: string;
}

export function MobileBar({ reservationUrl, uberEatsUrl }: MobileBarProps) {
  const t = useTranslations('common');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden grid grid-cols-2 h-14">
      <a
        href={reservationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center bg-umai-black text-umai-white font-body text-sm font-medium uppercase tracking-widest hover:bg-umai-text-muted transition-colors duration-200"
      >
        {t('reserve')}
      </a>
      <a
        href={uberEatsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center bg-umai-accent text-umai-white font-body text-sm font-medium uppercase tracking-widest hover:bg-umai-accent-hover transition-colors duration-200"
      >
        {t('order')}
      </a>
    </div>
  );
}
