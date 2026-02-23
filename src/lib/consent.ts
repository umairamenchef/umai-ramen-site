export const COOKIE_NAME = 'umai_consent';
export const COOKIE_MAX_AGE = 13 * 30 * 24 * 60 * 60; // 13 months in seconds (CNIL maximum)

export type ConsentValue = 'accepted' | 'rejected' | null;

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
  }
}

export function getConsent(): ConsentValue {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split(';')
    .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  const value = cookie.split('=')[1]?.trim();
  if (value === 'accepted') return 'accepted';
  if (value === 'rejected') return 'rejected';
  return null;
}

export function setConsent(value: 'accepted' | 'rejected'): void {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function updateGtagConsent(granted: boolean): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  const value = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

export function trackCTAClick(action: string): void {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: 'cta_click', cta_action: action });
  }
}
