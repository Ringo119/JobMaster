interface LogoProps {
  /** Pixel size of the square logo. */
  size?: number;
  className?: string;
}

/**
 * The JobMaster mark: a solid brand-blue rounded square with a white "JM"
 * monogram (per the v3.2 mockup). Colours are inline, not theme classes, so
 * the mark renders identically on the navy sidebar, light/dark pages, the
 * loading screen and the favicon.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="JobMaster logo"
    >
      <rect width="48" height="48" rx="12" fill="#2563EB" />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="19"
        letterSpacing="-0.5"
      >
        JM
      </text>
    </svg>
  );
}
