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
  const invalidate = useBoardInvalidator();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api<Idea>(`/organizer/ideas/${id}`, { method: "PATCH", body: patch }),
    onSuccess: invalidate,
  });
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
