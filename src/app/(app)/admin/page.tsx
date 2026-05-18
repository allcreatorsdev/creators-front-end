"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { CenteredSpinner } from "@/components/ui/Spinner";
import { useMe } from "@/features/auth/hooks";
import {
  useAdminOverview,
  useUpdateAdminUser,
} from "@/features/admin/hooks";
import type { PlanTier } from "@/lib/api/types";

const PLANS: PlanTier[] = ["starter", "pro", "team"];

export default function AdminPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const router = useRouter();
  const isAdmin = me?.isAdmin ?? false;

  useEffect(() => {
    if (!meLoading && me && !isAdmin) router.replace("/feed");
  }, [meLoading, me, isAdmin, router]);

  const { data, isLoading } = useAdminOverview(isAdmin);
  const update = useUpdateAdminUser();

  if (meLoading || !me || !isAdmin) return <CenteredSpinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted">
          All users, their subscription and usage
        </p>
      </div>

      {data && (
        <div className="flex flex-wrap gap-3">
          <Badge tone="gray">Total users: {data.stats.totalUsers}</Badge>
          {Object.entries(data.stats.byPlan).map(([plan, n]) => (
            <Badge key={plan} tone="brand">
              {plan}: {n}
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Channels</th>
                <th className="p-3">Videos</th>
                <th className="p-3">Ideas</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.userId} className="border-b border-border">
                  <td className="p-3">
                    <div className="font-medium">{u.email ?? "—"}</div>
                    <div className="text-xs text-faint">
                      {u.name ?? u.workspaceName ?? ""}
                    </div>
                  </td>
                  <td className="p-3">
                    <Select
                      className="w-28 py-1"
                      value={u.plan ?? "starter"}
                      onChange={(e) =>
                        update.mutate({
                          userId: u.userId,
                          plan: e.target.value as PlanTier,
                        })
                      }
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      defaultValue={u.creditsRemaining}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== u.creditsRemaining)
                          update.mutate({
                            userId: u.userId,
                            creditsRemaining: v,
                          });
                      }}
                      className="w-24 rounded-md border border-border px-2 py-1"
                    />
                  </td>
                  <td className="p-3">{u.channelCount}</td>
                  <td className="p-3">{u.videoCount}</td>
                  <td className="p-3">{u.ideaCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
