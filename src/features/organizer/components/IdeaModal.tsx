"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { cn } from "@/lib/utils/cn";
import type { Attribution, Idea, Subject } from "@/lib/api/types";
import { TEMPLATE_LABEL, platformsFor } from "../templateMap";
import {
  useCreateIdea,
  useDeleteIdea,
  useGenerateScript,
  useUpdateIdea,
} from "../hooks";

const STAGES = ["idea", "writing", "editing", "ready", "published"];
const STAGE_LABEL = (s: string): string =>
  s[0].toUpperCase() + s.slice(1);

/** Sentinel id used by the organizer page to signal "this is a draft, not
 * a saved idea yet" — the modal switches to create-on-Done mode in that
 * case. */
const NEW_IDEA_ID = "__new__";

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

/** A single row of the property list (Creation date / Status / Subject /
 * …). Matches the layout in the client's PDF: icon column, label column,
 * value column — all aligned. */
function Property({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex w-44 shrink-0 items-center gap-2 text-sm text-muted">
        <span className="w-4 text-center text-base">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
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
  const create = useCreateIdea();
  const del = useDeleteIdea();
  const genScript = useGenerateScript();

  const isDraft = idea?.id === NEW_IDEA_ID;

  // Drafts are edited entirely locally; only persisted on "Done". Saved
  // ideas stream each field change to the backend immediately (legacy
  // behaviour preserved so the kanban stays in sync).
  const [draft, setDraft] = useState<Idea | null>(idea);
  const [content, setContent] = useState<Record<string, string>>({});
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    setDraft(idea);
    setContent(idea ? ((idea.content as Record<string, string>) ?? {}) : {});
  }, [idea]);

  if (!idea || !draft) return null;

  /** For saved ideas, immediately PATCH the field; for drafts, just keep
   * the change local until Done. Same call site either way. */
  const setField = <K extends keyof Idea>(key: K, value: Idea[K]): void => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    if (!isDraft) {
      update.mutate({ id: idea.id, patch: { [key]: value } });
    }
  };

  const saveContent = (next: Record<string, string>): void => {
    setContent(next);
    if (!isDraft) update.mutate({ id: idea.id, patch: { content: next } });
  };

  /** "Done" flow:
   *  - draft → POST create, then close
   *  - saved → PATCH stage if changed, then close
   *  - stage unchanged on a saved idea → just close (no-op)
   *
   * Accepts an optional `targetStage` — passed by the "Move to next stage"
   * button so we don't depend on `draft.stage` which would still be the
   * old value due to React state-update batching at click time. */
  const finish = (targetStage?: string): void => {
    const stage = targetStage ?? draft.stage;
    if (isDraft) {
      if (!draft.title.trim()) {
        return;
      }
      setCommitting(true);
      create.mutate(
        {
          title: draft.title,
          stage,
          subjectId: draft.subject?.id,
          attributionId: draft.attribution?.id,
          fmt: draft.fmt,
          platforms: [],
        } as Parameters<typeof create.mutate>[0],
        {
          onSuccess: () => {
            setCommitting(false);
            onClose();
          },
          onError: () => setCommitting(false),
        },
      );
      return;
    }
    if (stage === idea.stage) {
      onClose();
      return;
    }
    setCommitting(true);
    update.mutate(
      { id: idea.id, patch: { stage } },
      {
        onSuccess: () => {
          setCommitting(false);
          onClose();
        },
        onError: () => setCommitting(false),
      },
    );
  };

  const stageIdx = STAGES.indexOf(draft.stage);
  const nextStage =
    stageIdx >= 0 && stageIdx < STAGES.length - 1
      ? STAGES[stageIdx + 1]
      : null;
  const busy = committing || update.isPending || create.isPending;
  const platforms = platformsFor(draft.fmt, draft.platforms);

  const created = draft.createdAt
    ? new Date(draft.createdAt).toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      })
    : isDraft
      ? "—"
      : "—";

  return (
    <Modal open={!!idea} onClose={onClose}>
      <div className="flex items-start justify-between gap-4 p-5">
        <input
          autoFocus={isDraft}
          value={draft.title}
          placeholder="Untitled"
          onChange={(e) => setField("title", e.target.value)}
          onBlur={(e) => {
            // Persist titles on saved ideas only when they actually change
            // (the controlled `setField` already handles drafts).
            if (!isDraft && e.target.value !== idea.title) {
              update.mutate({ id: idea.id, patch: { title: e.target.value } });
            }
          }}
          className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-faint"
        />
        <button
          onClick={onClose}
          className="text-faint hover:text-text"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 pb-5">
        {/* Property list — mirrors the layout in the client's spec PDF.
            Each row: icon, label, editable value. */}
        <div className="divide-y divide-border border-y border-border">
          <Property icon="⊕" label="Creation date">
            <span className="text-sm text-text">{created}</span>
          </Property>

          {/* "Inspired by" is hidden unless the idea was started from an
              analyzed video via the Take-idea flow. */}
          {draft.sourceVideo && (
            <Property icon="↗" label="Inspired by">
              <a
                href={draft.sourceVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-2 text-sm text-brand hover:underline"
              >
                <PlatformIcon
                  platform={draft.sourceVideo.platform}
                  size={14}
                />
                <span className="truncate">{draft.sourceVideo.title}</span>
                <span className="text-faint">@{draft.sourceVideo.username}</span>
              </a>
            </Property>
          )}

          <Property icon="●" label="Status">
            <Select
              value={draft.stage}
              onChange={(e) =>
                setField("stage", e.target.value as Idea["stage"])
              }
              className="w-48 py-1"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL(s)}
                </option>
              ))}
            </Select>
            {!isDraft && draft.stage !== idea.stage && (
              <span className="ml-2 text-xs text-brand">
                (moves on Done)
              </span>
            )}
          </Property>

          <Property icon="◎" label="Attribution">
            <Select
              value={draft.attribution?.id ?? ""}
              onChange={(e) => {
                const next = attributions.find((a) => a.id === e.target.value);
                setField("attribution", next ?? null);
              }}
              className="w-64 py-1"
            >
              <option value="">— None —</option>
              {attributions.map((a) => (
                <option key={a.id} value={a.id}>
                  @{a.handle}
                </option>
              ))}
            </Select>
          </Property>

          <Property icon="☰" label="Subject">
            <Select
              value={draft.subject?.id ?? ""}
              onChange={(e) => {
                const next = subjects.find((s) => s.id === e.target.value);
                setField("subject", next ?? null);
              }}
              className="w-64 py-1"
            >
              <option value="">Choose one subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Property>

          <Property icon="📅" label="Publication date">
            <Input
              type="date"
              value={draft.publicationDate ?? ""}
              onChange={(e) =>
                setField("publicationDate", e.target.value || null)
              }
              className="w-48 py-1"
            />
          </Property>

          <Property icon="☰" label="Template">
            <Select
              value={draft.fmt}
              onChange={(e) =>
                setField("fmt", e.target.value as Idea["fmt"])
              }
              className="w-64 py-1"
            >
              {(
                ["short_form", "long_form", "carousel", "tweet", "newsletter"] as const
              ).map((f) => (
                <option key={f} value={f}>
                  {TEMPLATE_LABEL[f]}
                </option>
              ))}
            </Select>
          </Property>

          {/* Platforms are derived from the template choice — shown here
              as read-only badges so the user knows where the idea will
              ship. The client spec explicitly says NOT to expose this as
              an editable field. */}
          {platforms.length > 0 && (
            <Property icon="🌐" label="Will publish to">
              <div className="flex flex-wrap items-center gap-2">
                {platforms.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-md bg-nav-active px-2 py-0.5 text-xs font-medium text-muted"
                  >
                    {(p === "instagram" ||
                      p === "tiktok" ||
                      p === "youtube") && (
                      <PlatformIcon platform={p} size={12} />
                    )}
                    {p}
                  </span>
                ))}
              </div>
            </Property>
          )}
        </div>

        {/* Script / content editing — hidden for drafts (you can't generate
            a script from an unsaved idea). Once created, re-opening shows
            the editor. */}
        {!isDraft && (
          <div className="space-y-3 pt-2">
            {(draft.fmt === "short_form" || draft.fmt === "long_form") && (
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
            {draft.fmt === "carousel" && (
              <Area
                label="Carousel pages (one per line)"
                value={content.pages ?? ""}
                onChange={(v) => saveContent({ ...content, pages: v })}
              />
            )}
            {draft.fmt === "tweet" && (
              <Area
                label="Thread / post"
                value={content.text ?? ""}
                onChange={(v) => saveContent({ ...content, text: v })}
              />
            )}
            {draft.fmt === "newsletter" && (
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
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border p-4">
        {isDraft ? (
          <span className="text-xs text-faint">
            New idea — click Done to create.
          </span>
        ) : (
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
        )}
        <div className="flex items-center gap-2">
          {!isDraft && nextStage && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => finish(nextStage)}
              className={cn(busy && "cursor-wait")}
            >
              {busy ? (
                <>
                  <Spinner className="size-4" /> Moving…
                </>
              ) : (
                <>Move to “{STAGE_LABEL(nextStage)}” →</>
              )}
            </Button>
          )}
          <Button
            disabled={busy || (isDraft && !draft.title.trim())}
            onClick={() => finish()}
            className={cn(busy && "cursor-wait")}
          >
            {busy ? (
              <>
                <Spinner className="size-4" /> {isDraft ? "Creating…" : "Saving…"}
              </>
            ) : isDraft ? (
              "Create idea"
            ) : (
              "Done"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
