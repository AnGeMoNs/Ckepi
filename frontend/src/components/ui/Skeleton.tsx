interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse motion-reduce:animate-none rounded-lg bg-surface-muted ${className}`}
    />
  );
}

export function MapSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
    </div>
  );
}

export function PanelSkeleton({ heightClass = "h-56" }: { heightClass?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4 sm:p-5">
      <Skeleton className="mb-4 h-5 w-52" />
      <Skeleton className={`w-full rounded-xl ${heightClass}`} />
    </div>
  );
}
