import Link from 'next/link';

type ButtonVariant = 'primary' | 'outline';

interface ButtonProps {
  variant?: ButtonVariant;
  href?: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  href,
  children,
  className = '',
  external = false,
  onClick,
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-3 font-body text-sm font-medium uppercase tracking-widest transition-all duration-300 cursor-pointer';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-umai-accent text-umai-white hover:bg-umai-accent-hover',
    outline:
      'bg-transparent border border-umai-accent text-umai-accent hover:bg-umai-accent hover:text-umai-white',
  };

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          className={combinedStyles}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedStyles}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={combinedStyles} onClick={onClick}>
      {children}
    </button>
  );
}
