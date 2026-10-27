export type TradeSide = "LONG" | "SHORT";
export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN";

export const TRADE_SIDES: readonly TradeSide[] = ["LONG", "SHORT"] as const;
export const TRADE_STATUSES: readonly TradeStatus[] = [
  "WIN",
  "LOSS",
  "BREAKEVEN",
] as const;

/** A row from the `trades` table. */
export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: TradeSide;
  entry_price: number;
  exit_price: number;
  position_size: number;
  pnl: number;
  status: TradeStatus;
  /** ISO 8601 timestamp */
  entry_date: string;
  notes: string | null;
  /** Object path in the private `trade-setups` bucket, or null. */
  setup_before_path: string | null;
  /** Object path in the private `trade-setups` bucket, or null. */
  setup_after_path: string | null;
  /** ISO 8601 timestamp */
  created_at: string;
}

/**
 * What happened to one setup-image slot since the form was opened.
 * Files stay out of `TradeInput` and are uploaded only after the row exists.
 */
export type SetupImageChange =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "replace"; file: File };

export type SetupImageChanges = {
  before: SetupImageChange;
  after: SetupImageChange;
};

/**
 * What the user submits from the trade form.
 * `pnl` and `status` are derived in `lib/utils/trading.ts` before persisting.
 */
export type TradeInput = Pick<
  Trade,
  | "symbol"
  | "side"
  | "entry_price"
  | "exit_price"
  | "position_size"
  | "entry_date"
  | "notes"
>;

/** Payload actually written to Supabase (input + derived fields). */
export type TradeInsert = TradeInput &
  Pick<Trade, "pnl" | "status"> & { user_id: string };

export type TradeUpdate = Omit<TradeInsert, "user_id"> &
  Partial<Pick<Trade, "setup_before_path" | "setup_after_path">>;

export interface TradeStats {
  totalPnl: number;
  /** 0–100 */
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  avgPnl: number;
  bestTrade: number;
  worstTrade: number;
}

export interface EquityPoint {
  /** ISO date (yyyy-MM-dd) of the trading day */
  date: string;
  /** Cumulative PnL after this day */
  equity: number;
  /** PnL realised on this day */
  pnl: number;
  /** Trades closed on this day */
  trades: number;
}
