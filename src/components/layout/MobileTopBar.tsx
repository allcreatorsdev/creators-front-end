"use client";

import { useMe } from "@/features/auth/hooks";
import { MenuIcon } from "./icons";

/** Slim header that only renders below lg. Holds the hamburger toggle and a
 * workspace initial so the user has a sense of context after the static
 * sidebar disappears on small screens. */
export function MobileTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { data: me } = useMe();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg px-4 py-3 lg:hidden">
      <button
        onClick={onOpenMenu}
        className="rounded-md p-1.5 text-text hover:bg-nav-active"
        aria-label="Open menu"
      >
        <MenuIcon className="size-5" />
      </button>
      <div className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-logo-from to-logo-to text-sm font-bold text-white">
        {me?.workspace.name?.[0]?.toUpperCase() ?? "A"}
      </div>
      <span className="truncate text-sm font-semibold">
        {me?.workspace.name ?? "AllCreators"}
      </span>
    </div>
  );
}
