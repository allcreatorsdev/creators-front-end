"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { RequireAuth } from "@/features/auth/RequireAuth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <RequireAuth>
      <div className="flex min-h-dvh">
        {/* Static sidebar — desktop only. */}
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
        {/* Drawer sidebar — mobile only. Slides in over the page. */}
        <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <MobileTopBar onOpenMenu={() => setMenuOpen(true)} />
          <div className="mx-auto max-w-350 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
