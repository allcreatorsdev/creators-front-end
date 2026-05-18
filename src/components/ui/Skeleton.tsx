import { cn } from "@/lib/utils/cn";

/** Shimmer placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-nav-active", className)}
      aria-hidden
    />
  );
}

/** Placeholder matching a single feed VideoCard. */
export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-9/16 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

/** Grid of feed card placeholders shown while the feed is loading/filtering. */
export function FeedSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}
