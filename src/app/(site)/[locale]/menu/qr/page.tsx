import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { DEFAULT_LOCALE, LOCALES, MENU_ONLY_LOCALES, isMenuOnlyLocale } from '@/i18n/locales';
import {
  QR_LOCALES,
  QR_LABELS,
  QR_PDFS,
  QR_TENT_BLEED_MM,
  QR_TENT_VARIANTS,
  qrAssetPath,
  qrDisplayUrl,
  qrLabelLang,
  qrMenuUrl,
} from '@/lib/qr';
import { buttonClasses } from '@/components/ui/Button';

type Props = {
  params: Promise<{ locale: string }>;
};

// /menu/qr is a menu path: all five locales, same prerender rule as the menu page
// (src/app/(site)/[locale]/menu/page.tsx: it/zh come from the default-locale branch).
export function generateStaticParams({ params }: { params?: { locale?: string } } = {}) {
  const parent = params?.locale;
  if (!parent) return LOCALES.map((locale) => ({ locale }));
  if (parent !== DEFAULT_LOCALE) return [{ locale: parent }];
  return [{ locale: parent }, ...MENU_ONLY_LOCALES.map((locale) => ({ locale }))];
}

// QR-04: tool page for EK/Loan: never indexed, no hreflang, never listed in sitemap.ts.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.qrPage' });
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

/** Name proposed by the browser for a download: the last segment of the public path. */
function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

// Every URL, file and label comes from src/lib/qr.ts (the files of public/qr/ are written
// by scripts/qr/generate.mjs and scripts/qr/print.mjs from the same module).
export default async function MenuQrPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'qrPage' });
  // it/zh have no qrPage strings: the Phase 13 merge serves English.
  const contentLang = isMenuOnlyLocale(locale) ? 'en' : undefined;

  return (
    <div
      lang={contentLang}
      className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)] overflow-x-clip"
    >
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl md:text-5xl uppercase tracking-[0.08em] leading-tight mb-4">
          {t('title')}
        </h1>
        <div className="mx-auto mb-4 w-20 border-t-2 border-dashed border-umai-line-dotted" />
        <p className="mx-auto max-w-2xl font-body text-base text-umai-text-muted">{t('intro')}</p>
      </div>

      <section aria-labelledby="qr-codes-heading">
        <h2 id="qr-codes-heading" className="sr-only">
          {t('codesHeading')}
        </h2>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {QR_LOCALES.map((l) => {
            const svg = qrAssetPath(l, 'svg');
            const png = qrAssetPath(l, 'png');
            return (
              <li
                key={l}
                data-qr-card={l}
                className="rounded-lg border border-umai-line bg-white p-5 text-center"
              >
                <h3 lang={qrLabelLang(l)} className="mb-3 font-body text-lg font-semibold">
                  {QR_LABELS[l]}
                </h3>
                <img
                  src={svg}
                  width={176}
                  height={176}
                  alt={t('qrAlt', { url: qrDisplayUrl(l) })}
                  className="mx-auto block h-44 w-44"
                />
                <a
                  href={qrMenuUrl(l)}
                  className="mt-3 inline-block break-all font-body text-sm text-umai-text-muted underline underline-offset-4"
                >
                  {qrDisplayUrl(l)}
                </a>
                <div className="mt-4 flex justify-center gap-3">
                  <a
                    href={svg}
                    download={fileName(svg)}
                    aria-label={t('downloadSvgLabel', { label: QR_LABELS[l] })}
                    className={buttonClasses('outline')}
                  >
                    SVG
                  </a>
                  <a
                    href={png}
                    download={fileName(png)}
                    aria-label={t('downloadPngLabel', { label: QR_LABELS[l] })}
                    className={buttonClasses('outline')}
                  >
                    PNG
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-center font-body text-sm text-umai-text-muted">{t('formatsHint')}</p>
      </section>

      <section aria-labelledby="qr-print-heading" className="mt-16">
        <h2
          id="qr-print-heading"
          className="mb-8 text-center font-display text-2xl md:text-3xl uppercase tracking-[0.08em]"
        >
          {t('printHeading')}
        </h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <li data-qr-pdf="a4" className="rounded-lg border border-umai-line bg-white p-6 text-center">
            <a href={QR_PDFS.a4} download={fileName(QR_PDFS.a4)} className={buttonClasses('primary', 'w-full')}>
              {t('a4')}
            </a>
            <p className="mt-3 font-body text-sm text-umai-text-muted">{t('a4Hint')}</p>
          </li>
          <li data-qr-pdf="tent" className="rounded-lg border border-umai-line bg-white p-6 text-center">
            <a
              href={QR_PDFS.tent}
              download={fileName(QR_PDFS.tent)}
              className={buttonClasses('primary', 'w-full')}
            >
              {t('tent')}
            </a>
            <p className="mt-3 font-body text-sm text-umai-text-muted">{t('tentHint')}</p>
            {/* Exaprint wants the finished size plus the bleed of the product ordered: the
                same card with the other bleeds of QR_TENT_VARIANTS. */}
            <p className="mt-4 font-body text-sm text-umai-text-muted">
              {t('tentVariantsHint', { defaultMm: QR_TENT_BLEED_MM })}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              {QR_TENT_VARIANTS.map((variant) => (
                <a
                  key={variant.path}
                  href={variant.path}
                  download={fileName(variant.path)}
                  data-qr-pdf-variant={variant.bleedMm}
                  className={buttonClasses('outline')}
                >
                  {t('tentVariant', { mm: variant.bleedMm })}
                </a>
              ))}
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
