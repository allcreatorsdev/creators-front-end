import { cn } from "@/lib/utils/cn";

/** Subject-tag / metric-chip style badge: pastel bg + darker text. */
const tones = {
  green: "bg-[#dcfce7] text-[#15803d]",
  blue: "bg-[#dbeafe] text-[#1d4ed8]",
  yellow: "bg-[#fef9c3] text-[#a16207]",
  pink: "bg-[#fce7f3] text-[#be185d]",
  violet: "bg-[#ede9fe] text-[#6d28d9]",
  gray: "bg-nav-active text-muted",
  brand: "bg-version-bg text-version-fg",
  // Below-average outlier (<1x) — red pastel + crimson text, matches the
  // Sandcastle reference where underperforming videos get a warning tint.
  red: "bg-[#fee2e2] text-[#b91c1c]",
  // Engagement — peach/orange pastel + amber text.
  orange: "bg-[#ffedd5] text-[#c2410c]",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "gray",
  uppercase,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  uppercase?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
        uppercase && "uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
