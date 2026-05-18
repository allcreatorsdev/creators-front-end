"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type { FeedPage, Video } from "@/lib/api/types";

export type FeedQuery = {
  q?: string;
  channelId?: string;
  platform?: string;
  outlierMin?: number;
  outlierMax?: number;
  viewsMin?: number;
  viewsMax?: number;
  engagementMin?: number;
  engagementMax?: number;
  postedInLastDays?: number;
  statusAnalyzed?: boolean;
  statusUnanalyzed?: boolean;
  sortBy?: string;
  page?: number;
  pageSize?: number;
};

export function useFeed(query: FeedQuery) {
  return useQuery({
    queryKey: qk.feed(query),
    queryFn: () =>
      api<FeedPage>("/videos", {
        query: query as Record<string, string | number | boolean | undefined>,
      }),
    placeholderData: (prev) => prev,
  });
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      api(`/saved/${id}`, { method: saved ? "DELETE" : "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: qk.saved });
    },
  });
}

export function useAnalyze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<Video>(`/videos/${id}/analyze`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useTakeIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ ideaId: string }>(`/videos/${id}/take-idea`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useAddVideoUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) =>
      api<Video>("/videos/by-url", { method: "POST", body: { url } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}
