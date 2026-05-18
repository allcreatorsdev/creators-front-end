"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type { Me } from "@/lib/api/types";

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api<Me>("/auth/me"),
    staleTime: 5 * 60_000,
    // Auto-poll while the workspace is being provisioned (default channels
    // scraping in the background) so the UI updates when it finishes.
    refetchInterval: (q) =>
      q.state.data?.workspace.provisioning ? 4000 : false,
  });
}
