import { cn } from "@/lib/utils/cn";

/** Brand-coloured SVG marks for the three supported platforms. Rendered at
 * the platform's official accent so users recognise the source at a glance
 * (replaces the older "IG / TT / YT" text badges). */

type Props = {
  platform: string;
  /** Square pixel size. Defaults to 16. */
  size?: number;
  className?: string;
  /** Show on a white circle (good for dark/photo backgrounds). */
  onLight?: boolean;
  title?: string;
};

export function PlatformIcon({
  platform,
  size = 16,
  className,
  onLight = false,
  title,
}: Props) {
  const label = title ?? PLATFORM_NAME[platform] ?? platform;
  const inner = ICONS[platform] ?? (
    <text x="50%" y="55%" textAnchor="middle" fontSize="10" fill="currentColor">
      ?
    </text>
  );

  if (onLight) {
    return (
      <span
        aria-label={label}
        title={label}
        className={cn(
          "inline-grid place-items-center rounded-full bg-white shadow",
          className,
        )}
        style={{ width: size + 6, height: size + 6 }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          {inner}
        </svg>
      </span>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-label={label}
      role="img"
      className={className}
    >
      <title>{label}</title>
      {inner}
    </svg>
  );
}

const PLATFORM_NAME: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const ICONS: Record<string, React.ReactNode> = {
  // Instagram — gradient-filled rounded square + lens + LED dot.
  instagram: (
    <>
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="25%" stopColor="#FA7E1E" />
          <stop offset="50%" stopColor="#D62976" />
          <stop offset="75%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="4"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="white" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.8" r="1.1" fill="white" />
    </>
  ),
  // TikTok — black ground with cyan + magenta offset glyph.
  tiktok: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#000" />
      <path
        d="M15.3 6.6c.4 1.1 1.3 1.9 2.5 2v2.1c-.8 0-1.6-.2-2.5-.7v4.6a3.7 3.7 0 1 1-3.7-3.7c.2 0 .4 0 .6.1V13c-.2-.1-.4-.1-.6-.1a1.8 1.8 0 1 0 1.8 1.8V5.7h1.9z"
        fill="#FF004F"
      />
      <path
        d="M15.9 6.6c.4 1.1 1.3 1.9 2.5 2v2.1c-.8 0-1.6-.2-2.5-.7v4.6a3.7 3.7 0 1 1-3.7-3.7c.2 0 .4 0 .6.1V13c-.2-.1-.4-.1-.6-.1a1.8 1.8 0 1 0 1.8 1.8V5.7h1.9z"
        fill="#00F2EA"
        opacity=".8"
      />
      <path
        d="M15.6 6.6c.4 1.1 1.3 1.9 2.5 2v2.1c-.8 0-1.6-.2-2.5-.7v4.6a3.7 3.7 0 1 1-3.7-3.7c.2 0 .4 0 .6.1V13c-.2-.1-.4-.1-.6-.1a1.8 1.8 0 1 0 1.8 1.8V5.7h1.9z"
        fill="#fff"
      />
    </>
  ),
  // YouTube — red rounded rect with white play triangle.
  youtube: (
    <>
      <rect x="1.5" y="5" width="21" height="14" rx="3.5" fill="#FF0000" />
      <path d="M10 8.5l6 3.5-6 3.5z" fill="#fff" />
    </>
  ),
};
