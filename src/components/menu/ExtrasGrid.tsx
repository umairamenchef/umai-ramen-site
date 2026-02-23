import { localized } from '@/lib/localized';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface Extra {
  _id: string;
  name: { fr: string; en?: string; de?: string };
  price: number;
}

interface ExtrasGridProps {
  extras: Extra[];
  locale: string;
  title: string;
}

export function ExtrasGrid({ extras, locale, title }: ExtrasGridProps) {
  if (!extras || extras.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeader title={title} centered={false} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {extras.map((extra) => (
          <div
            key={extra._id}
            className="bg-white/50 p-4 text-center border border-umai-line"
          >
            <span className="font-body text-sm font-medium block">
              {localized(extra.name, locale)}
            </span>
            <span className="font-body text-sm text-umai-text-muted block mt-1">
              {extra.price.toFixed(2).replace('.', ',')} &euro;
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
