"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CenteredSpinner } from "@/components/ui/Spinner";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <CenteredSpinner />
      </div>
    );
  }
  return <>{children}</>;
}
