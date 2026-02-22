interface SeigahaPatternProps {
  className?: string;
  color?: string;
  opacity?: number;
}

export function SeigahaPattern({
  className = 'inset-0',
  color = 'currentColor',
  opacity = 0.04,
}: SeigahaPatternProps) {
  // Inline SVG seigaiha (wave/scale) pattern as data URI background
  const encodedColor = encodeURIComponent(color);
  const svgPattern = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='20'><path d='M0 20 Q10 0 20 20 Q30 0 40 20' stroke='${encodedColor}' stroke-width='0.8' fill='none'/><path d='M-20 20 Q-10 0 0 20' stroke='${encodedColor}' stroke-width='0.8' fill='none'/><path d='M40 20 Q50 0 60 20' stroke='${encodedColor}' stroke-width='0.8' fill='none'/><path d='M10 20 Q20 40 30 20' stroke='${encodedColor}' stroke-width='0.8' fill='none' opacity='0.5'/></svg>`;
  const bgImage = `url("data:image/svg+xml,${svgPattern}")`;

  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none ${className}`}
      style={{
        backgroundImage: bgImage,
        backgroundRepeat: 'repeat',
        opacity,
      }}
    />
  );
}
