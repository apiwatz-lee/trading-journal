"use client";

import { useMemo } from "react";
import { buildEquityCurve, calculateStats } from "@/lib/utils/trading";
import type { EquityPoint, Trade, TradeStats } from "@/types/trade";

export interface UseTradeStatsResult {
  stats: TradeStats;
  equityCurve: EquityPoint[];
}

/** Derived dashboard metrics; recomputed only when the trade list changes. */
export function useTradeStats(trades: readonly Trade[]): UseTradeStatsResult {
  return useMemo(
    () => ({
      stats: calculateStats(trades),
      equityCurve: buildEquityCurve(trades),
    }),
    [trades],
  );
}
