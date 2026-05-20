"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type {
  Plan,
  Subscription,
  Workspace,
} from "@/lib/api/types";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  picture: string | null;
  appVersion: string;
}
interface Usage {
  creditsRemaining: number;
  videosCount: number;
  ideasCount: number;
  channelsCount: number;
}
interface FeatureFlag {
  key: string;
  enabled: boolean;
}

export const useProfile = () =>
  useQuery({ queryKey: qk.profile, queryFn: () => api<Profile>("/settings/profile") });

export const useUsage = () =>
  useQuery({ queryKey: qk.usage, queryFn: () => api<Usage>("/settings/usage") });

export const useFeatureFlags = () =>
  useQuery({
    queryKey: qk.featureFlags,
    queryFn: () => api<FeatureFlag[]>("/settings/feature-flags"),
  });

export const useSubscription = () =>
  useQuery({
    queryKey: qk.subscription,
    queryFn: () => api<Subscription>("/settings/subscription"),
  });

export const usePlans = () =>
  useQuery({ queryKey: qk.plans, queryFn: () => api<Plan[]>("/settings/plans") });

export const useWorkspaces = () =>
  useQuery({
    queryKey: qk.workspaces,
    queryFn: () => api<Workspace[]>("/workspaces"),
  });

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<Workspace>("/workspaces", { method: "POST", body: { name } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.workspaces });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (plan: string) => {
      const base = `${window.location.origin}/settings?tab=Subscription`;
      return api<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: {
          plan,
          // Stripe substitutes the {CHECKOUT_SESSION_ID} placeholder.
          successUrl: `${base}&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${base}&checkout=cancel`,
        },
      });
    },
    onSuccess: (d) => {
      if (d.url) window.location.href = d.url;
    },
  });
}

export function useConfirmCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api("/billing/confirm", {
        method: "POST",
        body: { sessionId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscription });
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.usage });
    },
  });
}

/** Opens the Stripe Billing Portal — users update card / view invoices /
 * cancel subscription there. Stripe owns the cancel UX so we don't have
 * to build it ourselves. The `from=portal` marker on the return URL lets
 * the settings page know to re-fetch subscription state (in case the user
 * cancelled / reactivated / updated their card). */
export function useBillingPortal() {
  return useMutation({
    mutationFn: () => {
      const returnUrl =
        `${window.location.origin}/settings?tab=Subscription&from=portal`;
      return api<{ url: string }>("/billing/portal", {
        method: "POST",
        body: { returnUrl },
      });
    },
    onSuccess: (d) => {
      if (d.url) window.location.href = d.url;
    },
  });
}
