"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type { Channel, ChannelCategory } from "@/lib/api/types";

export function useChannels() {
  return useQuery({
    queryKey: qk.channels,
    queryFn: () => api<Channel[]>("/channels"),
    // Poll while any channel is still being scraped in the background so the
    // watchlist + feed update automatically when its videos land.
    refetchInterval: (q) =>
      q.state.data?.some((c) => c.scraping) ? 4000 : false,
  });
}

function useChannelInvalidator() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.channels });
}

export function useAddChannel() {
  const invalidate = useChannelInvalidator();
  return useMutation({
    // `displayName` is optional — passed from discovery suggestions so the
    // backend can use it as a smarter fallback search query when the
    // AI-supplied handle doesn't resolve directly. Manual Add-by-URL
    // skips it.
    mutationFn: (body: {
      platform: string;
      handle: string;
      displayName?: string;
    }) => api<Channel>("/channels", { method: "POST", body }),
    onSuccess: invalidate,
  });
}

export function useDescribeChannels() {
  return useMutation({
    mutationFn: (body: {
      query: string;
      platform?: string;
      accountSize?: string;
    }) =>
      api<ChannelCategory[]>("/channels/describe", {
        method: "POST",
        body,
      }),
  });
}

export function useRemoveChannel() {
  const invalidate = useChannelInvalidator();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/channels/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useRemoveAllChannels() {
  const invalidate = useChannelInvalidator();
  return useMutation({
    mutationFn: () => api("/channels", { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
