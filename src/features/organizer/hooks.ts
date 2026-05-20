"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type {
  Attribution,
  Board,
  Idea,
  Subject,
} from "@/lib/api/types";

export function useBoard(subjectId?: string) {
  return useQuery({
    queryKey: qk.board(subjectId),
    queryFn: () =>
      api<Board>("/organizer/board", {
        query: { subject_id: subjectId },
      }),
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: qk.subjects,
    queryFn: () => api<Subject[]>("/organizer/subjects"),
  });
}

export function useAttributions() {
  return useQuery({
    queryKey: qk.attributions,
    queryFn: () => api<Attribution[]>("/organizer/attributions"),
  });
}

function useBoardInvalidator() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["board"] });
  };
}

export function useCreateIdea() {
  const invalidate = useBoardInvalidator();
  return useMutation({
    mutationFn: (body: Partial<Idea> & { title: string; stage: string }) =>
      api<Idea>("/organizer/ideas", { method: "POST", body }),
    onSuccess: invalidate,
  });
}

export function useUpdateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api<Idea>(`/organizer/ideas/${id}`, { method: "PATCH", body: patch }),
    // Optimistic update — the kanban moves the card to its new column
    // INSTANTLY when the user clicks "Move to next stage", instead of
    // waiting 2-5 s for the slow remote DB to confirm + re-fetch.
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["board"] });
      const snapshots = qc.getQueriesData<Board>({ queryKey: ["board"] });
      qc.setQueriesData<Board>({ queryKey: ["board"] }, (old) =>
        old ? applyIdeaPatchToBoard(old, id, patch) : old,
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back every board cache we touched.
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      // Background refresh to reconcile with server truth (catches any
      // server-side fields we couldn't predict locally).
      qc.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

/** Apply a single-idea patch to a cached Board snapshot, including the
 * column move when `patch.stage` changes. Pure — does not mutate. */
function applyIdeaPatchToBoard(
  board: Board,
  id: string,
  patch: Record<string, unknown>,
): Board {
  // Locate the idea (any column) so we can pull it out.
  let target: Idea | undefined;
  for (const col of board.columns) {
    target = col.ideas.find((i) => i.id === id);
    if (target) break;
  }
  if (!target) return board;

  const merged: Idea = { ...target, ...patch } as Idea;
  const newStage = (patch as { stage?: string }).stage ?? target.stage;

  return {
    columns: board.columns.map((col) => {
      // Remove from old column
      const without = col.ideas.filter((i) => i.id !== id);
      // Add to new column (same idea, possibly with patched fields)
      if (col.stage === newStage) {
        return { ...col, count: without.length + 1, ideas: [...without, merged] };
      }
      return { ...col, count: without.length, ideas: without };
    }),
  };
}

export function useDeleteIdea() {
  const invalidate = useBoardInvalidator();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/organizer/ideas/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useGenerateScript() {
  const invalidate = useBoardInvalidator();
  return useMutation({
    mutationFn: (id: string) =>
      api<Idea>(`/organizer/ideas/${id}/generate-script`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useSubjectMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.subjects });
    qc.invalidateQueries({ queryKey: ["board"] });
  };
  return {
    create: useMutation({
      mutationFn: (name: string) =>
        api<Subject>("/organizer/subjects", {
          method: "POST",
          body: { name },
        }),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        api(`/organizer/subjects/${id}`, { method: "DELETE" }),
      onSuccess: refresh,
    }),
  };
}

export function useAttributionMutations() {
  const qc = useQueryClient();
  const refresh = () =>
    qc.invalidateQueries({ queryKey: qk.attributions });
  return {
    create: useMutation({
      mutationFn: (handle: string) =>
        api<Attribution>("/organizer/attributions", {
          method: "POST",
          body: { handle },
        }),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        api(`/organizer/attributions/${id}`, { method: "DELETE" }),
      onSuccess: refresh,
    }),
  };
}
