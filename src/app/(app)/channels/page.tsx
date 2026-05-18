"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";
import { compactNumber } from "@/lib/utils/format";
import {
  useAddChannel,
  useChannels,
  useDescribeChannels,
  useRemoveAllChannels,
  useRemoveChannel,
} from "@/features/channels/hooks";

const TABS = ["Describe", "Add by URL"] as const;
type Tab = (typeof TABS)[number];
const BADGE: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  youtube: "YT",
};

/** Detect platform + handle from a pasted profile URL (or a bare handle). */
function parseChannelUrl(
  input: string,
  fallbackPlatform: string,
): { platform: string; handle: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  const seg = (u: string) =>
    u
      .replace(/^https?:\/\//, "")
      .split("?")[0]
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean);

  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    const parts = seg(raw).slice(1); // drop the domain
    const handle =
      parts.find((p) => p.startsWith("@"))?.slice(1) ??
      (parts[0] === "channel" || parts[0] === "c" || parts[0] === "user"
        ? parts[1]
        : parts[0]);
    return handle ? { platform: "youtube", handle } : null;
  }
  if (lower.includes("instagram.com")) {
    const h = seg(raw)[1];
    return h ? { platform: "instagram", handle: h.replace(/^@/, "") } : null;
  }
  if (lower.includes("tiktok.com")) {
    const h = seg(raw).find((p) => p.startsWith("@")) ?? seg(raw)[1];
    return h ? { platform: "tiktok", handle: h.replace(/^@/, "") } : null;
  }
  // Not a URL — treat the text as a handle on the selected platform.
  return { platform: fallbackPlatform, handle: raw.replace(/^@/, "") };
}

