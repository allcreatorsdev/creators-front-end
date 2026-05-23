"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { platformLabel, youtubeEmbed, youtubeId } from "@/lib/utils/video";
import type { Video } from "@/lib/api/types";
import { useAnalyze } from "../hooks";

const TABS = ["Transcript", "Idea", "Hook", "Format"] as const;
type Tab = (typeof TABS)[number];

export function AnalyzedVideoModal({
  video,
  onClose,
}: {
  video: Video | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Transcript");
  const analyze = useAnalyze();

  if (!video) return null;
  const a = video.analysis;
  const ytId = youtubeId(video.url);

  const body: Record<Tab, string> = {
    Transcript: a?.transcript ?? "",
    Idea: a?.idea ?? "",
    Hook: a?.hook ?? "",
    Format: a?.suggestedFormat ?? "",
  };

  return (
    <Modal open={!!video} onClose={onClose}>
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold">{video.title}</h2>
        <p className="text-sm text-muted">
          @{video.username} · {platformLabel(video.platform)}
        </p>
      </div>

      {ytId ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={youtubeEmbed(ytId)}
            title={video.title}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 border-b border-border",
            "bg-nav-active py-4 text-sm font-medium text-brand hover:underline",
          )}
        >
          ▶ Watch on {platformLabel(video.platform)} ↗
        </a>
      )}

      {a ? (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-border px-5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "border-b-2 px-3 py-3 text-sm font-medium",
                  tab === t
                    ? "border-brand text-brand"
                    : "border-transparent text-muted hover:text-text",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-5 text-sm leading-relaxed text-text whitespace-pre-wrap">
            {body[tab] || "—"}
          </div>
        </>
      ) : (
        <div className="space-y-4 p-8 text-center">
          <p className="text-sm text-muted">
            This video hasn&apos;t been analyzed yet.
          </p>
          <button
            onClick={() => analyze.mutate(video.id)}
            disabled={analyze.isPending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {analyze.isPending ? "Analyzing…" : "Analyze now"}
          </button>
        </div>
      )}
    </Modal>
  );
}
