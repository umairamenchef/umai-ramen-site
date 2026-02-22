import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10 py-[var(--spacing-section)]">
      <SectionHeader
        title={t('title')}
        jpLabel="うまいラーメン"
        subtitle={t('subtitle')}
        centered
      />
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <Button variant="primary">{tCommon('reserve')}</Button>
        <Button variant="outline">{tCommon('order')}</Button>
      </div>
    </div>
  );
}
