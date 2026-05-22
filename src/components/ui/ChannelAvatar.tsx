"use client";

import { useState } from "react";
import { apiUrl } from "@/config/env";
import { cn } from "@/lib/utils/cn";
import type { Channel } from "@/lib/api/types";

// Track failed-to-load avatar IDs in-memory so other instances on the
// same page skip the retry. IG/TT CDN URLs are blocked cross-origin by
// the browser, and the backend may not have stored the durable copy
// yet — both cases land on the gradient fallback.
const _avatarFails = new Set<string>();

/** Channel avatar — fetched same-origin via `/media/avatar/{channel_id}`
 * (backend stores a durable copy of the IG/TikTok/YouTube profile pic
 * because raw CDN URLs are blocked cross-origin). Falls back to the
 * gradient placeholder on 404 / load error, so the UI is never broken.
 *
 * Used everywhere a channel circle appears — sidebar watchlist, filter
 * dropdown, future surfaces — to guarantee the same behaviour. */
export function ChannelAvatar({
  channel,
  size = 24,
  className,
}: {
  channel: Pick<Channel, "id" | "avatarUrl" | "avatarGradient">;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(_avatarFails.has(channel.id));
  const sizeClass = `size-[${size}px]`;

  if (channel.avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={apiUrl(`/media/avatar/${channel.id}`)}
        alt=""
        width={size}
        height={size}
        onError={() => {
          _avatarFails.add(channel.id);
          setFailed(true);
        }}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeClass,
          className,
        )}
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full",
        `grad-${channel.avatarGradient}`,
        className,
      )}
    />
  );
}
