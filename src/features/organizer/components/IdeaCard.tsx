"use client";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Idea } from "@/lib/api/types";
import { platformsFor } from "../templateMap";
import { PlatformPill } from "./PlatformPill";

const TONE: Record<string, BadgeTone> = {
  green: "green",
  blue: "blue",
  yellow: "yellow",
  pink: "pink",
  violet: "violet",
};

export function IdeaCard({
  idea,
  onOpen,
}: {
  idea: Idea;
  onOpen: (i: Idea) => void;
}) {
  // Platforms shown on the card are derived from the chosen template
  // (Short form → IG + TikTok + YouTube; Threads → Threads + X; …). The
  // explicit `idea.platforms` array still wins if it was set on an older
  // idea — see `platformsFor`.
  const platforms = platformsFor(idea.fmt, idea.platforms);
  return (
    <button
      onClick={() => onOpen(idea)}
      className="w-full space-y-2 rounded-xl border border-border bg-bg p-3 text-left hover:border-brand"
    >
      {idea.subject && (
        <Badge tone={TONE[idea.subject.color] ?? "gray"} uppercase>
          {idea.subject.name}
        </Badge>
      )}
      <p className="text-sm font-medium text-text">{idea.title}</p>
      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {platforms.map((p) => (
            <PlatformPill key={p} platform={p} />
          ))}
        </div>
      )}
      {idea.attribution && (
        <p className="text-xs text-brand">@{idea.attribution.handle} ↗</p>
      )}
    </button>
  );
}
