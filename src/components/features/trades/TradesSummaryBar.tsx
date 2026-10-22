"use client";

import { useTradeStats } from "@/hooks/useTradeStats";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { Trade } from "@/types/trade";
import { pnlColor } from "./TradeBadges";

/** Compact one-line summary shown above the trades table. */
export function TradesSummaryBar({ trades }: { trades: Trade[] }) {
  const { stats } = useTradeStats(trades);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
      <Item label="Trades" value={String(stats.totalTrades)} />
      <Item
        label="Net PnL"
        value={formatCurrency(stats.totalPnl, { signed: true })}
        valueClass={pnlColor(stats.totalPnl)}
      />
      <Item label="Win rate" value={formatPercent(stats.winRate)} />
      <Item
        label="W / L / BE"
        value={`${stats.wins} / ${stats.losses} / ${stats.breakevens}`}
      />
      <Item
        label="Avg PnL"
        value={formatCurrency(stats.avgPnl, { signed: true })}
        valueClass={pnlColor(stats.avgPnl)}
      />
    </div>
  );
}

function Item({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={cn("font-mono font-medium text-zinc-200 tabular-nums", valueClass)}>
        {value}
      </span>
    </div>
  );
}
