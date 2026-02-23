import { localized } from '@/lib/localized';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface Formule {
  _id: string;
  name: { fr: string; en?: string; de?: string };
  price: number;
  description?: { fr: string; en?: string; de?: string } | null;
  includedItems?: string[] | null;
}

interface FormulesSectionProps {
  formules: Formule[];
  locale: string;
  title: string;
  includesLabel: string;
}

export function FormulesSection({
  formules,
  locale,
  title,
  includesLabel,
}: FormulesSectionProps) {
  if (!formules || formules.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeader title={title} centered={false} />
      {formules.map((formule) => (
        <div
          key={formule._id}
          className="border border-dashed border-umai-accent p-8 mb-6"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-display text-2xl uppercase tracking-wide">
              {localized(formule.name, locale)}
            </h3>
            <span className="font-body text-lg font-medium tabular-nums">
              {formule.price.toFixed(2).replace('.', ',')} &euro;
            </span>
          </div>
          {formule.description && (
            <p className="font-body text-sm text-umai-text-muted mt-2">
              {localized(formule.description, locale)}
            </p>
          )}
          {formule.includedItems && formule.includedItems.length > 0 && (
            <>
              <p className="font-body text-xs uppercase tracking-widest text-umai-text-muted mt-4 mb-2">
                {includesLabel}
              </p>
              <ul className="mt-2">
                {formule.includedItems.map((item, index) => (
                  <li key={index} className="font-body text-sm flex items-start gap-2">
                    <span className="text-umai-accent mt-0.5">&#x2022;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
