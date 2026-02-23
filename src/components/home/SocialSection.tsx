// Instagram SVG icon (simple inline, 24x24)
function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6 mx-auto"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

interface SocialSectionProps {
  instagramUrl: string;
  hashtag: string;
}

export function SocialSection({ instagramUrl, hashtag }: SocialSectionProps) {
  return (
    <section className="py-16 text-center">
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-col items-center gap-3 group"
      >
        <span className="text-umai-accent group-hover:text-umai-accent-hover transition-colors">
          <InstagramIcon />
        </span>
        <p className="font-body text-sm uppercase tracking-widest text-umai-text-muted group-hover:text-umai-text transition-colors">
          @umai_ramen_strasbourg
        </p>
      </a>
      <p className="font-body text-sm text-umai-text-muted mt-2">
        {hashtag}
      </p>
    </section>
  );
}
