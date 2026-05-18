import { cn } from "@/lib/utils/cn";

const STYLES: Record<string, string> = {
  instagram: "bg-[#fce7f3] text-[#be185d]",
  tiktok: "bg-black text-white",
  youtube: "bg-[#fee2e2] text-[#b91c1c]",
};
const LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export function PlatformPill({ platform }: { platform: string }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        STYLES[platform] ?? "bg-nav-active text-muted",
      )}
    >
      {LABEL[platform] ?? platform}
    </span>
  );
}
