"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { useTrades } from "@/hooks/useTrades";
import { useTradeStats } from "@/hooks/useTradeStats";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCards } from "./StatCards";
import { StatCardsSkeleton } from "./StatCardsSkeleton";
import { DashboardChart, DashboardChartSkeleton } from "./DashboardChart";
import { RecentTrades } from "./RecentTrades";

export function DashboardView() {
  const { trades, isLoading, error } = useTrades();
  const { stats, equityCurve } = useTradeStats(trades);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your performance at a glance."
      >
        <Button
          asChild
          className="h-9 bg-emerald-400 font-medium text-zinc-950 hover:bg-emerald-300"
        >
          <Link href="/trades">
            <Plus />
            New trade
          </Link>
        </Button>
      </PageHeader>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 font-mono text-xs text-rose-400"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {isLoading ? <StatCardsSkeleton /> : <StatCards stats={stats} />}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {isLoading ? (
            <DashboardChartSkeleton className="xl:col-span-2" />
          ) : (
            <DashboardChart data={equityCurve} className="xl:col-span-2" />
          )}

          {!isLoading && trades.length > 0 && (
            <RecentTrades trades={trades} />
          )}
        </div>
      </div>
    </>
  );
}
