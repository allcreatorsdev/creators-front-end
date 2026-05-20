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
import { useAddVideoUrl, type FeedQuery } from "@/features/feed/hooks";
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
  const [showFilters, setShowFilters] = useState(true);
  const [selected, setSelected] = useState<Video | null>(null);

  // Debounce so rapid filter tweaks collapse into one backend request.
  const debouncedFilters = useDebouncedValue(filters, 220);
  const addUrl = useAddVideoUrl();
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
    hasNext,
    isStreaming,
    isInitialLoad,
    error,
    patchItem,
  } = useStreamFeed(debouncedFilters, refreshTick);

  const filteredChannel = channels?.find((c) => c.id === filters.channelId);
  const channelScraping = !!filteredChannel?.scraping;

  // How many skeleton slots to show after the real cards. We aim for the
  // page-size advertised by the meta chunk; before meta arrives we use
  // pageSize as a sensible default.
  const target = expected ?? filters.pageSize ?? 24;
  const skeletonCount = isStreaming ? Math.max(0, target - items.length) : 0;

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
              if (url) addUrl.mutate(url);
            }}
            disabled={addUrl.isPending}
            className="hover:text-text disabled:opacity-50"
          >
            {addUrl.isPending ? "Adding…" : "🔗 Add video URL"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-nav-active"
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
        {showFilters && (
          <FilterPanel filters={filters} setFilters={setFilters} />
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

              {hasNext && !isStreaming && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        page: (filters.page ?? 1) + 1,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-nav-active"
                  >
                    Load more
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
