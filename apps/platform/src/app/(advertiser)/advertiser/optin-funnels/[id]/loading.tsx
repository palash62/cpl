import { Skeleton } from "@/components/ui/skeleton";

export default function FunnelDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <Skeleton className="h-10 w-24" />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-[420px] rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </div>
  );
}
