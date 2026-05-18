"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";
import { cn } from "@/lib/utils/cn";
import type { Channel, SavedFilter } from "@/lib/api/types";
import type { FeedQuery } from "../hooks";

function Range({
  label,
  a,
  b,
  onA,
  onB,
  suffix = "",
}: {
  label: string;
  a: number | undefined;
  b: number | undefined;
  onA: (v: number) => void;
  onB: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={a ?? ""}
          onChange={(e) => onA(Number(e.target.value))}
          className="py-1.5"
        />
        <span className="text-faint">–</span>
        <Input
          type="number"
          value={b ?? ""}
          onChange={(e) => onB(Number(e.target.value))}
          className="py-1.5"
        />
        {suffix && <span className="text-xs text-faint">{suffix}</span>}
      </div>
    </div>
  );
}

export function FilterPanel({
  filters,
  setFilters,
}: {
  filters: FeedQuery;
  setFilters: (f: FeedQuery) => void;
}) {
  const qc = useQueryClient();
  const { data: channels } = useQuery({
    queryKey: qk.channels,
    queryFn: () => api<Channel[]>("/channels"),
  });
  const { data: savedFilters } = useQuery({
    queryKey: qk.savedFilters,
    queryFn: () => api<SavedFilter[]>("/settings/saved-filters"),
  });

  const saveFilter = useMutation({
    mutationFn: () =>
      api("/settings/saved-filters", {
        method: "POST",
        body: { name: `Filter ${new Date().toLocaleDateString()}`, params: filters },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.savedFilters }),
  });

  const set = (patch: Partial<FeedQuery>) =>
    setFilters({ ...filters, ...patch, page: 1 });

  return (
    <Card className="w-72 shrink-0 space-y-5 p-4">
      <div>
        <Label>Saved Filters</Label>
        <div className="mt-2 space-y-1">
          {savedFilters?.length ? (
            savedFilters.map((sf) => (
              <button
                key={sf.id}
                onClick={() => set(sf.params as FeedQuery)}
                className="flex w-full items-center gap-2 rounded-lg bg-version-bg px-3 py-2 text-sm text-version-fg"
              >
                ⭐ {sf.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-faint">No saved filters yet</p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Label>Filters</Label>
      </div>

      <div className="space-y-1">
        <Label>Channels</Label>
        <Select
          value={filters.channelId ?? ""}
          onChange={(e) => set({ channelId: e.target.value || undefined })}
        >
          <option value="">All channels</option>
          {channels?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Keywords</Label>
        <Input
          placeholder="Search captions and titles"
          value={filters.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
        />
      </div>

      <Range
        label="Outlier score"
        a={filters.outlierMin}
        b={filters.outlierMax}
        onA={(v) => set({ outlierMin: v })}
        onB={(v) => set({ outlierMax: v })}
        suffix="x"
      />
      <Range
        label="Views"
        a={filters.viewsMin}
        b={filters.viewsMax}
        onA={(v) => set({ viewsMin: v })}
        onB={(v) => set({ viewsMax: v })}
      />
      <Range
        label="Engagement"
        a={filters.engagementMin}
        b={filters.engagementMax}
        onA={(v) => set({ engagementMin: v })}
        onB={(v) => set({ engagementMax: v })}
        suffix="%"
      />

      <div className="space-y-1">
        <Label>Posted in last (days)</Label>
        <Input
          type="number"
          value={filters.postedInLastDays ?? ""}
          onChange={(e) =>
            set({ postedInLastDays: Number(e.target.value) || undefined })
          }
        />
      </div>

      <div className="space-y-1">
        <Label>Platform</Label>
        <Select
          value={filters.platform ?? ""}
          onChange={(e) => set({ platform: e.target.value || undefined })}
        >
          <option value="">All platforms</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Status</Label>
        <div className="flex gap-2">
          {(
            [
              ["statusAnalyzed", "Analyzed"],
              ["statusUnanalyzed", "Unanalyzed"],
            ] as const
          ).map(([key, lbl]) => {
            const active = filters[key] !== false;
            return (
              <button
                key={key}
                onClick={() => set({ [key]: !active } as Partial<FeedQuery>)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium",
                  active
                    ? "bg-version-bg text-version-fg"
                    : "border border-border text-muted",
                )}
              >
                {active ? "☑" : "☐"} {lbl}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => saveFilter.mutate()}
        disabled={saveFilter.isPending}
        className="w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-nav-active disabled:opacity-50"
      >
        ⭐ Save filter
      </button>
    </Card>
  );
}
