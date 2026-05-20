/** API DTOs — mirror the FastAPI camelCase responses. */

export type Platform = "instagram" | "tiktok" | "youtube";
export type IdeaStage = "idea" | "writing" | "editing" | "ready" | "published";
export type IdeaFormat =
  | "short_form"
  | "long_form"
  | "carousel"
  | "tweet"
  | "newsletter";
export type PlanTier = "starter" | "pro" | "team";

export interface Workspace {
  id: string;
  name: string;
  planTier: PlanTier;
  creditsRemaining: number;
  channelCount: number;
  memberCount: number;
  isActive: boolean;
  provisioning: boolean;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

export interface Me {
  user: User;
  workspace: Workspace;
  isAdmin: boolean;
}

export interface AdminUserRow {
  userId: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  workspaceId: string | null;
  workspaceName: string | null;
  plan: PlanTier | null;
  creditsRemaining: number;
  channelCount: number;
  videoCount: number;
  ideaCount: number;
}

export interface AdminOverview {
  stats: { totalUsers: number; byPlan: Record<string, number> };
  users: AdminUserRow[];
}

export interface VideoAnalysis {
  transcript: string;
  idea: string;
  hook: string;
  suggestedFormat: string;
}

export interface Video {
  id: string;
  platform: Platform;
  title: string;
  caption: string;
  username: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  engagementPct: number;
  outlierScore: number;
  postedAt: string | null;
  coverGradient: string;
  coverUrl: string | null;
  hasThumb: boolean;
  isAnalyzed: boolean;
  isSaved: boolean;
  analysis: VideoAnalysis | null;
}

export interface FeedPage {
  items: Video[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface Channel {
  id: string;
  platform: Platform;
  handle: string;
  displayName: string;
  avatarGradient: string;
  avatarUrl: string | null;
  followers: number;
  totalViews: number;
  inWatchlist: boolean;
  scraping: boolean;
}

export interface ChannelSuggestion {
  platform: Platform;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  followers: number;
  totalViews: number;
  resolved: boolean;
}

export interface ChannelCategory {
  name: string;
  channels: ChannelSuggestion[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Attribution {
  id: string;
  handle: string;
}

export interface Idea {
  id: string;
  title: string;
  stage: IdeaStage;
  fmt: IdeaFormat;
  platforms: string[];
  publicationDate: string | null;
  content: Record<string, unknown>;
  subject: Subject | null;
  attribution: Attribution | null;
}

export interface BoardColumn {
  stage: IdeaStage;
  count: number;
  ideas: Idea[];
}

export interface Board {
  columns: BoardColumn[];
}

export interface SavedFilter {
  id: string;
  name: string;
  params: Record<string, unknown>;
}

export interface Plan {
  tier: PlanTier;
  name: string;
  priceCents: number;
  credits: number;
}

export interface Subscription {
  plan: PlanTier;
  active: boolean;
  creditsRemaining: number;
  currentPeriodEnd: number | null;
  /** True when the user has cancelled but plan is still running until
   * `currentPeriodEnd`. After that they drop back to Starter. */
  cancelAtPeriodEnd: boolean;
}
