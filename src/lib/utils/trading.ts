import type {
  EquityPoint,
  Trade,
  TradeInput,
  TradeStats,
  TradeStatus,
} from "@/types/trade";

/** PnL below this absolute value (in account currency) is treated as breakeven. */
export const BREAKEVEN_THRESHOLD = 0.005;

type PnlInput = Pick<
  TradeInput,
  "side" | "entry_price" | "exit_price" | "position_size"
>;

/**
 * Realised PnL for a closed trade.
 *   LONG : (exit - entry) * size
 *   SHORT: (entry - exit) * size
 */
export function calculatePnl({
  side,
  entry_price,
  exit_price,
  position_size,
}: PnlInput): number {
  const diff =
    side === "LONG" ? exit_price - entry_price : entry_price - exit_price;
  const pnl = diff * position_size;
  // Avoid -0 and floating noise beyond 8 decimals.
  return Number(pnl.toFixed(8)) + 0;
}

export function deriveStatus(pnl: number): TradeStatus {
  if (Math.abs(pnl) < BREAKEVEN_THRESHOLD) return "BREAKEVEN";
  return pnl > 0 ? "WIN" : "LOSS";
}

/** Convenience: derive both persisted fields from form input. */
export function deriveTradeResult(input: PnlInput): {
  pnl: number;
  status: TradeStatus;
} {
  const pnl = calculatePnl(input);
  return { pnl, status: deriveStatus(pnl) };
}

export function calculateStats(trades: readonly Trade[]): TradeStats {
  const totalTrades = trades.length;
  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let bestTrade = 0;
  let worstTrade = 0;

  for (const t of trades) {
    totalPnl += t.pnl;
    if (t.status === "WIN") wins++;
    else if (t.status === "LOSS") losses++;
    else breakevens++;
    if (t.pnl > bestTrade) bestTrade = t.pnl;
    if (t.pnl < worstTrade) worstTrade = t.pnl;
  }

  // Win rate excludes breakeven trades from the denominator.
  const decided = wins + losses;
  const winRate = decided === 0 ? 0 : (wins / decided) * 100;

  return {
    totalPnl,
    winRate,
    totalTrades,
    wins,
    losses,
    breakevens,
    avgPnl: totalTrades === 0 ? 0 : totalPnl / totalTrades,
    bestTrade,
    worstTrade,
  };
}

/**
 * Cumulative PnL grouped by calendar day (local time), oldest first.
 * A synthetic starting point at equity 0 is prepended so the curve always
 * anchors to the zero line.
 */
export function buildEquityCurve(trades: readonly Trade[]): EquityPoint[] {
  if (trades.length === 0) return [];

  const sorted = [...trades].sort(
    (a, b) =>
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime(),
  );

  const byDay = new Map<string, { pnl: number; trades: number }>();
  for (const t of sorted) {
    const day = toDayKey(t.entry_date);
    const bucket = byDay.get(day) ?? { pnl: 0, trades: 0 };
    bucket.pnl += t.pnl;
    bucket.trades += 1;
    byDay.set(day, bucket);
  }

  const points: EquityPoint[] = [];
  let equity = 0;
  for (const [date, { pnl, trades: count }] of byDay) {
    equity += pnl;
    points.push({ date, equity, pnl, trades: count });
  }

  // Anchor the curve at zero the day before the first trade.
  const first = new Date(points[0].date);
  first.setDate(first.getDate() - 1);
  points.unshift({
    date: toDayKey(first.toISOString()),
    equity: 0,
    pnl: 0,
    trades: 0,
  });

  return points;
}

function toDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
