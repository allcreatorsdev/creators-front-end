import { cn } from "@/lib/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-5 animate-spin rounded-full border-2 border-border",
        "border-t-brand",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function CenteredSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="size-8" />
    </div>
  );
}
