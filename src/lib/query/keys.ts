/** Central TanStack Query key registry. */

export const qk = {
  me: ["me"] as const,
  workspaces: ["workspaces"] as const,
  channels: ["channels"] as const,
  feed: (params: Record<string, unknown>) => ["feed", params] as const,
  video: (id: string) => ["video", id] as const,
  saved: ["saved"] as const,
  board: (subjectId?: string) => ["board", subjectId ?? "all"] as const,
  subjects: ["subjects"] as const,
  attributions: ["attributions"] as const,
  savedFilters: ["savedFilters"] as const,
  profile: ["profile"] as const,
  usage: ["usage"] as const,
  featureFlags: ["featureFlags"] as const,
  subscription: ["subscription"] as const,
  plans: ["plans"] as const,
};
