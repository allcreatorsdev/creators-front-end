"use client";

import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { relativeDay } from "@/lib/utils/format";
import { apiUrl } from "@/config/env";
import type { Video } from "@/lib/api/types";
import { useAnalyze, useTakeIdea, useToggleSave } from "../hooks";
import { StatsBadges } from "./StatsBadges";

/** Three-icon action bar that slides up from the bottom of the card on
 * hover (Sandcastle-style). Hidden in select mode where the whole card
 * becomes a checkbox target instead. */
function HoverActions({
  isAnalyzed,
  onAnalyze,
  onOpen,
  onTakeIdea,
  isSaved,
  onToggleSave,
  isAnalyzing,
  isTakingIdea,
  isSaving,
}: {
  isAnalyzed: boolean;
  onAnalyze: () => void;
  onOpen: () => void;
  onTakeIdea: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  isAnalyzing: boolean;
  isTakingIdea: boolean;
  isSaving: boolean;
}) {
  const stop =
    (fn: () => void) =>
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      fn();
    };
  return (
    <div
      className={cn(
        "absolute inset-x-2 bottom-2 grid grid-cols-3 gap-1",
        "rounded-xl bg-white/95 p-1 shadow-md backdrop-blur",
        "opacity-0 transition-opacity group-hover:opacity-100",
      )}
    >
      <button
        type="button"
        onClick={stop(onAnalyze)}
        disabled={isAnalyzed || isAnalyzing}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium",
          "text-text hover:bg-nav-active disabled:opacity-50",
        )}
        aria-label={isAnalyzed ? "Already analyzed" : "Analyze"}
      >
        {isAnalyzing ? <Spinner className="size-3.5" /> : <FlaskIcon />}
        <span className="hidden sm:inline">
          {isAnalyzed ? "Analyzed" : "Analyze"}
        </span>
      </button>
      <button
        type="button"
        onClick={stop(onOpen)}
        className="inline-flex items-center justify-center rounded-lg py-1.5 text-text hover:bg-nav-active"
        aria-label="Play"
      >
        <PlayIcon />
      </button>
      <button
        type="button"
        onClick={stop(isAnalyzed ? onTakeIdea : onToggleSave)}
        disabled={isTakingIdea || isSaving}
        className="inline-flex items-center justify-center rounded-lg py-1.5 text-text hover:bg-nav-active disabled:opacity-50"
        aria-label={isAnalyzed ? "Take idea" : isSaved ? "Unsave" : "Save"}
      >
        {isTakingIdea || isSaving ? (
          <Spinner className="size-3.5" />
        ) : isAnalyzed ? (
          <FolderIcon />
        ) : isSaved ? (
          <BookmarkFilled />
        ) : (
          <BookmarkIcon />
        )}
      </button>
    </div>
  );
}

const FlaskIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5"
  >
    <path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3" />
    <path d="M7 14h10" />
  </svg>
);

const PlayIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-3.5"
  >
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const FolderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5"
  >
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5"
  >
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
);

const BookmarkFilled = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-3.5 text-yellow-500"
  >
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
);

export function VideoCard({
  video,
  onOpen,
  onPatch,
  selectMode,
  selected,
  onToggleSelect,
}: {
  video: Video;
  onOpen?: (v: Video) => void;
  /** Patch the stream's local copy of this video so mutation results
   * appear instantly (analyze flips `isAnalyzed`, save toggles `isSaved`)
   * without waiting for a full re-stream. */
  onPatch?: (id: string, patch: Partial<Video>) => void;
  /** When true, the entire card becomes a checkbox toggle for the
   * bulk-analyze flow and hover-actions are suppressed. */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const toggleSave = useToggleSave();
  const takeIdea = useTakeIdea();
  const analyze = useAnalyze();

  // Prefer our durable copy (Instagram/TikTok CDN URLs expire fast); fall
  // back to the source URL (YouTube — stable).
  const coverSrc = video.hasThumb
    ? apiUrl(`/media/thumb/${video.id}`)
    : video.coverUrl;

  const handleSave = (): void => {
    const next = !video.isSaved;
    // Optimistic flip — bookmark colour changes the instant the user
    // clicks, even though the round-trip to Neon US East takes 1–2s.
    onPatch?.(video.id, { isSaved: next });
    toggleSave.mutate(
      { id: video.id, saved: video.isSaved },
      { onError: () => onPatch?.(video.id, { isSaved: !next }) },
    );
  };

  const handleAnalyze = (): void => {
    analyze.mutate(video.id, {
      onSuccess: (updated) => onPatch?.(video.id, updated),
    });
  };

  const handleTakeIdea = (): void => {
    takeIdea.mutate(video.id);
  };

  // Top-level click: in select mode, toggle the checkbox; otherwise
  // open the analysis modal.
  const handleCardClick = (): void => {
    if (selectMode) {
      onToggleSelect?.(video.id);
    } else {
      onOpen?.(video);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCardClick}
        className={cn(
          "group relative aspect-9/16 w-full overflow-hidden rounded-xl text-left",
          `grad-${video.coverGradient}`,
          selectMode && selected && "ring-2 ring-brand",
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
        {coverSrc && !selectMode && (
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
        {/* Select-mode checkbox (only when the parent has entered
            bulk-analyze mode). Drawn over the bottom-left so it doesn't
            collide with the analyzed badge. */}
        {selectMode && (
          <span
            className={cn(
              "absolute bottom-2 left-2 grid size-7 place-items-center rounded-md",
              "border-2 border-white text-white text-sm backdrop-blur",
              selected ? "bg-brand" : "bg-black/40",
            )}
            aria-hidden
          >
            {selected ? "✓" : ""}
          </span>
        )}
        {!coverSrc && (
          <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-lg font-bold text-white drop-shadow">
            {video.title}
          </span>
        )}
        {/* Hover action bar — Sandcastle-style. Hidden in select mode
            so taps on the card register as checkbox toggles. */}
        {!selectMode && (
          <HoverActions
            isAnalyzed={video.isAnalyzed}
            onAnalyze={handleAnalyze}
            onOpen={() => onOpen?.(video)}
            onTakeIdea={handleTakeIdea}
            isSaved={video.isSaved}
            onToggleSave={handleSave}
            isAnalyzing={analyze.isPending}
            isTakingIdea={takeIdea.isPending}
            isSaving={toggleSave.isPending}
          />
        )}
      </button>

      <p className="line-clamp-1 text-sm font-medium text-text">
        {video.title}
      </p>
      <p className="text-xs text-muted">
        @{video.username}
        {video.postedAt && ` · ${relativeDay(video.postedAt)}`}
      </p>

      <StatsBadges
        outlierScore={video.outlierScore}
        views={video.views}
        engagementPct={video.engagementPct}
      />
    </div>
  );
}
