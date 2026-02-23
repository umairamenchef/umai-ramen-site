import { SectionHeader } from '@/components/ui/SectionHeader';
import { FadeInUp } from '@/components/ui/FadeInUp';

// Noodle bowl SVG icon (line-art style)
function NoodleBowlIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-12 h-12 mx-auto text-umai-accent"
      aria-hidden="true"
    >
      {/* Bowl */}
      <path d="M8 22 C8 34 40 34 40 22" />
      <line x1="8" y1="22" x2="40" y2="22" />
      {/* Base */}
      <path d="M16 34 L18 40 H30 L32 34" />
      <line x1="14" y1="40" x2="34" y2="40" />
      {/* Noodles */}
      <path d="M14 18 Q18 14 22 18 Q26 22 30 18 Q34 14 34 18" />
      <path d="M12 15 Q16 11 20 15 Q24 19 28 15 Q32 11 36 15" />
      {/* Steam */}
      <path d="M20 9 Q21 6 20 3" />
      <path d="M24 8 Q25 5 24 2" />
      <path d="M28 9 Q29 6 28 3" />
    </svg>
  );
}

// Pot/steam SVG icon (line-art style)
function BouillonPotIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-12 h-12 mx-auto text-umai-accent"
      aria-hidden="true"
    >
      {/* Pot body */}
      <rect x="8" y="20" width="32" height="20" rx="3" />
      {/* Lid */}
      <rect x="6" y="16" width="36" height="5" rx="2" />
      {/* Lid handle */}
      <path d="M20 16 L20 13 Q24 11 28 13 L28 16" />
      {/* Handles */}
      <path d="M8 25 L4 25 L4 33 L8 33" />
      <path d="M40 25 L44 25 L44 33 L40 33" />
      {/* Steam */}
      <path d="M18 12 Q19 9 18 6" />
      <path d="M24 11 Q25 8 24 5" />
      <path d="M30 12 Q31 9 30 6" />
    </svg>
  );
}

// Map pin SVG icon (line-art style)
function LocalPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-12 h-12 mx-auto text-umai-accent"
      aria-hidden="true"
    >
      {/* Pin */}
      <path d="M24 4 C16 4 10 10 10 18 C10 28 24 44 24 44 C24 44 38 28 38 18 C38 10 32 4 24 4 Z" />
      {/* Inner circle */}
      <circle cx="24" cy="18" r="5" />
    </svg>
  );
}

interface UspSectionProps {
  title: string;
  usps: Array<{
    icon: 'noodles' | 'bouillon' | 'local';
    title: string;
    description: string;
  }>;
}

const ICONS = {
  noodles: NoodleBowlIcon,
  bouillon: BouillonPotIcon,
  local: LocalPinIcon,
};

export function UspSection({ title, usps }: UspSectionProps) {
  return (
    <section className="py-[var(--spacing-section)] bg-umai-bg-alt">
      <div className="max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        <SectionHeader title={title} centered />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {usps.map((usp, index) => {
            const IconComponent = ICONS[usp.icon];
            return (
              <FadeInUp key={usp.icon} delay={index * 0.1}>
                <div className="border border-dashed border-umai-line p-8 text-center">
                  <IconComponent />
                  <h3 className="font-display text-xl uppercase tracking-wide mt-4">
                    {usp.title}
                  </h3>
                  <p className="font-body text-sm text-umai-text-muted mt-2">
                    {usp.description}
                  </p>
                </div>
              </FadeInUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
