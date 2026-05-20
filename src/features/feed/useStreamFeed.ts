"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/config/env";
import { authHeaders } from "@/lib/api/client";
import type { Video } from "@/lib/api/types";
import type { FeedQuery } from "./hooks";

/** What the feed page sees while a `/videos/stream` request is in flight. */
export type StreamFeedState = {
  /** Videos that have arrived so far (grows as the stream progresses). */
  items: Video[];
  /** From the first `{meta}` chunk — `null` until it lands. */
  total: number | null;
  /** Page-size from the meta chunk; used to render placeholder skeletons
   * for slots that haven't been filled yet. */
  expected: number | null;
  hasNext: boolean;
  /** True from the moment a request starts until everything has been
   * revealed (or error). Drives the skeleton placeholders. */
  isStreaming: boolean;
  /** True only on the very first request (no prior items yet). */
  isInitialLoad: boolean;
  error: Error | null;
  /** Patch a single video in the local stream — used to surface mutation
   * results (analyze, save toggle) without waiting for a full re-stream.
   * Pass either a partial object to merge or a full replacement. */
  patchItem: (id: string, patch: Partial<Video>) => void;
};

type Meta = {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
};

/** Milliseconds between revealing each new card. A small per-row delay
 * makes the streaming visible — on a fast remote DB all rows arrive in
 * ~1 frame, which React would batch into a single render. Spreading the
 * reveal over ~50ms slots lets the user actually perceive cards popping
 * in one at a time. */
const REVEAL_INTERVAL_MS = 60;

function buildQuery(q: FeedQuery): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Hook that streams `/videos/stream` (NDJSON), buffers incoming rows, and
 * reveals them one-by-one on a steady cadence so the user perceives the
 * progressive load even when the network delivers the whole result set in
 * a single frame.
 *
 * - Resets to a fresh skeleton state the instant the query changes (the
 *   prior items disappear immediately on filter change — no awkward wait
 *   for the new fetch to resolve before skeletons appear).
 * - Aborts the previous request so stale chunks can't bleed into the new
 *   result set.
 * - `bust` is a local-only cache-buster (e.g. an incrementing tick) that
 *   forces a re-stream without being sent to the backend.
 */
export function useStreamFeed(
  query: FeedQuery,
  bust: number | string = 0,
): StreamFeedState {
  const patchItem = useCallback(
    (id: string, patch: Partial<Video>): void => {
      setState((s) => ({
        ...s,
        items: s.items.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      }));
    },
    [],
  );

  const [state, setState] = useState<StreamFeedState>({
    items: [],
    total: null,
    expected: null,
    hasNext: false,
    isStreaming: false,
    isInitialLoad: true,
    error: null,
    patchItem,
  });
  // Stable serialisation so two identical filters don't trigger a re-fetch.
  const key = buildQuery(query);
  const bustKey = String(bust);
  // The pageSize the user asked for — used as a sensible skeleton count
  // before the `meta` chunk arrives with the authoritative number.
  const pageSizeGuess =
    typeof query.pageSize === "number" ? query.pageSize : 24;
  const everLoadedRef = useRef(false);

  useEffect(() => {
    const ctrl = new AbortController();
    // Local buffer that the reveal-pacer drains into React state on a
    // steady tick. The reader pushes into it as bytes arrive.
    const queue: Video[] = [];
    let receivedDone = false;
    let drainTimer: ReturnType<typeof setTimeout> | null = null;

    // Reset to "fresh skeleton" state synchronously — happens before the
    // network request is even sent, so filter changes feel instant.
    setState((s) => ({
      ...s,
      items: [],
      total: null,
      expected: pageSizeGuess,
      hasNext: false,
      isStreaming: true,
      isInitialLoad: s.isInitialLoad && !everLoadedRef.current,
      error: null,
    }));

    const tick = (): void => {
      if (ctrl.signal.aborted) return;
      if (queue.length > 0) {
        const v = queue.shift() as Video;
        setState((s) => ({ ...s, items: [...s.items, v] }));
        drainTimer = setTimeout(tick, REVEAL_INTERVAL_MS);
        return;
      }
      if (receivedDone) {
        setState((s) => ({ ...s, isStreaming: false }));
        return;
      }
      // No rows yet (still waiting on bytes) — poll the buffer cheaply.
      drainTimer = setTimeout(tick, 25);
    };
    tick();

    (async () => {
      try {
        const res = await fetch(apiUrl("/videos/stream") + key, {
          signal: ctrl.signal,
          cache: "no-store",
          headers: authHeaders(),
        });
        if (!res.ok || !res.body) {
          throw new Error(`Feed stream failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            const chunk = JSON.parse(line) as
              | { meta: Meta }
              | { video: Video }
              | { done: true };

            if ("meta" in chunk) {
              const m = chunk.meta;
              // We already cleared items + set isStreaming above; the
              // meta chunk just supplies the authoritative counts.
              setState((s) => ({
                ...s,
                total: m.total,
                expected: m.pageSize,
                hasNext: m.hasNext,
              }));
            } else if ("video" in chunk) {
              queue.push(chunk.video);
            } else if ("done" in chunk) {
              receivedDone = true;
            }
          }
        }
        receivedDone = true; // belt-and-braces in case `done` chunk missed
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((s) => ({
          ...s,
          isStreaming: false,
          error: err as Error,
        }));
      } finally {
        everLoadedRef.current = true;
      }
    })();

    return () => {
      ctrl.abort();
      if (drainTimer !== null) clearTimeout(drainTimer);
    };
    // key + bustKey are the canonical deps; pageSizeGuess is derived from
    // key so doesn't need its own entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bustKey]);

  return state;
}
