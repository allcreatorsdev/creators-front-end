import Link from "next/link";

export function PlanCard({ planName }: { planName: string }) {
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
