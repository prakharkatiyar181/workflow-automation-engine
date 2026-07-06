import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-gray-800/80",
        className
      )}
    />
  );
}

export function PipelineCardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
