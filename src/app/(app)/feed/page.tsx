"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Field";
import { FilterPanel } from "@/features/feed/components/FilterPanel";
import { VideoCard } from "@/features/feed/components/VideoCard";
import { AnalyzedVideoModal } from "@/features/feed/components/AnalyzedVideoModal";
import { useAddVideoUrl, useFeed, type FeedQuery } from "@/features/feed/hooks";
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

  // Debounce so rapid filter tweaks collapse into one backend request
  // (the DB is remote — every round-trip is costly).
  const debouncedFilters = useDebouncedValue(filters, 400);
  const { data, isLoading, isError, isFetching } = useFeed(debouncedFilters);
  const addUrl = useAddVideoUrl();
  const { data: me } = useMe();
  const { data: channels } = useChannels();
  const qc = useQueryClient();

  const provisioning = me?.workspace.provisioning ?? false;
  const wasProvisioning = useRef(provisioning);
  useEffect(() => {
    // When background scraping finishes, pull the freshly-stored videos.
    if (wasProvisioning.current && !provisioning) {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["channels"] });
    }
    wasProvisioning.current = provisioning;
  }, [provisioning, qc]);

  // A channel the user just added is still scraping its videos.
  const filteredChannel = channels?.find((c) => c.id === filters.channelId);
  const channelScraping = !!filteredChannel?.scraping;
  const anyScraping = channels?.some((c) => c.scraping) ?? false;
  const wasScraping = useRef(anyScraping);
  useEffect(() => {
    if (wasScraping.current && !anyScraping) {
      qc.invalidateQueries({ queryKey: ["feed"] });
    }
    wasScraping.current = anyScraping;
  }, [anyScraping, qc]);

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
            {data
              ? `Showing ${data.items.length} of ${data.total.toLocaleString()}`
              : ""}
          </p>

          {provisioning && (!data || data.items.length === 0) ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Spinner className="size-8" />
              <div>
                <p className="font-semibold text-text">
                  Setting up your feed…
                </p>
                <p className="mt-1 text-sm text-muted">
                  We&apos;re pulling in real videos from starter creators.
                  This takes about a minute — it&apos;ll appear automatically.
                </p>
              </div>
            </div>
          ) : channelScraping && (!data || data.items.length === 0) ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Spinner className="size-8" />
              <div>
                <p className="font-semibold text-text">
                  Fetching videos for @{filteredChannel?.handle}…
                </p>
                <p className="mt-1 text-sm text-muted">
                  We&apos;re scraping this channel&apos;s recent videos. This
                  takes about a minute — they&apos;ll appear here
                  automatically, no need to refresh.
                </p>
              </div>
            </div>
          ) : isError && !isFetching ? (
            <p className="py-20 text-center text-sm text-muted">
              Couldn&apos;t load the feed. Is the backend running?
            </p>
          ) : isLoading || (isFetching && (filters.page ?? 1) === 1) ? (
            <FeedSkeleton />
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {data.items.map((v) => (
                  <VideoCard key={v.id} video={v} onOpen={setSelected} />
                ))}
              </div>
              {data.hasNext && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        page: (filters.page ?? 1) + 1,
                      })
                    }
                    disabled={isFetching}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-nav-active disabled:opacity-50"
                  >
                    {isFetching && <Spinner className="size-4" />}
                    {isFetching ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="py-20 text-center text-sm text-muted">
              No videos match these filters.
            </p>
          )}
        </div>
      </div>

      <AnalyzedVideoModal video={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
