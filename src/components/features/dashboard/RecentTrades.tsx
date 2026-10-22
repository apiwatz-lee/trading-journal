import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatShortDate } from "@/lib/utils";
import type { Trade } from "@/types/trade";
import { pnlColor, SideBadge } from "@/components/features/trades/TradeBadges";

interface RecentTradesProps {
  trades: Trade[];
  limit?: number;
  className?: string;
}

export function RecentTrades({ trades, limit = 6, className }: RecentTradesProps) {
  const recent = trades.slice(0, limit);

  return (
    <Card
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900 ring-0 [--card-spacing:--spacing(5)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-zinc-100">
            Recent trades
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Latest {recent.length} closed positions
          </CardDescription>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Link href="/trades">
            View all
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-y divide-zinc-800/80">
          {recent.map((trade) => (
            <li
              key={trade.id}
              className="flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-200 hover:bg-zinc-800/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <SideBadge side={trade.side} />
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-zinc-100">
                    {trade.symbol}
                  </p>
                  <p className="font-mono text-xs text-zinc-500 tabular-nums">
                    {formatShortDate(trade.entry_date)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-sm font-semibold tabular-nums",
                  pnlColor(trade.pnl),
                )}
              >
                {formatCurrency(trade.pnl, { signed: true })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
