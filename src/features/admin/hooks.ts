"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AdminOverview, AdminUserRow, PlanTier } from "@/lib/api/types";

export function useAdminOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api<AdminOverview>("/admin/overview"),
    enabled,
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      plan,
      creditsRemaining,
    }: {
      userId: string;
      plan?: PlanTier;
      creditsRemaining?: number;
    }) =>
      api<AdminUserRow>(`/admin/users/${userId}`, {
        method: "PATCH",
        body: { plan, creditsRemaining },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "overview"] }),
  });
}
