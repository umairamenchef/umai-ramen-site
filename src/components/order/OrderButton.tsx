'use client';

import { useState } from 'react';
import { OrderModal, type OrderUrls } from './OrderModal';

/**
 * "Commander" trigger: opens the order-choice modal instead of linking straight
 * to a single channel. `className` fully controls the trigger's look so it can
 * match either a Button (via buttonClasses) or a custom bar/footer cell.
 */
export function OrderButton({
  urls,
  className = '',
  children,
}: {
  urls: OrderUrls;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <OrderModal open={open} onClose={() => setOpen(false)} urls={urls} />
    </>
  );
}
