"use client";

import { Badge } from "@/components/ui/Badge";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { compactNumber, outlier, percent, relativeDay } from "@/lib/utils/format";
import { apiUrl } from "@/config/env";
import type { Video } from "@/lib/api/types";
import { useAnalyze, useTakeIdea, useToggleSave } from "../hooks";

export function VideoCard({
  video,
  onOpen,
  onPatch,
}: {
  video: Video;
  onOpen?: (v: Video) => void;
  /** Patch the stream's local copy of this video so mutation results
   * appear instantly (analyze flips `isAnalyzed`, save toggles `isSaved`)
   * without waiting for a full re-stream. */
  onPatch?: (id: string, patch: Partial<Video>) => void;
}) {
  const toggleSave = useToggleSave();
  const takeIdea = useTakeIdea();
  const analyze = useAnalyze();

  // Prefer our durable copy (Instagram/TikTok CDN URLs expire fast); fall
  // back to the source URL (YouTube — stable).
  const coverSrc = video.hasThumb
    ? apiUrl(`/media/thumb/${video.id}`)
    : video.coverUrl;

  const handleSave = (e: React.MouseEvent | React.KeyboardEvent): void => {
    e.stopPropagation();
    const next = !video.isSaved;
    // Optimistic flip — star colour changes the instant the user clicks,
    // even though the round-trip to Neon US East takes 1–2 s from BD.
    onPatch?.(video.id, { isSaved: next });
    toggleSave.mutate(
      { id: video.id, saved: video.isSaved },
      {
        onError: () => onPatch?.(video.id, { isSaved: !next }),
      },
    );
  };

  const handleAnalyze = (): void => {
    analyze.mutate(video.id, {
      onSuccess: (updated) => {
        // Replace the local copy so the "+ Take idea" button replaces
        // "Analyze" immediately — no manual refresh needed.
        onPatch?.(video.id, updated);
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => onOpen?.(video)}
        className={cn(
          "group relative aspect-9/16 w-full overflow-hidden rounded-xl text-left",
          `grad-${video.coverGradient}`,
        )}
      >
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        )}
        {coverSrc && (
          <span className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/25" />
        )}
        {coverSrc && (
          <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-xl text-white backdrop-blur transition group-hover:bg-black/70">
            ▶
          </span>
        )}
        {video.isAnalyzed && (
          <span className="absolute left-2 top-2 rounded-md bg-analyzed px-2 py-0.5 text-xs font-semibold text-white">
            ✓ Analyzed
          </span>
        )}
        <PlatformIcon
          platform={video.platform}
          size={18}
          onLight
          className="absolute right-2 top-2"
        />
        {!coverSrc && (
          <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-lg font-bold text-white drop-shadow">
            {video.title}
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleSave(e);
          }}
          aria-busy={toggleSave.isPending}
          className={cn(
            "absolute bottom-2 right-2 grid size-8 place-items-center rounded-full",
            "bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50",
            video.isSaved && "text-yellow-300",
            toggleSave.isPending && "cursor-wait",
          )}
          aria-label={video.isSaved ? "Unsave" : "Save"}
        >
          {toggleSave.isPending ? (
            <Spinner className="size-4" />
          ) : video.isSaved ? (
            "★"
          ) : (
            "☆"
          )}
        </span>
      </button>

      <p className="line-clamp-1 text-sm font-medium text-text">
        {video.title}
      </p>
      <p className="text-xs text-muted">
        @{video.username}
        {video.postedAt && ` · ${relativeDay(video.postedAt)}`}
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
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border py-1.5 text-sm font-medium text-text hover:bg-nav-active disabled:opacity-50"
        >
          {takeIdea.isPending && <Spinner className="size-3.5" />}
          {takeIdea.isPending ? "Adding…" : "+ Take idea"}
        </button>
      ) : (
        <button
          onClick={handleAnalyze}
          disabled={analyze.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border py-1.5 text-sm font-medium text-muted hover:bg-nav-active disabled:opacity-50"
        >
          {analyze.isPending && <Spinner className="size-3.5" />}
          {analyze.isPending ? "Analyzing…" : "Analyze"}
        </button>
      )}
    </div>
  );
}
