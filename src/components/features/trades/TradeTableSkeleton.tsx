import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_WIDTHS = ["w-32", "w-24", "w-14", "w-20", "w-20", "w-16", "w-24", "w-14", "w-16", "w-6"];

export function TradeTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading trades"
      className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
    >
      {/* Header */}
      <div className="flex h-11 items-center gap-6 border-b border-zinc-800 px-4">
        {COLUMN_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w} bg-zinc-800`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex h-14 items-center gap-6 border-b border-zinc-800/80 px-4 last:border-0"
          style={{ opacity: 1 - r * 0.1 }}
        >
          {COLUMN_WIDTHS.map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w} bg-zinc-800`} />
          ))}
        </div>
      ))}
    </div>
  );
}