export default function ChannelsPage() {
  const [tab, setTab] = useState<Tab>("Describe");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [accountSize, setAccountSize] = useState("");
  const [url, setUrl] = useState("");
  const [urlPlatform, setUrlPlatform] = useState("youtube");
  const [urlError, setUrlError] = useState("");

  const { data: channels = [] } = useChannels();
  const describe = useDescribeChannels();
  const addChannel = useAddChannel();
  const removeChannel = useRemoveChannel();
  const removeAll = useRemoveAllChannels();

  const runSearch = () => {
    if (query.trim())
      describe.mutate({
        query,
        platform,
        accountSize: accountSize || undefined,
      });
  };

  const addByUrl = () => {
    setUrlError("");
    const parsed = parseChannelUrl(url, urlPlatform);
    if (!parsed) {
      setUrlError("Enter a channel URL or @handle.");
      return;
    }
    addChannel.mutate(
      { platform: parsed.platform, handle: parsed.handle },
      { onSuccess: () => setUrl("") },
    );
  };

  const exportWatchlist = () => {
    const blob = new Blob([JSON.stringify(channels, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "allcreators-watchlist.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-sm text-muted">
            Pick which channels to include in your feed
          </p>
        </div>

        <div className="flex gap-6 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium",
                tab === t
                  ? "border-brand text-brand"
                  : "border-transparent text-muted hover:text-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Describe" && (
          <div className="space-y-4">
            <Input
              placeholder="Search channels by keyword (e.g. “funny”, “pc building”) or @handle"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select
                className="w-44"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </Select>
              <Select
                className="w-44"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                disabled={platform !== "youtube"}
              >
                <option value="">Any size</option>
                <option value="small">Small (&lt;100K)</option>
                <option value="medium">Medium (100K–1M)</option>
                <option value="large">Large (&gt;1M)</option>
              </Select>
              <Button onClick={runSearch} disabled={describe.isPending}>
                {describe.isPending ? "Searching…" : "Search ⏎"}
              </Button>
            </div>
            <p className="text-xs text-faint">
              Keyword search works on all platforms. YouTube is instant;
              Instagram/TikTok search is live via Apify so it can take
              ~15–40s. Click Add to pull a channel&apos;s real videos into
              your feed.
            </p>

            {describe.isPending ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : describe.data && describe.data.length > 0 ? (
              <div className="space-y-2">
                {describe.data.map((c, i) => {
                  const added = channels.some(
                    (w) => w.platform === c.platform && w.handle === c.handle,
                  );
                  return (
                    <Card
                      key={`${c.platform}:${c.handle}:${i}`}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="rounded bg-nav-active px-1.5 py-0.5 text-[10px] font-bold text-muted">
                          {BADGE[c.platform]}
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium">
                          {c.displayName}
                          {c.resolved ? (
                            <span className="text-muted">
                              {" "}
                              · {compactNumber(c.followers)} followers
                            </span>
                          ) : (
                            <span className="text-faint">
                              {" "}
                              · stats fetched after you add
                            </span>
                          )}
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        disabled={addChannel.isPending || added}
                        onClick={() =>
                          addChannel.mutate({
                            platform: c.platform,
                            handle: c.handle,
                          })
                        }
                      >
                        {added
                          ? "✓ Added"
                          : addChannel.isPending
                            ? "Adding…"
                            : "Add"}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ) : describe.data ? (
              <p className="py-16 text-center text-sm text-muted">
                No channels found for “{query}”. Try different keywords or an
                exact @handle.
              </p>
            ) : (
              <p className="py-16 text-center text-sm text-muted">
                Search any platform by keyword or @handle, then Add the ones
                you want.
              </p>
            )}
          </div>
        )}

        {tab === "Add by URL" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select
                className="w-44"
                value={urlPlatform}
                onChange={(e) => setUrlPlatform(e.target.value)}
              >
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </Select>
              <Input
                className="min-w-60 flex-1"
                placeholder="Paste a channel URL or @handle"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addByUrl()}
              />
              <Button onClick={addByUrl} disabled={addChannel.isPending}>
                {addChannel.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
            {urlError && (
              <p className="text-xs text-red-600">{urlError}</p>
            )}
            <p className="text-xs text-muted">
              Paste any channel URL (youtube.com/@…, instagram.com/…,
              tiktok.com/@…) — the platform is detected automatically. A bare
              @handle uses the selected platform. Adding it starts pulling
              its videos into your feed.
            </p>
          </div>
        )}
      </div>

      <Card className="h-fit w-80 shrink-0 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Your Watchlist</h2>
            <p className="text-xs text-muted">{channels.length} channels</p>
          </div>
          <span className="text-xs font-medium text-green-600">
            Auto-saved ✓
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {channels.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "relative size-9 shrink-0 rounded-full",
                  `grad-${c.avatarGradient}`,
                )}
              >
                <span className="absolute -bottom-1 -right-1 rounded bg-white px-1 text-[9px] font-bold text-text shadow">
                  {BADGE[c.platform]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.handle}</p>
                {c.scraping ? (
                  <p className="flex items-center gap-1 text-xs text-brand">
                    <Spinner className="size-3" /> Fetching videos…
                  </p>
                ) : c.followers === 0 && c.totalViews === 0 ? (
                  <p className="text-xs text-red-600">
                    ⚠ No videos found — check the @handle
                  </p>
                ) : (
                  <p className="text-xs text-muted">
                    {compactNumber(c.followers)} followers ·{" "}
                    {compactNumber(c.totalViews)} views
                  </p>
                )}
              </div>
              <button
                onClick={() => removeChannel.mutate(c.id)}
                className="text-faint hover:text-red-600"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          {channels.length === 0 && (
            <p className="text-xs text-faint">No channels yet</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
          <button
            onClick={() => {
              if (
                channels.length &&
                window.confirm(`Remove all ${channels.length} channels?`)
              )
                removeAll.mutate();
            }}
            disabled={!channels.length || removeAll.isPending}
            className="text-muted hover:text-red-600 disabled:opacity-50"
          >
            {removeAll.isPending ? "Removing…" : "Remove all"}
          </button>
          <button
            onClick={exportWatchlist}
            disabled={!channels.length}
            className="text-muted hover:text-text disabled:opacity-50"
          >
            ↗ Export
          </button>
        </div>
      </Card>
    </div>
  );
}
