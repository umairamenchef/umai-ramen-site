import { useTranslations } from 'next-intl';
import { OrderButton } from '@/components/order/OrderButton';
import type { OrderUrls } from '@/components/order/OrderModal';

interface MobileBarProps {
  reservationUrl: string;
  orderUrls: OrderUrls;
}

export function MobileBar({ reservationUrl, orderUrls }: MobileBarProps) {
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
      <OrderButton
        urls={orderUrls}
        className="flex items-center justify-center bg-umai-accent text-umai-white font-body text-sm font-medium uppercase tracking-widest hover:bg-umai-accent-hover transition-colors duration-200"
      >
        {t('order')}
      </OrderButton>
    </div>
  );
}
