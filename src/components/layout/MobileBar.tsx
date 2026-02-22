import { useTranslations } from 'next-intl';

const GUSTY_URL =
  'https://gusty.app/booking/1667924751880x258346136410259460?source=SITE';
const UBER_EATS_URL =
  'https://www.ubereats.com/fr/store/umai-ramen/8yLiOMdPVTudC_Pgbe209g';

export function MobileBar() {
  const t = useTranslations('common');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden grid grid-cols-2 h-14">
      <a
        href={GUSTY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center bg-umai-black text-umai-white font-body text-sm font-medium uppercase tracking-widest hover:bg-umai-text-muted transition-colors duration-200"
      >
        {t('reserve')}
      </a>
      <a
        href={UBER_EATS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center bg-umai-accent text-umai-white font-body text-sm font-medium uppercase tracking-widest hover:bg-umai-accent-hover transition-colors duration-200"
      >
        {t('order')}
      </a>
    </div>
  );
}
