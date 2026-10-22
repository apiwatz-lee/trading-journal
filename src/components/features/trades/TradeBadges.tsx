import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TradeSide, TradeStatus } from "@/types/trade";

const SIDE_STYLES: Record<TradeSide, string> = {
  LONG: "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20",
  SHORT: "bg-rose-400/10 text-rose-400 ring-rose-400/20",
};

const STATUS_STYLES: Record<TradeStatus, string> = {
  WIN: "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20",
  LOSS: "bg-rose-400/10 text-rose-400 ring-rose-400/20",
  BREAKEVEN: "bg-zinc-400/10 text-zinc-400 ring-zinc-400/20",
};

export function SideBadge({
  side,
  className,
}: {
  side: TradeSide;
  className?: string;
}) {
  const Icon = side === "LONG" ? ArrowUpRight : ArrowDownRight;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-md border-0 px-1.5 font-mono text-[11px] font-semibold tracking-wide ring-1",
        SIDE_STYLES[side],
        className,
      )}
    >
      <Icon className="size-3!" />
      {side}
    </Badge>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: TradeStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border-0 px-1.5 font-mono text-[11px] font-semibold tracking-wide ring-1",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </Badge>
  );
}

/** Colour helper for any PnL-like number. */
export function pnlColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-zinc-400";
}
