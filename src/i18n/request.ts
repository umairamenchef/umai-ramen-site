import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { isMenuOnlyLocale, mergeMessages, type MessageTree } from './locales';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }
  const own = (await import(`../messages/${locale}.json`)).default;
  if (!isMenuOnlyLocale(locale)) {
    // FR / EN / DE: the file as is.
    return { locale, messages: own };
  }
  // IT/ZH: English underneath, the IT/ZH file wins key by key (site chrome falls back to EN, never to a raw key)
  const base = (await import('../messages/en.json')).default;
  return {
    locale,
    messages: mergeMessages(base as MessageTree, own as MessageTree),
  };
});
