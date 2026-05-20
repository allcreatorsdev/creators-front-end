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
  /** From the latest `{meta}` chunk — `null` until it lands. */
  total: number | null;
  /** Page-size the backend reported; combined with how many real cards
   * have arrived to compute skeleton slot count. */
  expected: number | null;
  hasNext: boolean;
  /** True from the moment the INITIAL (page 1) request starts until
   * everything has been revealed. Drives the page-level skeleton grid. */
  isStreaming: boolean;
  /** True only on the very first request (no prior items yet). */
  isInitialLoad: boolean;
  /** True while a "Load more" (page > 1) fetch is in flight. Lets the
   * caller show a spinner inside the Load-more button without blanking
   * the existing grid. */
  isLoadingMore: boolean;
  error: Error | null;
  /** Patch a single video so mutation results (analyze, save) appear
   * instantly without a full re-stream. */
  patchItem: (id: string, patch: Partial<Video>) => void;
  /** Add a brand-new video to the TOP of the grid without re-fetching.
   * Used by "Add video URL" so the imported video is instantly visible —
   * a refetch is unreliable for old YouTube videos (real `posted_at` may
   * be years ago, so they sort deep into the feed and the user thinks
   * the import failed). */
  prependItem: (v: Video) => void;
  /** Fetch the next page and APPEND its rows to `items` — instead of
   * resetting like a filter change would. The page tracking is internal
   * so callers don't have to manage page state. */
  loadMore: () => void;
};

type Meta = {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
};

/** Reveal cadence — see notes at the prior version. 60ms × 24 ≈ 1.4s for a
 * full first page, which the user perceives as smooth fill-in. */
const REVEAL_INTERVAL_MS = 60;

/** Strip `page` from the query when computing the dependency key — page
 * isn't a user filter, it's a pagination cursor managed inside the hook.
 * Otherwise every "load more" click would look like a filter change and
 * reset the items array. */
function buildQuery(q: FeedQuery, page: number): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (k === "page") continue;
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  p.set("page", String(page));
  return `?${p.toString()}`;
}

function buildFilterKey(q: FeedQuery): string {
  // Same as buildQuery but excludes page entirely — used as the React
  // effect dependency.
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (k === "page") continue;
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p.toString();
}

/** Streams `/videos/stream` (NDJSON), reveals rows on a steady cadence,
 * supports append-mode pagination via `loadMore()` so the user can scroll
 * through more results without losing what they already see. */
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

  const prependItem = useCallback((v: Video): void => {
    setState((s) => {
      // Dedupe — if the same video already exists, leave it in place
      // rather than creating a duplicate at the top.
      if (s.items.some((it) => it.id === v.id)) return s;
      return {
        ...s,
        items: [v, ...s.items],
        // Bump total so "Showing X of Y" stays consistent.
        total: s.total !== null ? s.total + 1 : s.total,
      };
    });
  }, []);

  const [state, setState] = useState<StreamFeedState>({
    items: [],
    total: null,
    expected: null,
    hasNext: false,
    isStreaming: false,
    isInitialLoad: true,
    isLoadingMore: false,
    error: null,
    patchItem,
    prependItem,
    // Placeholder — replaced once `loadMore` is bound below.
    loadMore: () => {},
  });

  const filterKey = buildFilterKey(query);
  const bustKey = String(bust);
  const pageSizeGuess =
    typeof query.pageSize === "number" ? query.pageSize : 24;
  // Tracks the most recently fetched page so loadMore can ask for page+1
  // without the caller having to thread page state through.
  const lastFetchedPageRef = useRef(1);
  // Aborts the active request when filter changes or unmount fires.
  const activeCtrlRef = useRef<AbortController | null>(null);
  const everLoadedRef = useRef(false);

  /** Shared fetch routine used by both the initial-load effect and
   * loadMore(). `append=false` resets items + meta; `append=true` leaves
   * the existing items intact and just adds new ones as they arrive. */
  const runFetch = useCallback(
    async (page: number, append: boolean): Promise<void> => {
      // Cancel anything in flight — only one request at a time.
      activeCtrlRef.current?.abort();
      const ctrl = new AbortController();
      activeCtrlRef.current = ctrl;
      lastFetchedPageRef.current = page;

      const queue: Video[] = [];
      let receivedDone = false;
      let drainTimer: ReturnType<typeof setTimeout> | null = null;

      // For page 1: clear the grid synchronously so filter changes feel
      // instant. For loadMore: keep items, just toggle isLoadingMore.
      setState((s) => ({
        ...s,
        items: append ? s.items : [],
        total: append ? s.total : null,
        expected: append ? s.expected : pageSizeGuess,
        hasNext: append ? s.hasNext : false,
        isStreaming: !append,
        isLoadingMore: append,
        isInitialLoad: append
          ? false
          : s.isInitialLoad && !everLoadedRef.current,
        error: null,
      }));

      const tick = (): void => {
        if (ctrl.signal.aborted) return;
        if (queue.length > 0) {
          const v = queue.shift() as Video;
          setState((s) => {
            // Dedupe by id — a video might arrive on a later page that
            // already appeared on an earlier interleaved page if the
            // backend ordering shifts. Drop duplicates here so React
            // doesn't warn about repeated keys.
            if (s.items.some((it) => it.id === v.id)) return s;
            return { ...s, items: [...s.items, v] };
          });
          drainTimer = setTimeout(tick, REVEAL_INTERVAL_MS);
          return;
        }
        if (receivedDone) {
          setState((s) => ({
            ...s,
            isStreaming: false,
            isLoadingMore: false,
          }));
          return;
        }
        drainTimer = setTimeout(tick, 25);
      };
      tick();

      try {
        const res = await fetch(
          apiUrl("/videos/stream") + buildQuery(query, page),
          {
            signal: ctrl.signal,
            cache: "no-store",
            headers: authHeaders(),
          },
        );
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
        receivedDone = true;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((s) => ({
          ...s,
          isStreaming: false,
          isLoadingMore: false,
          error: err as Error,
        }));
      } finally {
        everLoadedRef.current = true;
        if (drainTimer !== null) {
          // Let the drainer finish on its own — it will see receivedDone
          // and clear the streaming flags.
        }
      }
    },
    // `query` changes identity on every render but its content is captured
    // via filterKey. We re-create runFetch on filterKey changes so it
    // always sees the latest filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey, pageSizeGuess],
  );

  const loadMore = useCallback((): void => {
    setState((s) => {
      // Guard inside setState so we always see the freshest state.
      // `hasNext` is intentionally NOT in this guard — backend's hasNext
      // flips false when remaining-rows < page_size even though
      // per-platform interleave still has more videos to deliver. The
      // page (feed/page.tsx) uses items.length < total as the source of
      // truth for "show the button at all", which already gates this.
      if (s.isStreaming || s.isLoadingMore) return s;
      if (s.total !== null && s.items.length >= s.total) return s;
      const nextPage = lastFetchedPageRef.current + 1;
      // Fire-and-forget — the fetch updates state via its own setStates.
      void runFetch(nextPage, true);
      return s;
    });
  }, [runFetch]);

  // Keep state.loadMore pointing at the latest closure so consumers always
  // get a working callback.
  useEffect(() => {
    setState((s) => ({ ...s, loadMore }));
  }, [loadMore]);

  // Initial-load + filter-change effect — always re-fetches page 1 and
  // resets the visible list.
  useEffect(() => {
    void runFetch(1, false);
    return () => {
      activeCtrlRef.current?.abort();
    };
    // bustKey is intentionally part of deps so external "force refresh"
    // (e.g. after Add-video-URL) re-runs the initial fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, bustKey]);

  return state;
}
