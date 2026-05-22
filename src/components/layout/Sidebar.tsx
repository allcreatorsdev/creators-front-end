"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { useMe } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";
import type { Board, Video } from "@/lib/api/types";
import { PlanCard } from "./PlanCard";
import {
  ChannelsIcon,
  ChevronIcon,
  FeedIcon,
  LogoutIcon,
  OrganizerIcon,
  SavedIcon,
  SettingsIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  badge?: number;
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        active
          ? "bg-nav-active text-text"
          : "text-muted hover:bg-nav-active hover:text-text",
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span className="rounded-full bg-nav-active px-2 py-0.5 text-xs text-muted">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const { data: saved } = useQuery({
    queryKey: qk.saved,
    queryFn: () => api<Video[]>("/saved"),
  });
  const { data: board } = useQuery({
    queryKey: qk.board(),
    queryFn: () => api<Board>("/organizer/board"),
  });

  const ideaCount =
    board?.columns.reduce((sum, c) => sum + c.count, 0) ?? undefined;

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Research",
      items: [
        { href: "/feed", label: "Feed", icon: FeedIcon },
        {
          href: "/saved",
          label: "Video saved",
          icon: SavedIcon,
          badge: saved?.length ?? 0,
        },
      ],
    },
    {
      label: "Create",
      items: [
        {
          href: "/organizer",
          label: "Organizer",
          icon: OrganizerIcon,
          badge: ideaCount,
        },
      ],
    },
    {
      label: "Setup",
      items: [
        { href: "/channels", label: "Channels", icon: ChannelsIcon },
        { href: "/settings", label: "Settings", icon: SettingsIcon },
        ...(me?.isAdmin
          ? [{ href: "/admin", label: "Admin", icon: SettingsIcon }]
          : []),
      ],
    },
  ];

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-border bg-bg">
      <div className="flex items-center gap-2 p-4">
        <div className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-logo-from to-logo-to text-sm font-bold text-white">
          {me?.workspace.name?.[0]?.toUpperCase() ?? "A"}
        </div>
        <span className="flex-1 truncate text-sm font-semibold">
          {me?.workspace.name ?? "My Workspace"}
        </span>
        <ChevronIcon className="size-4 text-faint" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-faint">
              {g.label}
            </p>
            <div className="space-y-1">
              {g.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <PlanCard
          planName={
            me
              ? me.workspace.planTier.charAt(0).toUpperCase() +
                me.workspace.planTier.slice(1)
              : null
          }
        />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-nav-active hover:text-text disabled:opacity-50"
        >
          <LogoutIcon className="size-4.5 shrink-0" />
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </aside>
  );
}
