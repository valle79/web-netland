interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-netland-light ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-soft">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}