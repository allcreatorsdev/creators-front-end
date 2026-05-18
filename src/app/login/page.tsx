"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export default function LoginPage() {
  const { user, loading, signInEmail, signUpEmail, signInGoogle } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/feed");
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") await signInEmail(email, password);
      else await signUpEmail(email, password);
      router.replace("/feed");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Firebase: ", "")
          : "Authentication failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGoogle();
      router.replace("/feed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message.replace("Firebase: ", "") : "Failed",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <Card className="w-full max-w-sm space-y-5 p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="grid size-10 place-items-center rounded-lg bg-linear-to-br from-logo-from to-logo-to text-lg font-bold text-white">
            A
          </div>
          <h1 className="text-xl font-bold">AllCreators</h1>
          <p className="text-sm text-muted">
            {mode === "signin"
              ? "Sign in to your workspace"
              : "Create your account"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-faint">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="secondary"
          disabled={busy}
          onClick={google}
          className="w-full"
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted">
          {mode === "signin" ? "No account?" : "Have an account?"}{" "}
          <button
            type="button"
            onClick={() =>
              setMode(mode === "signin" ? "signup" : "signin")
            }
            className="font-medium text-brand hover:underline"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </Card>
    </div>
  );
}
