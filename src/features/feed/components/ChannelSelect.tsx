"use client";

import { useEffect, useRef, useState } from "react";
import { ChannelAvatar } from "@/components/ui/ChannelAvatar";
import { cn } from "@/lib/utils/cn";
import { compactNumber } from "@/lib/utils/format";
import type { Channel } from "@/lib/api/types";

/** Custom Channels dropdown: each row shows a rounded avatar, the
 * channel name, and the follower count — matching the Sandcastle
 * reference. A plain `<select>` can't render avatars or two-line
 * content, so we ship our own. Auto-closes on outside click + Escape. */
export function ChannelSelect({
  channels,
  value,
  onChange,
}: {
  channels: Channel[] | undefined;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = channels?.find((c) => c.id === value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border",
          "bg-bg px-3 py-1.5 text-sm text-text hover:border-brand",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <ChannelAvatar channel={selected} size={24} />
              <span className="truncate">{selected.displayName}</span>
            </>
          ) : (
            <span className="text-muted">All channels</span>
          )}
        </span>
        <span className="shrink-0 text-faint">▾</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto",
            "rounded-lg border border-border bg-bg p-1 shadow-lg",
          )}
        >
          <Row
            label="All channels"
            active={!value}
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          />
          {channels?.map((c) => (
            <Row
              key={c.id}
              label={c.displayName}
              meta={`${compactNumber(c.followers)} followers`}
              avatar={<ChannelAvatar channel={c} size={24} />}
              active={c.id === value}
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
            />
          ))}
          {channels && channels.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted">
              No channels in your watchlist yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  meta,
  avatar,
  active,
  onClick,
}: {
  label: string;
  meta?: string;
  avatar?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        active ? "bg-nav-active text-text" : "hover:bg-nav-active",
      )}
    >
      {avatar}
      <span className="flex-1 truncate">{label}</span>
      {meta && <span className="shrink-0 text-xs text-faint">{meta}</span>}
    </button>
  );
}

