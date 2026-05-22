"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";
import { cn } from "@/lib/utils/cn";
import type { Channel, SavedFilter } from "@/lib/api/types";
import type { FeedQuery } from "../hooks";
import { ChannelSelect } from "./ChannelSelect";

type Unit = "days" | "weeks" | "months" | "years";
const UNIT_DAYS: Record<Unit, number> = {
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
};

/** Pair of inputs that lets the user say "in the last 3 months" or "in the
 * last 7 days" — sandcastles uses this two-field shape. We translate to a
 * single `postedInLastDays` number before hitting the backend so the API
 * stays simple. */
function PostedInLast({
  filters,
  set,
}: {
  filters: FeedQuery;
  set: (p: Partial<FeedQuery>) => void;
}) {
  // Best-guess the unit when restoring from a saved filter: largest unit
  // that divides cleanly, with days as the fallback.
  const initial: { n: string; unit: Unit } = (() => {
    const d = filters.postedInLastDays;
    if (!d) return { n: "", unit: "days" };
    if (d % 365 === 0) return { n: String(d / 365), unit: "years" };
    if (d % 30 === 0) return { n: String(d / 30), unit: "months" };
    if (d % 7 === 0) return { n: String(d / 7), unit: "weeks" };
    return { n: String(d), unit: "days" };
  })();
  const [n, setN] = useState(initial.n);
  const [unit, setUnit] = useState<Unit>(initial.unit);

  const apply = (rawN: string, rawUnit: Unit): void => {
    setN(rawN);
    setUnit(rawUnit);
    const num = Number(rawN);
    set({
      postedInLastDays: num > 0 ? num * UNIT_DAYS[rawUnit] : undefined,
    });
  };

  return (
    <div className="space-y-1">
      <Label>Posted in last</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          value={n}
          min={0}
          onChange={(e) => apply(e.target.value, unit)}
          className="w-20 py-1.5"
        />
        <Select
          value={unit}
          onChange={(e) => apply(n, e.target.value as Unit)}
          className="flex-1 py-1.5"
        >
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </Select>
      </div>
    </div>
  );
}

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
  const deleteFilter = useMutation({
    mutationFn: (id: string) =>
      api(`/settings/saved-filters/${id}`, { method: "DELETE" }),
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
              <div
                key={sf.id}
                className="group flex w-full items-center gap-1 rounded-lg bg-version-bg pr-1 text-sm text-version-fg"
              >
                <button
                  onClick={() => set(sf.params as FeedQuery)}
                  className="flex flex-1 items-center gap-2 px-3 py-2 text-left"
                >
                  ⭐ {sf.name}
                </button>
                {/* Trash icon — opacity-only hover-reveal so saved-filter
                    rows stay clean by default. Confirms before deleting
                    to avoid an accidental click on a tight row. */}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete filter "${sf.name}"?`)) {
                      deleteFilter.mutate(sf.id);
                    }
                  }}
                  disabled={deleteFilter.isPending}
                  aria-label={`Delete filter ${sf.name}`}
                  className="rounded p-1 text-faint opacity-0 transition-opacity hover:bg-nav-active hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
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
        <ChannelSelect
          channels={channels}
          value={filters.channelId}
          onChange={(id) => set({ channelId: id })}
        />
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

      <PostedInLast filters={filters} set={set} />

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
