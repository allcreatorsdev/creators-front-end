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
  CloseIcon,
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

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
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

/** The sidebar is rendered twice in the layout: once as a static panel on
 * lg+ screens, once as a slide-in drawer on mobile. The two render paths
 * share this body; the drawer mode adds the close button + dismiss-on-nav
 * behavior so a link tap collapses the menu. */
export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
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

  // The drawer variant is fixed and slides in over the page. The static
  // variant uses sticky + reserves its 16rem of layout width on lg+. We
  // gate which one is rendered with Tailwind responsive classes from the
  // parent (the layout renders both with `hidden lg:flex` / `lg:hidden`).
  const isDrawer = onClose !== undefined;

  return (
    <>
      {/* Backdrop — drawer only. Tapping it closes the menu. */}
      {isDrawer && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-bg",
          isDrawer
            ? cn(
                "fixed inset-y-0 left-0 z-50 h-dvh w-72 transition-transform lg:hidden",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
              )
            : "sticky top-0 h-dvh w-64 shrink-0",
        )}
      >
        <div className="flex items-center gap-2 p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-logo-from to-logo-to text-sm font-bold text-white">
            {me?.workspace.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="flex-1 truncate text-sm font-semibold">
            {me?.workspace.name ?? "My Workspace"}
          </span>
          {isDrawer ? (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-faint hover:bg-nav-active hover:text-text"
              aria-label="Close menu"
            >
              <CloseIcon className="size-4" />
            </button>
          ) : (
            <ChevronIcon className="size-4 text-faint" />
          )}
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
                    onNavigate={isDrawer ? onClose : undefined}
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
    </>
  );
}
