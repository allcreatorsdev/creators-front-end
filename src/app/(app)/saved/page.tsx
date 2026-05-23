"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { CenteredSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";
import { VideoCard } from "@/features/feed/components/VideoCard";
import { AnalyzedVideoModal } from "@/features/feed/components/AnalyzedVideoModal";
import type { Video } from "@/lib/api/types";

type SavedFilter = "all" | "analyzed" | "unanalyzed";

export default function SavedPage() {
  const [selected, setSelected] = useState<Video | null>(null);
  const [filter, setFilter] = useState<SavedFilter>("all");
  const { data, isLoading } = useQuery({
    queryKey: qk.saved,
    queryFn: () => api<Video[]>("/saved"),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "analyzed") return data.filter((v) => v.isAnalyzed);
    if (filter === "unanalyzed") return data.filter((v) => !v.isAnalyzed);
    return data;
  }, [data, filter]);

  // Total counts for the toggle labels — gives the user a quick sense of
  // how many videos are in each bucket without having to click each tab.
  const analyzedCount = data?.filter((v) => v.isAnalyzed).length ?? 0;
  const total = data?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saved</h1>
          <p className="text-sm text-muted">
            Videos you bookmarked for later (vault)
          </p>
        </div>
        {/* Hide the filter while loading — keeps the layout calm and avoids
            buttons with "(0)" counts that change once data lands. */}
        {data && data.length > 0 && (
          <div className="inline-flex rounded-lg border border-border p-1">
            <FilterTab
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All <span className="text-faint">{total}</span>
            </FilterTab>
            <FilterTab
              active={filter === "analyzed"}
              onClick={() => setFilter("analyzed")}
            >
              ✓ Analyzed <span className="text-faint">{analyzedCount}</span>
            </FilterTab>
            <FilterTab
              active={filter === "unanalyzed"}
              onClick={() => setFilter("unanalyzed")}
            >
              Not analyzed{" "}
              <span className="text-faint">{total - analyzedCount}</span>
            </FilterTab>
          </div>
        )}
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} onOpen={setSelected} />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        // Has saved videos overall, but none match the current filter.
        <p className="py-20 text-center text-sm text-muted">
          No {filter === "analyzed" ? "analyzed" : "unanalyzed"} videos in
          your saved list.
        </p>
      ) : (
        <EmptyState
          icon="⭐"
          title="No saved videos yet"
          description="Click the star icon on a video in Feed to save it here"
          action={
            <Link
              href="/feed"
              className="mt-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Explore feed
            </Link>
          }
        />
      )}

      <AnalyzedVideoModal video={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-nav-active text-text"
          : "text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
