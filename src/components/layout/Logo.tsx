interface LogoProps {
  /** Pixel size of the square logo. */
  size?: number;
  className?: string;
  /** Render for a dark background (white frame instead of navy). */
  onDark?: boolean;
}

/**
 * The Job Master "Job Hub" logo: a rounded-square frame enclosing a green
 * check/growth swoosh. Colours come from the brand palette (Deep Navy /
 * Success Green) and are kept inline so the mark renders consistently anywhere.
 * On a dark surface (e.g. the navy sidebar) the frame switches to white.
 */
export function Logo({ size = 32, className, onDark = false }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Job Master logo"
    >
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="11"
        stroke={onDark ? '#FFFFFF' : '#00182A'}
        strokeWidth="3"
      />
      <path
        d="M13 25 L21 33 L37 11"
        stroke="#22C55E"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
