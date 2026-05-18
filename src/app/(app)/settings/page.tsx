"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import {
  useCheckout,
  useConfirmCheckout,
  useCreateWorkspace,
  useFeatureFlags,
  usePlans,
  useProfile,
  useSubscription,
  useUsage,
  useWorkspaces,
} from "@/features/settings/hooks";

const NAV = [
  "Profile",
  "Workspaces",
  "Subscription",
  "Usage",
  "Feature Flags",
  "Connectors",
] as const;
type Nav = (typeof NAV)[number];

export default function SettingsPage() {
  const [nav, setNav] = useState<Nav>("Workspaces");
  const { data: profile } = useProfile();
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && (NAV as readonly string[]).includes(t)) setNav(t as Nav);
  }, []);

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <Badge tone="brand">App Version {profile?.appVersion ?? "—"}</Badge>
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-muted">
        <a className="hover:text-text" href="#">💬 Support</a>
        <a className="hover:text-text" href="#">📝 Changelog</a>
        <a className="hover:text-text" href="#">📖 Knowledge Base</a>
        <a className="hover:text-text" href="#">💳 Billing portal</a>
        <button
          onClick={signOut}
          className="font-medium text-red-600 hover:underline"
        >
          ↪ Sign out
        </button>
      </div>

      <div className="flex gap-8">
        <nav className="w-48 shrink-0 space-y-1">
          {NAV.map((n) => (
            <button
              key={n}
              onClick={() => setNav(n)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
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
          {nav === "Feature Flags" && <FlagsPane />}
          {nav === "Connectors" && (
            <Card className="p-6 text-sm text-muted">
              Connectors — coming soon.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfilePane() {
  const { data } = useProfile();
  return (
    <Card className="space-y-3 p-6">
      <h2 className="text-lg font-semibold">Profile</h2>
      <p className="text-sm text-muted">Name: {data?.name ?? "—"}</p>
      <p className="text-sm text-muted">Email: {data?.email ?? "—"}</p>
    </Card>
  );
}

function WorkspacesPane() {
  const { data: workspaces = [] } = useWorkspaces();
  const create = useCreateWorkspace();
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
              {w.isActive && (
                <Badge tone="green">Active</Badge>
              )}
            </p>
            <p className="text-xs text-muted">
              {w.channelCount} channels · {w.memberCount} member
            </p>
          </div>
          <span className="text-faint">⚙</span>
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() => {
          const name = window.prompt("Workspace name");
          if (name) create.mutate(name);
        }}
      >
        + Create workspace
      </Button>
    </Card>
  );
}

function SubscriptionPane() {
  const { data: sub } = useSubscription();
  const { data: plans = [] } = usePlans();
  const checkout = useCheckout();
  const confirm = useConfirmCheckout();
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const status = q.get("checkout");
    const sessionId = q.get("session_id");
    if (status === "success" && sessionId) {
      setBanner("⏳ Confirming your payment…");
      confirm.mutate(sessionId, {
        onSuccess: () => setBanner("✅ Payment confirmed — plan upgraded!"),
        onError: () =>
          setBanner("⚠️ Couldn't confirm the payment. Contact support."),
      });
    } else if (status === "cancel") {
      setBanner("Checkout cancelled — no changes made.");
    }
    if (status) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?tab=Subscription`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {banner && (
        <div className="rounded-lg border border-border bg-nav-active px-4 py-3 text-sm">
          {banner}
        </div>
      )}
      <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted">
        Current plan:{" "}
        <span className="font-semibold capitalize text-text">
          {sub?.plan ?? "—"}
        </span>{" "}
        · {sub?.creditsRemaining ?? 0} credits left
      </div>
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
          const current = sub?.plan === p.tier;
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
                onClick={() => checkout.mutate(p.tier)}
                className="w-full"
              >
                {current
                  ? "Current plan"
                  : p.priceCents === 0
                    ? "Free"
                    : checkout.isPending
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
  const { data } = useUsage();
  const rows = [
    ["Credits remaining", data?.creditsRemaining],
    ["Videos", data?.videosCount],
    ["Ideas", data?.ideasCount],
    ["Channels", data?.channelsCount],
  ] as const;
  return (
    <Card className="divide-y divide-border p-2">
      {rows.map(([label, val]) => (
        <div
          key={label}
          className="flex items-center justify-between px-4 py-3 text-sm"
        >
          <span className="text-muted">{label}</span>
          <span className="font-semibold">{val ?? "—"}</span>
        </div>
      ))}
    </Card>
  );
}

function FlagsPane() {
  const { data: flags = [] } = useFeatureFlags();
  return (
    <Card className="divide-y divide-border p-2">
      {flags.map((f) => (
        <div
          key={f.key}
          className="flex items-center justify-between px-4 py-3 text-sm"
        >
          <span>{f.key}</span>
          <Badge tone={f.enabled ? "green" : "gray"}>
            {f.enabled ? "On" : "Off"}
          </Badge>
        </div>
      ))}
    </Card>
  );
}
