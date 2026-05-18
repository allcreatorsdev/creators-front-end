"use client";

import { useState } from "react";
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

export default function OrganizerPage() {
  const [subjectId, setSubjectId] = useState<string>("");
  const [selected, setSelected] = useState<Idea | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const { data: board, isLoading } = useBoard(subjectId || undefined);
  const { data: subjects = [] } = useSubjects();
  const { data: attributions = [] } = useAttributions();
  const createIdea = useCreateIdea();

  const addIdea = (stage: IdeaStage) => {
    const title = window.prompt("Idea title");
    if (title) createIdea.mutate({ title, stage });
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
        <div className="flex items-center gap-3">
          <Select
            className="w-44 py-1.5"
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
          {board?.columns.map((col) => (
            <div
              key={col.stage}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-canvas"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold">
                  {STAGE_LABEL[col.stage]}{" "}
                  <span className="text-faint">{col.count}</span>
                </span>
                <button
                  onClick={() => addIdea(col.stage)}
                  disabled={createIdea.isPending}
                  className="text-faint hover:text-text disabled:opacity-50"
                  aria-label="Add idea"
                >
                  +
                </button>
              </div>
              <div className="flex-1 space-y-2 px-3 pb-3">
                {col.ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onOpen={setSelected}
                  />
                ))}
                <button
                  onClick={() => addIdea(col.stage)}
                  disabled={createIdea.isPending}
                  className="w-full rounded-lg py-2 text-sm text-faint hover:bg-nav-active disabled:opacity-50"
                >
                  {createIdea.isPending ? "Adding…" : "+ New idea"}
                </button>
              </div>
            </div>
          ))}
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
