"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { CenteredSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { VideoCard } from "@/features/feed/components/VideoCard";
import { AnalyzedVideoModal } from "@/features/feed/components/AnalyzedVideoModal";
import type { Video } from "@/lib/api/types";

export default function SavedPage() {
  const [selected, setSelected] = useState<Video | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: qk.saved,
    queryFn: () => api<Video[]>("/saved"),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saved</h1>
        <p className="text-sm text-muted">
          Videos you bookmarked for later (vault)
        </p>
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {data.map((v) => (
            <VideoCard key={v.id} video={v} onOpen={setSelected} />
          ))}
        </div>
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
