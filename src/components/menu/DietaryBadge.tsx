type DietaryBadgeType = 'vegetarian' | 'gluten-free';

interface DietaryBadgeProps {
  type: DietaryBadgeType;
}

export function DietaryBadge({ type }: DietaryBadgeProps) {
  if (type === 'vegetarian') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-body font-medium uppercase tracking-wider rounded-full bg-green-100 text-green-800">
        V
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-body font-medium uppercase tracking-wider rounded-full bg-amber-100 text-amber-800">
      SG
    </span>
  );
}
