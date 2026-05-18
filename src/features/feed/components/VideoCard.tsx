"use client";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { compactNumber, outlier, percent, relativeDay } from "@/lib/utils/format";
import { youtubeId } from "@/lib/utils/video";
import type { Video } from "@/lib/api/types";
import { useAnalyze, useTakeIdea, useToggleSave } from "../hooks";

const PLATFORM_BADGE: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  youtube: "YT",
};

export function VideoCard({
  video,
  onOpen,
}: {
  video: Video;
  onOpen?: (v: Video) => void;
}) {
  const toggleSave = useToggleSave();
  const takeIdea = useTakeIdea();
  const analyze = useAnalyze();

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => onOpen?.(video)}
        className={cn(
          "group relative aspect-9/16 w-full overflow-hidden rounded-xl text-left",
          `grad-${video.coverGradient}`,
        )}
      >
        {video.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        )}
        {video.coverUrl && (
          <span className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/30" />
        )}
        {youtubeId(video.url) && (
          <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-xl text-white backdrop-blur transition group-hover:bg-black/70">
            ▶
          </span>
        )}
        {video.isAnalyzed && (
          <span className="absolute left-2 top-2 rounded-md bg-analyzed px-2 py-0.5 text-xs font-semibold text-white">
            ✓ Analyzed
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-text">
          {PLATFORM_BADGE[video.platform]}
        </span>
        <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-lg font-bold text-white drop-shadow">
          {video.title}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            toggleSave.mutate({ id: video.id, saved: video.isSaved });
          }}
          className={cn(
            "absolute bottom-2 right-2 grid size-8 place-items-center rounded-full",
            "bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50",
            video.isSaved && "text-yellow-300",
          )}
          aria-label={video.isSaved ? "Unsave" : "Save"}
        >
          {video.isSaved ? "★" : "☆"}
        </span>
      </button>

      <p className="line-clamp-1 text-sm font-medium text-text">
        {video.title}
      </p>
      <p className="text-xs text-muted">
        @{video.username} · {relativeDay(video.postedAt)}
      </p>

      <div className="flex flex-wrap gap-1">
        <Badge tone="pink">↗ {outlier(video.outlierScore)}</Badge>
        <Badge tone="blue">👁 {compactNumber(video.views)}</Badge>
        <Badge tone="yellow">⚡ {percent(video.engagementPct)}</Badge>
      </div>

      {video.isAnalyzed ? (
        <button
          onClick={() => takeIdea.mutate(video.id)}
          disabled={takeIdea.isPending}
          className="rounded-lg border border-border py-1.5 text-sm font-medium text-text hover:bg-nav-active disabled:opacity-50"
        >
          {takeIdea.isPending ? "Adding…" : "+ Take idea"}
        </button>
      ) : (
        <button
          onClick={() => analyze.mutate(video.id)}
          disabled={analyze.isPending}
          className="rounded-lg border border-border py-1.5 text-sm font-medium text-muted hover:bg-nav-active disabled:opacity-50"
        >
          {analyze.isPending ? "Analyzing…" : "Analyze"}
        </button>
      )}
    </div>
  );
}
