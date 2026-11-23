import { useTranslations } from 'next-intl';

type DietaryBadgeType = 'vegetarian' | 'gluten-free';

interface DietaryBadgeProps {
  type: DietaryBadgeType;
}

/** Short dietary marker from menu.diet.* (« V », « SG » / « GF », « 素 »…), full name for screen readers and as tooltip. */
export function DietaryBadge({ type }: DietaryBadgeProps) {
  const t = useTranslations('menu');
  const vegetarian = type === 'vegetarian';
  const short = t(vegetarian ? 'diet.vegetarian' : 'diet.glutenFree');
  const label = t(vegetarian ? 'diet.vegetarianLabel' : 'diet.glutenFreeLabel');

  // The plain <span> carries no ARIA naming attribute (ARIA prohibits naming generic
  // elements): the visually hidden full name gives the accessible name, and the short
  // marker is hidden from assistive technology.
  // Chinese markers (素, 无麸质) get 12 px: CJK glyphs are hard to read at 10 px on a phone.
  return (
    <span
      title={label}
      className={`inline-flex items-center px-2 py-0.5 text-[10px] [&:lang(zh-Hans)]:text-[12px] font-body font-medium uppercase tracking-wider rounded-full ${
        vegetarian ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      <span aria-hidden="true">{short}</span>
      <span className="sr-only normal-case">{label}</span>
    </span>
  );
}
