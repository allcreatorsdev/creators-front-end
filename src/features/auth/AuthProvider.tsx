"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, googleProvider } from "@/lib/firebase/client";
import { setAuthToken } from "@/lib/api/client";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    // Fires on sign-in/out AND on hourly token refresh.
    return onIdTokenChanged(auth, async (fbUser) => {
      if (fbUser) {
        setAuthToken(await fbUser.getIdToken());
        setUser(fbUser);
        qc.invalidateQueries();
      } else {
        setAuthToken(null);
        setUser(null);
        qc.clear();
      }
      setLoading(false);
    });
  }, [qc]);

  const value: AuthCtx = {
    user,
    loading,
    signInEmail: async (e, p) => {
      await signInWithEmailAndPassword(auth, e, p);
    },
    signUpEmail: async (e, p) => {
      await createUserWithEmailAndPassword(auth, e, p);
    },
    signInGoogle: async () => {
      await signInWithPopup(auth, googleProvider);
    },
    logout: async () => {
      await signOut(auth);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
