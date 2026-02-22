interface SectionHeaderProps {
  title: string;
  jpLabel?: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({
  title,
  jpLabel,
  subtitle,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={`mb-16 ${centered ? 'text-center' : ''}`}>
      {jpLabel && (
        <p className="font-jp text-xs text-umai-text-muted opacity-60 uppercase tracking-widest mb-3">
          {jpLabel}
        </p>
      )}
      <h2 className="font-display text-4xl md:text-5xl uppercase tracking-[0.08em] leading-tight mb-4">
        {title}
      </h2>
      <div
        className={`w-20 border-t-2 border-dashed border-umai-line-dotted mb-4 ${centered ? 'mx-auto' : ''}`}
      />
      {subtitle && (
        <p className="text-umai-text-muted font-body text-base">{subtitle}</p>
      )}
    </div>
  );
}
