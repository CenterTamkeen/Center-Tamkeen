import { cn } from "@/lib/utils";

export function LoadingSpinner({
  label = "جاري التحميل...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton min-h-4", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="container-page flex-1 py-10">
      <div className="space-y-6">
        <SkeletonBlock className="h-5 w-28" />
        <SkeletonBlock className="h-9 w-72 max-w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card-modern space-y-4 p-5">
              <SkeletonBlock className="h-5 w-24" />
              <SkeletonBlock className="h-10 w-32" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
          ))}
        </div>
        <div className="glass-panel-strong space-y-4 rounded-xl p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
