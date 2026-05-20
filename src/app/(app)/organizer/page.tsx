"use client";

import { useMemo, useState } from "react";
import { CenteredSpinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Field";
import { IdeaCard } from "@/features/organizer/components/IdeaCard";
import { IdeaModal } from "@/features/organizer/components/IdeaModal";
import { ManageSubjectsModal } from "@/features/organizer/components/ManageSubjectsModal";
import {
  useBoard,
  useCreateIdea,
  useSubjects,
  useAttributions,
} from "@/features/organizer/hooks";
import type { Idea, IdeaStage } from "@/lib/api/types";

const STAGE_LABEL: Record<string, string> = {
  idea: "Idea",
  writing: "Writing",
  editing: "Editing",
  ready: "Ready",
  published: "Published",
};

/** Per-column display cap from the client spec — keeps the kanban scannable
 * even if a stage accumulates dozens of ideas. Extras are hidden behind a
 * "show all" toggle per column. */
const COLUMN_CAP = 10;

export default function OrganizerPage() {
  const [subjectId, setSubjectId] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [selected, setSelected] = useState<Idea | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  // Set of stage names that the user expanded past the 10-card cap.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: board, isLoading } = useBoard(subjectId || undefined);
  const { data: subjects = [] } = useSubjects();
  const { data: attributions = [] } = useAttributions();
  const createIdea = useCreateIdea();

  /** Filter ideas by chosen platform across all columns. Platform comes
   * from either the idea's explicit list or its template (see IdeaCard
   * for the template→platform mapping). */
  const filtered = useMemo(() => {
    if (!board) return [];
    if (!platform) return board.columns;
    return board.columns.map((col) => ({
      ...col,
      ideas: col.ideas.filter((i) => i.platforms.includes(platform)),
    }));
  }, [board, platform]);

  /** Open the empty-idea modal for a new entry. The modal owns the
   * create-on-Done flow — no more `window.prompt` for the title. */
  const startNewIdea = (stage: IdeaStage): void => {
    const draft: Idea = {
      id: "__new__",
      title: "",
      stage,
      fmt: "short_form",
      platforms: [],
      publicationDate: null,
      content: {},
      subject: null,
      attribution: null,
    };
    setSelected(draft);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer</h1>
          <p className="text-sm text-muted">
            Content production pipeline grouped by your subjects
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            className="w-40 py-1.5"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            className="w-40 py-1.5"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">All platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="threads">Threads</option>
            <option value="x">X</option>
          </Select>
          <button
            onClick={() => setManageOpen(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-nav-active"
          >
            ⚙ Manage subjects
          </button>
        </div>
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {filtered.map((col) => {
            const total = col.ideas.length;
            const isExpanded = expanded.has(col.stage);
            const visible =
              isExpanded || total <= COLUMN_CAP
                ? col.ideas
                : col.ideas.slice(0, COLUMN_CAP);
            const hiddenCount = total - visible.length;
            return (
              <div
                key={col.stage}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-canvas"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold">
                    {STAGE_LABEL[col.stage]}{" "}
                    <span className="text-faint">{total}</span>
                  </span>
                  <button
                    onClick={() => startNewIdea(col.stage)}
                    className="text-faint hover:text-text"
                    aria-label="Add idea"
                  >
                    +
                  </button>
                </div>
                <div className="flex-1 space-y-2 px-3 pb-3">
                  {visible.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onOpen={setSelected}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      onClick={() =>
                        setExpanded((s) => new Set(s).add(col.stage))
                      }
                      className="w-full rounded-lg py-2 text-xs font-medium text-brand hover:bg-nav-active"
                    >
                      Show {hiddenCount} more…
                    </button>
                  )}
                  <button
                    onClick={() => startNewIdea(col.stage)}
                    disabled={createIdea.isPending}
                    className="w-full rounded-lg py-2 text-sm text-faint hover:bg-nav-active disabled:opacity-50"
                  >
                    + New idea
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <IdeaModal
        idea={selected}
        subjects={subjects}
        attributions={attributions}
        onClose={() => setSelected(null)}
      />
      <ManageSubjectsModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </div>
  );
}
