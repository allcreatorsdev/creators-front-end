import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

/** `planName` is `null` while `/me` is still loading — we render a skeleton
 * placeholder rather than the literal "Starter" fallback the page used to
 * flash for ~1 min while a slow remote DB resolved the workspace. */
export function PlanCard({ planName }: { planName: string | null }) {
  if (planName === null) {
    return (
      <div className="rounded-xl border border-plan-border bg-plan-bg p-4">
        <Skeleton className="mx-auto h-6 w-6 rounded-full" />
        <Skeleton className="mx-auto mt-3 h-3 w-32" />
        <Skeleton className="mx-auto mt-2 h-2.5 w-40" />
        <Skeleton className="mx-auto mt-3 h-3 w-20" />
      </div>
    );
  }
  return (
    <Link
      href="/settings?tab=Subscription"
      className="block rounded-xl border border-plan-border bg-plan-bg p-4 text-center transition-colors hover:border-brand hover:bg-nav-active"
    >
      <div className="text-2xl">🚀</div>
      <p className="mt-1 text-sm font-semibold text-plan-fg">
        You&apos;re on the {planName} plan
      </p>
      <p className="mt-1 text-xs text-plan-fg/80">
        Upgrade to a full plan to unlock all features
      </p>
      <span className="mt-2 inline-block text-xs font-semibold text-brand">
        View plans →
      </span>
    </Link>
  );
}
