"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Attribution, Idea, Subject } from "@/lib/api/types";
import {
  useDeleteIdea,
  useGenerateScript,
  useUpdateIdea,
} from "../hooks";

const STAGES = ["idea", "writing", "editing", "ready", "published"];
const STAGE_LABEL = (s: string) => s[0].toUpperCase() + s.slice(1);
const FORMATS = [
  ["short_form", "Short form"],
  ["long_form", "Long form"],
  ["carousel", "Carousel"],
  ["tweet", "Tweet"],
  ["newsletter", "Newsletter"],
] as const;
const PLATFORMS = ["instagram", "tiktok", "youtube"];

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}

export function IdeaModal({
  idea,
  subjects,
  attributions,
  onClose,
}: {
  idea: Idea | null;
  subjects: Subject[];
  attributions: Attribution[];
  onClose: () => void;
}) {
  const update = useUpdateIdea();
  const del = useDeleteIdea();
  const genScript = useGenerateScript();
  const [content, setContent] = useState<Record<string, string>>({});
  // Stage is staged locally and only persisted on "Done" / "Move to next
  // stage" — picking it from the dropdown no longer instantly moves the card.
  const [stage, setStage] = useState<string>("idea");
  const [committing, setCommitting] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (idea) {
      setContent((idea.content as Record<string, string>) ?? {});
      setStage(idea.stage);
    }
  }, [idea]);

  if (!idea) return null;

  const patch = (p: Record<string, unknown>) =>
    update.mutate({ id: idea.id, patch: p });

  const saveContent = (next: Record<string, string>) => {
    setContent(next);
    patch({ content: next });
  };

  const togglePlatform = (p: string) => {
    const has = idea.platforms.includes(p);
    setPendingPlatform(p);
    update.mutate(
      {
        id: idea.id,
        patch: {
          platforms: has
            ? idea.platforms.filter((x) => x !== p)
            : [...idea.platforms, p],
        },
      },
      { onSettled: () => setPendingPlatform(null) },
    );
  };

  // Persist the chosen stage, show a spinner while it transfers, then close.
  const commitStage = (target: string) => {
    if (target === idea.stage) {
      onClose();
      return;
    }
    setCommitting(true);
    update.mutate(
      { id: idea.id, patch: { stage: target } },
      {
        onSuccess: () => {
          setCommitting(false);
          onClose();
        },
        onError: () => setCommitting(false),
      },
    );
  };

  const stageIdx = STAGES.indexOf(stage);
  const nextStage =
    stageIdx >= 0 && stageIdx < STAGES.length - 1
      ? STAGES[stageIdx + 1]
      : null;
  const busy = committing || update.isPending;

  return (
    <Modal open={!!idea} onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <input
          defaultValue={idea.title}
          onBlur={(e) =>
            e.target.value !== idea.title && patch({ title: e.target.value })
          }
          className="w-full bg-transparent text-lg font-semibold outline-none"
        />
        <button
          onClick={onClose}
          className="text-faint hover:text-text"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Stage</Label>
            <Select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL(s)}
                </option>
              ))}
            </Select>
            {stage !== idea.stage && (
              <p className="text-xs text-brand">
                Will move to “{STAGE_LABEL(stage)}” when you click Done.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Select
              defaultValue={idea.subject?.id ?? ""}
              onChange={(e) =>
                patch({ subjectId: e.target.value || null })
              }
            >
              <option value="">— None —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Attribution</Label>
            <Select
              defaultValue={idea.attribution?.id ?? ""}
              onChange={(e) =>
                patch({ attributionId: e.target.value || null })
              }
            >
              <option value="">— None —</option>
              {attributions.map((a) => (
                <option key={a.id} value={a.id}>
                  @{a.handle}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Publication date</Label>
            <Input
              type="date"
              defaultValue={idea.publicationDate ?? ""}
              onChange={(e) =>
                patch({ publicationDate: e.target.value || null })
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Platform</Label>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => {
              const active = idea.platforms.includes(p);
              const loading = pendingPlatform === p;
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  disabled={!!pendingPlatform}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium disabled:opacity-60 ${
                    active
                      ? "bg-version-bg text-version-fg"
                      : "border border-border text-muted"
                  }`}
                >
                  {loading && <Spinner className="size-3" />}
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Format</Label>
          <Select
            defaultValue={idea.fmt}
            onChange={(e) => patch({ fmt: e.target.value })}
          >
            {FORMATS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>

        <div className="border-t border-border pt-4">
          {(idea.fmt === "short_form" || idea.fmt === "long_form") && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() =>
                    genScript.mutate(idea.id, {
                      onSuccess: (data) =>
                        setContent(
                          (data.content as Record<string, string>) ?? {},
                        ),
                    })
                  }
                  disabled={genScript.isPending}
                >
                  {genScript.isPending ? (
                    <>
                      <Spinner className="size-4" /> Generating…
                    </>
                  ) : (
                    "✨ Generate script"
                  )}
                </Button>
              </div>
              <Area
                label="Hook"
                value={content.hook ?? ""}
                onChange={(v) => saveContent({ ...content, hook: v })}
              />
              <Area
                label="Observation"
                value={content.observation ?? ""}
                onChange={(v) =>
                  saveContent({ ...content, observation: v })
                }
              />
              <Area
                label="Payoff"
                value={content.payoff ?? ""}
                onChange={(v) => saveContent({ ...content, payoff: v })}
              />
            </div>
          )}
          {idea.fmt === "carousel" && (
            <Area
              label="Carousel pages (one per line)"
              value={content.pages ?? ""}
              onChange={(v) => saveContent({ ...content, pages: v })}
            />
          )}
          {idea.fmt === "tweet" && (
            <Area
              label="Tweet"
              value={content.text ?? ""}
              onChange={(v) => saveContent({ ...content, text: v })}
            />
          )}
          {idea.fmt === "newsletter" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Subject line</Label>
                <Input
                  defaultValue={content.subjectLine ?? ""}
                  onBlur={(e) =>
                    saveContent({ ...content, subjectLine: e.target.value })
                  }
                />
              </div>
              <Area
                label="Body"
                value={content.body ?? ""}
                onChange={(v) => saveContent({ ...content, body: v })}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border p-4">
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            del.mutate(idea.id);
            onClose();
          }}
        >
          Delete
        </Button>
        <div className="flex items-center gap-2">
          {nextStage && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setStage(nextStage);
                commitStage(nextStage);
              }}
            >
              Move to “{STAGE_LABEL(nextStage)}” →
            </Button>
          )}
          <Button disabled={busy} onClick={() => commitStage(stage)}>
            {busy ? (
              <>
                <Spinner className="size-4" /> Saving…
              </>
            ) : (
              "Done"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
