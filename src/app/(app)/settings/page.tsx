"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { qk } from "@/lib/query/keys";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import {
  useBillingPortal,
  useCheckout,
  useConfirmCheckout,
  useCreateWorkspace,
  usePlans,
  useProfile,
  useSubscription,
  useUsage,
  useWorkspaces,
} from "@/features/settings/hooks";

// Trimmed to MVP scope — removed Feature Flags + Connectors which were
// dev-only / "coming soon" placeholders not visible to real users.
const NAV = ["Profile", "Workspaces", "Subscription", "Usage"] as const;
type Nav = (typeof NAV)[number];

export default function SettingsPage() {
  const [nav, setNav] = useState<Nav>("Subscription");
  const { data: profile } = useProfile();
  const { logout } = useAuth();
  const router = useRouter();
  const portal = useBillingPortal();

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && (NAV as readonly string[]).includes(t)) setNav(t as Nav);
  }, []);

  const signOut = async (): Promise<void> => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        {profile ? (
          <Badge tone="brand">App Version {profile.appVersion}</Badge>
        ) : (
          <Skeleton className="h-6 w-28 rounded-full" />
        )}
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-muted">
        <button
          onClick={() => portal.mutate()}
          disabled={portal.isPending}
          className="flex items-center gap-1.5 hover:text-text disabled:opacity-50"
        >
          {portal.isPending ? <Spinner className="size-3.5" /> : "💳"}
          {portal.isPending ? "Opening Stripe…" : "Billing portal"}
        </button>
        <button
          onClick={signOut}
          className="font-medium text-red-600 hover:underline"
        >
          ↪ Sign out
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        {/* On mobile this becomes a horizontal scroll strip of pills so all
            tabs stay reachable without consuming a full screen of height. */}
        <nav className="-mx-1 flex shrink-0 gap-1 overflow-x-auto px-1 lg:mx-0 lg:w-48 lg:flex-col lg:space-y-1 lg:overflow-visible lg:px-0">
          {NAV.map((n) => (
            <button
              key={n}
              onClick={() => setNav(n)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium lg:w-full lg:text-left",
                nav === n
                  ? "bg-nav-active text-text"
                  : "text-muted hover:bg-nav-active hover:text-text",
              )}
            >
              {n}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {nav === "Profile" && <ProfilePane />}
          {nav === "Workspaces" && <WorkspacesPane />}
          {nav === "Subscription" && <SubscriptionPane />}
          {nav === "Usage" && <UsagePane />}
        </div>
      </div>
    </div>
  );
}

