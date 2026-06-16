interface LogoProps {
  /** Pixel size of the square logo. */
  size?: number;
  className?: string;
}

/**
 * The Job Master "Job Hub" logo: a navy rounded-square frame enclosing a green
 * check/growth swoosh. Colours come from the brand palette (Deep Navy /
 * Success Green) and are kept inline so the mark renders consistently anywhere.
 */
export function Logo({ size = 32, className }: LogoProps) {
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
      <rect x="3" y="3" width="42" height="42" rx="11" stroke="#0D1B2A" strokeWidth="3" />
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
