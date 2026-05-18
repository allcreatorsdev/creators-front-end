"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ApiError } from "@/lib/api/client";
import { useUpgradeStore } from "@/lib/store/upgrade";

const UPGRADE_CODES = new Set(["insufficient_credits", "channel_limit"]);

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (err) => {
            if (err instanceof ApiError && UPGRADE_CODES.has(err.code)) {
              useUpgradeStore.getState().show(err.message);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        {children}
        <UpgradeModal />
      </AuthProvider>
    </QueryClientProvider>
  );
}