function ProfilePane() {
  const { data, isLoading } = useProfile();
  if (isLoading || !data) {
    return (
      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-64" />
      </Card>
    );
  }
  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Profile</h2>
      <div className="flex items-center gap-4">
        {data.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.picture}
            alt=""
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <div className="grid size-14 place-items-center rounded-full bg-linear-to-br from-logo-from to-logo-to text-lg font-bold text-white">
            {(data.name ?? data.email ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium">{data.name ?? "—"}</p>
          <p className="truncate text-sm text-muted">{data.email ?? "—"}</p>
        </div>
      </div>
      <p className="border-t border-border pt-3 text-xs text-faint">
        Profile is managed by your Google sign-in. To change your name or
        email, update it in your Google account.
      </p>
    </Card>
  );
}

function WorkspacesPane() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const create = useCreateWorkspace();

  if (isLoading || !workspaces) {
    return (
      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Workspaces</h2>
      {workspaces.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between rounded-xl border border-border p-4"
        >
          <div>
            <p className="flex items-center gap-2 font-medium">
              {w.name}
              {w.isActive && <Badge tone="green">Active</Badge>}
            </p>
            <p className="text-xs text-muted">
              {w.channelCount} channels · {w.memberCount} member
              {w.memberCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        disabled={create.isPending}
        onClick={() => {
          const name = window.prompt("Workspace name");
          if (name) create.mutate(name);
        }}
      >
        {create.isPending ? "Creating…" : "+ Create workspace"}
      </Button>
    </Card>
  );
}

function SubscriptionPane() {
  const { data: sub, isLoading: subLoading } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const checkout = useCheckout();
  const confirm = useConfirmCheckout();
  const portal = useBillingPortal();
  const qc = useQueryClient();
  const [banner, setBanner] = useState<string | null>(null);
  // Track which plan tier is being checked out so we can show the spinner
  // on JUST that card (not all three) when the user clicks Upgrade.
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const status = q.get("checkout");
    const sessionId = q.get("session_id");
    const fromPortal = q.get("from") === "portal";

    if (status === "success" && sessionId) {
      setBanner("⏳ Confirming your payment…");
      confirm.mutate(sessionId, {
        onSuccess: () => setBanner("✅ Payment confirmed — plan upgraded!"),
        onError: () =>
          setBanner("⚠️ Couldn't confirm the payment. Contact support."),
      });
    } else if (status === "cancel") {
      setBanner("Checkout cancelled — no changes made.");
    } else if (fromPortal) {
      // User just came back from the Stripe Customer Portal. They may
      // have cancelled, reactivated, or changed their card. Force a
      // fresh status pull from Stripe so the UI reflects reality.
      setBanner("⏳ Refreshing your subscription…");
      qc.invalidateQueries({ queryKey: qk.subscription }).then(() => {
        setBanner(null);
      });
      qc.invalidateQueries({ queryKey: qk.me });
    }
    if (status || fromPortal) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?tab=Subscription`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plans pane is skeleton until BOTH sub + plans land — avoids the
  // "Free / $0 / Starter" flash that used to appear for ~1 min while the
  // remote DB resolved.
  if (subLoading || plansLoading || !sub || !plans) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const periodEndIso =
    sub.currentPeriodEnd && sub.currentPeriodEnd > 0
      ? new Date(sub.currentPeriodEnd * 1000).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const isPaid = sub.plan !== "starter";

  return (
    <div className="space-y-4">
      {banner && (
        <div className="rounded-lg border border-border bg-nav-active px-4 py-3 text-sm">
          {banner}
        </div>
      )}

      {/* Banner when the user has scheduled cancellation but still has
          access until the period ends — surfaces what they did in Stripe
          portal so they don't wonder whether it actually happened. */}
      {isPaid && sub.cancelAtPeriodEnd && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            ⚠ Your subscription is scheduled to cancel
            {periodEndIso && ` on ${periodEndIso}`}.
          </p>
          <p className="mt-1 text-xs">
            You&apos;ll keep full {sub.plan} access until then, after which
            your workspace drops back to the Starter plan. Changed your
            mind? Click <b>Manage subscription</b> below and choose “Don&apos;t
            cancel”.
          </p>
        </div>
      )}

      {/* Current-plan summary — replaces the old one-line "Current plan: X" */}
      <Card className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-faint">
              Current plan
            </p>
            <p className="mt-1 text-xl font-semibold capitalize">
              {sub.plan}
              {!sub.active && (
                <span className="ml-2 text-xs font-medium text-red-600">
                  (inactive)
                </span>
              )}
              {sub.cancelAtPeriodEnd && (
                <span className="ml-2 text-xs font-medium text-amber-700">
                  (cancelling)
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted">
              {sub.creditsRemaining.toLocaleString()} credits remaining
              {periodEndIso &&
                ` · ${sub.cancelAtPeriodEnd ? "ends" : "renews"} ${periodEndIso}`}
            </p>
          </div>
          {isPaid && (
            <Button
              variant="secondary"
              disabled={portal.isPending}
              onClick={() => portal.mutate()}
              className="shrink-0"
            >
              {portal.isPending ? "Opening…" : "Manage subscription"}
            </Button>
          )}
        </div>
        {isPaid && (
          <p className="border-t border-border pt-3 text-xs text-faint">
            Cancel, reactivate, update card, or download invoices via the
            Stripe billing portal. Changes sync back here automatically.
          </p>
        )}
      </Card>

      <div className="rounded-lg border border-dashed border-border bg-nav-active px-4 py-3 text-xs text-muted">
        🧪 <span className="font-medium text-text">Test mode</span> — use card{" "}
        <span className="font-mono font-semibold text-text">
          4242 4242 4242 4242
        </span>
        , any future expiry (e.g. 12/34), any 3-digit CVC and any ZIP. Other
        numbers (like 4444…) are rejected by Stripe as invalid.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => {
          const current = sub.plan === p.tier;
          const loadingThis = checkout.isPending && redirectingTo === p.tier;
          return (
            <Card key={p.tier} className="space-y-3 p-5">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-2xl font-bold">
                ${(p.priceCents / 100).toFixed(0)}
                <span className="text-sm font-normal text-muted">/mo</span>
              </p>
              <p className="text-xs text-muted">
                {p.credits.toLocaleString()} credits
              </p>
              <Button
                variant={current ? "secondary" : "primary"}
                disabled={
                  current || p.priceCents === 0 || checkout.isPending
                }
                onClick={() => {
                  setRedirectingTo(p.tier);
                  checkout.mutate(p.tier);
                }}
                className="inline-flex w-full items-center justify-center gap-2"
              >
                {loadingThis && <Spinner className="size-3.5" />}
                {current
                  ? "Current plan"
                  : p.priceCents === 0
                    ? "Free"
                    : loadingThis
                      ? "Redirecting…"
                      : "Upgrade"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UsagePane() {
  const { data, isLoading } = useUsage();

  if (isLoading || !data) {
    // The previous '—' placeholder flashed before the real numbers landed
    // (slow remote DB) — show real skeletons so the user knows it's loading
    // rather than wondering if every counter is 0.
    return (
      <Card className="divide-y divide-border p-2">
        {["Credits remaining", "Videos", "Ideas", "Channels"].map((label) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="text-muted">{label}</span>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </Card>
    );
  }

  const rows: [string, number][] = [
    ["Credits remaining", data.creditsRemaining],
    ["Videos", data.videosCount],
    ["Ideas", data.ideasCount],
    ["Channels", data.channelsCount],
  ];
  return (
    <Card className="divide-y divide-border p-2">
      {rows.map(([label, val]) => (
        <div
          key={label}
          className="flex items-center justify-between px-4 py-3 text-sm"
        >
          <span className="text-muted">{label}</span>
          <span className="font-semibold">{val.toLocaleString()}</span>
        </div>
      ))}
    </Card>
  );
}
