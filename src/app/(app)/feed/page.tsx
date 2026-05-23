"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Field";
import { FilterPanel } from "@/features/feed/components/FilterPanel";
import { VideoCard } from "@/features/feed/components/VideoCard";
import { AnalyzedVideoModal } from "@/features/feed/components/AnalyzedVideoModal";
import { useAddVideoUrl, useAnalyze, type FeedQuery } from "@/features/feed/hooks";
import { useStreamFeed } from "@/features/feed/useStreamFeed";
import { useChannels } from "@/features/channels/hooks";
import { useMe } from "@/features/auth/hooks";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { Video } from "@/lib/api/types";

const DEFAULTS: FeedQuery = {
  outlierMin: 0,
  outlierMax: 100,
  viewsMin: 0,
  viewsMax: 10_000_000,
  engagementMin: 0,
  engagementMax: 100,
  statusAnalyzed: true,
  statusUnanalyzed: true,
  sortBy: "recent",
  page: 1,
  pageSize: 24,
};

export default function FeedPage() {
  const [filters, setFilters] = useState<FeedQuery>(DEFAULTS);
  // Filter panel: shown inline on desktop (lg+), drawer-style on mobile.
  // Default to *closed* on mobile so the feed doesn't open behind a panel,
  // but the inline panel still renders for desktop via the `lg:block` gate.
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Video | null>(null);
  // Bulk-analyze flow: user clicks the always-visible "Bulk Analyze"
  // button in the top bar to enter select mode, which surfaces a
  // checkbox on every card. The "Analyze N" + "Cancel" buttons then
  // replace the entry button until the user commits or aborts.
  const [selectMode, setSelectMode] = useState(false);
  // Set of video IDs the user has selected for bulk operations.
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // Progress counter shown on the Bulk Analyze button while it iterates.
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  // Debounce so rapid filter tweaks collapse into one backend request.
  const debouncedFilters = useDebouncedValue(filters, 220);
  const addUrl = useAddVideoUrl();
  const analyze = useAnalyze();
  const { data: me } = useMe();
  const { data: channels } = useChannels();
  const qc = useQueryClient();

  const provisioning = me?.workspace.provisioning ?? false;
  const anyChannelScraping = channels?.some((c) => c.scraping) ?? false;

  // A bumping tick that re-runs the stream when provisioning / scraping
  // finishes, and every few seconds while either is still in flight.
  const [refreshTick, setRefreshTick] = useState(0);
  const wasProvisioning = useRef(provisioning);
  const wasScraping = useRef(anyChannelScraping);
  useEffect(() => {
    if (
      (wasProvisioning.current && !provisioning) ||
      (wasScraping.current && !anyChannelScraping)
    ) {
      setRefreshTick((n) => n + 1);
      qc.invalidateQueries({ queryKey: ["channels"] });
    }
    wasProvisioning.current = provisioning;
    wasScraping.current = anyChannelScraping;
  }, [provisioning, anyChannelScraping, qc]);
  useEffect(() => {
    if (!provisioning && !anyChannelScraping) return;
    const id = setInterval(() => setRefreshTick((n) => n + 1), 4000);
    return () => clearInterval(id);
  }, [provisioning, anyChannelScraping]);

  // Streaming feed — first row paints as soon as it arrives off the DB
  // cursor, the rest fill in slot-by-slot (skeletons show the remaining
  // expected count). `refreshTick` re-runs the stream on background-scrape
  // completion / polling without sending anything extra to the backend.
  const {
    items,
    total,
    expected,
    isStreaming,
    isLoadingMore,
    isInitialLoad,
    error,
    patchItem,
    prependItem,
    loadMore,
  } = useStreamFeed(debouncedFilters, refreshTick);

  const filteredChannel = channels?.find((c) => c.id === filters.channelId);
  const channelScraping = !!filteredChannel?.scraping;

  const togglePick = (id: string): void => {
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Run analyze sequentially across selected videos that aren't already
   * analyzed. Sequential (not parallel) keeps the Anthropic spend
   * predictable and avoids racing the credit charge logic. */
  const runBulkAnalyze = async (): Promise<void> => {
    const toAnalyze = items.filter(
      (v) => picked.has(v.id) && !v.isAnalyzed,
    );
    if (toAnalyze.length === 0) return;
    setBulkProgress({ done: 0, total: toAnalyze.length });
    for (let i = 0; i < toAnalyze.length; i++) {
      const v = toAnalyze[i];
      try {
        const updated = await analyze.mutateAsync(v.id);
        patchItem(v.id, updated);
      } catch {
        // Surface the failure as a console warning but keep going — one
        // bad video shouldn't abort the whole batch.
        // eslint-disable-next-line no-console
        console.warn("Bulk analyze failed for video", v.id);
      }
      setBulkProgress({ done: i + 1, total: toAnalyze.length });
    }
    setBulkProgress(null);
    setPicked(new Set());
    setSelectMode(false);
  };

  const cancelSelectMode = (): void => {
    setPicked(new Set());
    setSelectMode(false);
  };

  // Counts shown on the bulk action button. Already-analyzed videos in
  // the selection are skipped silently — the user usually doesn't want
  // to spend credits re-analyzing those.
  const pickedAnalyzable = items.filter(
    (v) => picked.has(v.id) && !v.isAnalyzed,
  ).length;

  // Skeleton slots are only shown while page 1 is streaming (filling the
  // initial grid). Load-more keeps the existing cards visible and surfaces
  // progress through the button spinner instead — adding skeletons there
  // would shift the grid layout each time a new card lands.
  const target = expected ?? filters.pageSize ?? 24;
  const skeletonCount = isStreaming
    ? Math.max(0, target - items.length)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-muted">
          <Link href="/channels" className="hover:text-text">
            ⚙ Customize channels
          </Link>
          <button
            onClick={() => {
              const url = window.prompt("Paste a video URL");
              if (!url) return;
              addUrl.mutate(url, {
                onSuccess: (video) => {
                  // Drop the imported video at the TOP of the grid
                  // without re-streaming the whole feed. Refetching
                  // would wipe scroll position + visible state, and
                  // for old YouTube URLs the real `posted_at` puts
                  // the video deep in the recency sort — user would
                  // think the import silently failed.
                  prependItem(video);
                },
                onError: (err) => {
                  window.alert(
                    `Couldn't import that URL: ${(err as Error).message}`,
                  );
                },
              });
            }}
            disabled={addUrl.isPending}
            className="hover:text-text disabled:opacity-50"
          >
            {addUrl.isPending ? "Adding…" : "🔗 Add video URL"}
          </button>
          {/* Bulk Analyze entry — always visible. Clicking it enters
              select mode (checkboxes appear on each card). Once at
              least one card is picked, the Analyze + Cancel buttons
              below take over the toolbar slot. */}
          {!selectMode && (
            <button
              onClick={() => setSelectMode(true)}
              className="inline-flex items-center gap-1.5 hover:text-text"
            >
              ⚡ Bulk Analyze
            </button>
          )}
          {selectMode && (
            <>
              <button
                onClick={runBulkAnalyze}
                disabled={pickedAnalyzable === 0 || bulkProgress !== null}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {bulkProgress ? (
                  <>
                    <Spinner className="size-3" />
                    Analyzing {bulkProgress.done}/{bulkProgress.total}…
                  </>
                ) : pickedAnalyzable === 0 ? (
                  <>Select videos to analyze</>
                ) : (
                  <>⚡ Analyze {pickedAnalyzable} selected</>
                )}
              </button>
              {!bulkProgress && (
                <button
                  onClick={cancelSelectMode}
                  className="text-xs text-faint hover:text-text"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile-only Filters toggle. On lg+ the rail is always
              visible to the left of the grid, so this button would be
              redundant. */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-nav-active lg:hidden"
          >
            ▾ Filters
          </button>
          <Select
            className="w-40 py-1.5"
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: e.target.value, page: 1 })
            }
          >
            <option value="recent">Sort by: Recent</option>
            <option value="views">Sort by: Views</option>
            <option value="outlier">Sort by: Outlier</option>
            <option value="engagement">Sort by: Engagement</option>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop: inline filter rail. Hidden on mobile — the same panel
            is rendered below as an overlay drawer when `showFilters` is on. */}
        <div className="hidden lg:block">
          <FilterPanel filters={filters} setFilters={setFilters} />
        </div>
        {/* Mobile filter drawer — only mounts when toggled, slides from
            left over the feed. Drawer is a hard-pinned full-height panel
            so a long filter list scrolls within the drawer, not the page. */}
        {showFilters && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFilters(false)}
              aria-hidden
            />
            <div className="relative z-10 flex h-dvh w-80 max-w-[90vw] flex-col overflow-y-auto bg-bg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Filters</span>
                <button
                  onClick={() => setShowFilters(false)}
                  className="rounded-md px-2 py-1 text-sm text-muted hover:bg-nav-active"
                >
                  Close
                </button>
              </div>
              <FilterPanel filters={filters} setFilters={setFilters} />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="mb-3 text-right text-sm text-muted">
            {total !== null
              ? `Showing ${items.length}${
                  isStreaming ? "…" : ""
                } of ${total.toLocaleString()}`
              : isStreaming
                ? "Loading…"
                : ""}
          </p>

          {provisioning && items.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Spinner className="size-8" />
              <div>
                <p className="font-semibold text-text">
                  Setting up your feed…
                </p>
                <p className="mt-1 text-sm text-muted">
                  We&apos;re pulling in real videos from YouTube, Instagram,
                  and TikTok starter creators. First videos will appear in a
                  few seconds — no need to refresh.
                </p>
              </div>
            </div>
          ) : channelScraping && items.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Spinner className="size-8" />
              <div>
                <p className="font-semibold text-text">
                  Fetching videos for @{filteredChannel?.handle}…
                </p>
                <p className="mt-1 text-sm text-muted">
                  Videos will appear here automatically once scraping
                  finishes (~30–60 seconds).
                </p>
              </div>
            </div>
          ) : error && !isStreaming && items.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted">
              Couldn&apos;t load the feed. Is the backend running?
            </p>
          ) : items.length === 0 && !isStreaming && !isInitialLoad ? (
            <p className="py-20 text-center text-sm text-muted">
              No videos match these filters.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {/* Real cards — each one appears the moment its row lands. */}
                {items.map((v) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    onOpen={setSelected}
                    onPatch={patchItem}
                    selectMode={selectMode}
                    selected={picked.has(v.id)}
                    onToggleSelect={togglePick}
                  />
                ))}
                {/* Skeleton placeholders for the slots still en route. */}
                {Array.from({ length: skeletonCount }).map((_, i) => (
                  <VideoCardSkeleton key={`sk-${i}`} />
                ))}
              </div>

              {(provisioning || anyChannelScraping) && !isStreaming && (
                <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
                  <Spinner className="size-3" />
                  More videos still loading — they&apos;ll appear here as
                  channels finish scraping.
                </p>
              )}

              {/* Keep "Load more" visible as long as fewer items have
                  arrived than the total — the backend `hasNext` flag is
                  only a hint and can flip to false a few pages early
                  when per-platform pagination interleaves uneven
                  platform sizes. items.length < total is the source of
                  truth for "is there still more to fetch?". */}
              {total !== null && items.length < total && !isStreaming && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-nav-active disabled:opacity-50"
                  >
                    {isLoadingMore && <Spinner className="size-4" />}
                    {isLoadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnalyzedVideoModal video={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
