import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="rounded-xl border border-zinc-800 bg-zinc-900 ring-0 [--card-spacing:--spacing(5)]"
        >
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20 bg-zinc-800" />
              <Skeleton className="size-8 rounded-lg bg-zinc-800" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-32 bg-zinc-800" />
              <Skeleton className="h-3 w-24 bg-zinc-800" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
