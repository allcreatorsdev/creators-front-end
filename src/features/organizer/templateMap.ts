/** Single-source-of-truth mapping between the template ("Short Form" /
 * "Threads" / etc.) the user picks in the idea modal and the platforms
 * that template is meant to ship to. The PDF spec from the client says
 * the Platform field should NOT be a user choice — it's derived from the
 * template they pick. */

import type { IdeaFormat } from "@/lib/api/types";

export const TEMPLATE_LABEL: Record<IdeaFormat, string> = {
  short_form: "Short form",
  long_form: "Long form",
  carousel: "Carousel",
  // The historical enum value "tweet" now represents the broader "Threads"
  // template (Instagram Threads + X). DB stays as-is; the label changes.
  tweet: "Threads",
  newsletter: "Newsletter",
};

/** Platforms each template auto-publishes to. Kept short — the canonical
 * names match Platform from `types.ts` where overlap exists; "shorts" and
 * "threads"/"x"/"linkedin" are extras used only for display badges. */
export const TEMPLATE_PLATFORMS: Record<IdeaFormat, string[]> = {
  short_form: ["instagram", "tiktok", "youtube"], // IG Reels + TikTok + YT Shorts
  long_form: ["youtube"],
  carousel: ["instagram", "linkedin"],
  tweet: ["threads", "x"], // "Threads" template
  newsletter: ["newsletter"],
};

export function platformsFor(
  fmt: IdeaFormat,
  explicit: string[] | undefined,
): string[] {
  // If the user (or an older idea) explicitly picked platforms, honour
  // them — otherwise derive from the template choice.
  if (explicit && explicit.length > 0) return explicit;
  return TEMPLATE_PLATFORMS[fmt] ?? [];
}
