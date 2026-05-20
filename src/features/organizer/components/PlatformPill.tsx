import { cn } from "@/lib/utils/cn";
import { PlatformIcon } from "@/components/ui/PlatformIcon";

const STYLES: Record<string, string> = {
  instagram: "bg-[#fce7f3] text-[#be185d]",
  tiktok: "bg-black text-white",
  youtube: "bg-[#fee2e2] text-[#b91c1c]",
  threads: "bg-black text-white",
  x: "bg-black text-white",
  linkedin: "bg-[#dbeafe] text-[#1d4ed8]",
  newsletter: "bg-[#f3e8ff] text-[#6b21a8]",
};
const LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  x: "X",
  linkedin: "LinkedIn",
  newsletter: "Newsletter",
};

export function PlatformPill({ platform }: { platform: string }) {
  // Only the three primary platforms have brand SVGs — the rest fall back
  // to a coloured chip with text only.
  const hasIcon =
    platform === "instagram" ||
    platform === "tiktok" ||
    platform === "youtube";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        STYLES[platform] ?? "bg-nav-active text-muted",
      )}
    >
      {hasIcon && <PlatformIcon platform={platform} size={12} />}
      {LABEL[platform] ?? platform}
    </span>
  );
}
