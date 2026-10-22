import { Activity, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { TradeStats } from "@/types/trade";
import { pnlColor } from "@/components/features/trades/TradeBadges";

interface StatCardsProps {
  stats: TradeStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const pnlPositive = stats.totalPnl >= 0;
  const PnlIcon = pnlPositive ? TrendingUp : TrendingDown;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total PnL"
        value={formatCurrency(stats.totalPnl, { signed: true })}
        valueClass={pnlColor(stats.totalPnl)}
        icon={PnlIcon}
        iconClass={
          pnlPositive
            ? "bg-emerald-400/10 text-emerald-400"
            : "bg-rose-400/10 text-rose-400"
        }
        hint={`Avg ${formatCurrency(stats.avgPnl, { signed: true })} per trade`}
      />
      <StatCard
        label="Win rate"
        value={formatPercent(stats.winRate)}
        icon={Target}
        iconClass="bg-sky-400/10 text-sky-400"
        hint={`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`}
      >
        <WinRateBar wins={stats.wins} losses={stats.losses} breakevens={stats.breakevens} />
      </StatCard>
      <StatCard
        label="Total trades"
        value={String(stats.totalTrades)}
        icon={Activity}
        iconClass="bg-zinc-400/10 text-zinc-300"
        hint="Closed positions logged"
      />
      <StatCard
        label="Best / Worst"
        value={formatCurrency(stats.bestTrade, { signed: true })}
        valueClass="text-emerald-400"
        icon={Wallet}
        iconClass="bg-amber-400/10 text-amber-400"
        hint={
          <span className={cn("font-mono tabular-nums", pnlColor(stats.worstTrade))}>
            {formatCurrency(stats.worstTrade, { signed: true })}
          </span>
        }
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  valueClass?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}

function StatCard({
  label,
  value,
  valueClass,
  icon: Icon,
  iconClass,
  hint,
  children,
}: StatCardProps) {
  return (
    <Card className="rounded-xl border border-zinc-800 bg-zinc-900 ring-0 transition-colors duration-200 hover:border-zinc-700 [--card-spacing:--spacing(5)]">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">{label}</span>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              iconClass,
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <div>
          <p
            className={cn(
              "font-mono text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums",
              valueClass,
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function WinRateBar({
  wins,
  losses,
  breakevens,
}: {
  wins: number;
  losses: number;
  breakevens: number;
}) {
  const total = wins + losses + breakevens;
  if (total === 0) {
    return <div className="h-1.5 w-full rounded-full bg-zinc-800" />;
  }
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
      role="img"
      aria-label={`${wins} wins, ${losses} losses, ${breakevens} breakeven`}
    >
      <div className="bg-emerald-400 transition-[width] duration-500" style={{ width: pct(wins) }} />
      <div className="bg-zinc-500 transition-[width] duration-500" style={{ width: pct(breakevens) }} />
      <div className="bg-rose-400 transition-[width] duration-500" style={{ width: pct(losses) }} />
    </div>
  );
}
