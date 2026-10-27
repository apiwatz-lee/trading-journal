/** Smallest lot a typical retail ticket accepts. */
export const LOT_STEP = 0.01;

/** XXXUSD: 1.00 lot = 100,000 units of the base currency. */
export const FOREX_CONTRACT_SIZE = 100_000;

/** XAUUSD: 1.00 lot = 100 oz, so a $1 move is $100 per lot. */
export const GOLD_CONTRACT_SIZE = 100;

export const INSTRUMENTS = [
  {
    id: "gold",
    label: "Gold",
    contractSize: GOLD_CONTRACT_SIZE,
    hint: "XAUUSD · 100 oz",
  },
  {
    id: "forex",
    label: "Forex",
    contractSize: FOREX_CONTRACT_SIZE,
    hint: "Currency pair · 100,000 units",
  },
] as const;

export type InstrumentId = (typeof INSTRUMENTS)[number]["id"];

export interface PositionSizeInput {
  balance: number;
  /** Percent of balance risked if the stop is hit, e.g. 1 for 1%. */
  riskPercent: number;
  entry: number;
  stopLoss: number;
  /** Units per 1.00 lot. Matches `position_size / lots` in the journal. */
  contractSize: number;
  takeProfit?: number | null;
}

export interface PositionSizeResult {
  /** LONG when the stop sits below entry, SHORT when it sits above. */
  side: "LONG" | "SHORT";
  riskAmount: number;
  stopDistance: number;
  /** Unrounded size in the same unit as a trade's `position_size`. */
  positionSize: number;
  /** Unrounded lots before the 0.01 floor. */
  lots: number;
  /**
   * Lots floored to 0.01 so the ticket cannot exceed the risk budget.
   * `0` when the exact size is below one step.
   */
  lotsRounded: number;
  /** `lotsRounded * contractSize`. `0` when below the minimum lot. */
  sizedPosition: number;
  /** Cash at risk after lot rounding. */
  actualRisk: number;
  belowMinimumLot: boolean;
  /** Cash gained if take profit is hit. `null` when TP is missing or on the stop side. */
  reward: number | null;
  /** Reward ÷ actual risk. `null` when reward cannot be sized. */
  riskReward: number | null;
}

/**
 * Lot size from a cash risk budget.
 *
 *   riskAmount    = balance × (riskPercent / 100)
 *   stopDistance  = |entry − stopLoss|
 *   positionSize  = riskAmount / stopDistance
 *   lots          = positionSize / contractSize
 *
 * `positionSize` is the journal's position size: price difference × size = PnL.
 * Lots are floored to {@link LOT_STEP} so rounding never spends more than the budget.
 * Returns `null` when a required input is not a positive finite number or the stop
 * equals the entry.
 */
export function calculatePositionSize(
  input: PositionSizeInput,
): PositionSizeResult | null {
  const { balance, riskPercent, entry, stopLoss, contractSize, takeProfit } =
    input;

  if (
    !isPositive(balance) ||
    !isPositive(riskPercent) ||
    !isPositive(entry) ||
    !isPositive(stopLoss) ||
    !isPositive(contractSize) ||
    entry === stopLoss
  ) {
    return null;
  }

  const riskAmount = balance * (riskPercent / 100);
  const stopDistance = Math.abs(entry - stopLoss);
  const positionSize = riskAmount / stopDistance;
  const lots = positionSize / contractSize;
  const lotsRounded = floorToStep(lots, LOT_STEP);
  const belowMinimumLot = lotsRounded < LOT_STEP;
  const sizedPosition = belowMinimumLot ? 0 : lotsRounded * contractSize;
  const actualRisk = sizedPosition * stopDistance;

  let reward: number | null = null;
  let riskReward: number | null = null;
  if (
    takeProfit != null &&
    isPositive(takeProfit) &&
    sizedPosition > 0 &&
    actualRisk > 0 &&
    isOppositeSide(entry, stopLoss, takeProfit)
  ) {
    reward = Math.abs(takeProfit - entry) * sizedPosition;
    riskReward = reward / actualRisk;
  }

  return {
    side: stopLoss < entry ? "LONG" : "SHORT",
    riskAmount,
    stopDistance,
    positionSize,
    lots,
    lotsRounded: belowMinimumLot ? 0 : lotsRounded,
    sizedPosition,
    actualRisk,
    belowMinimumLot,
    reward,
    riskReward,
  };
}

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** Take profit is usable only when it sits on the other side of entry from the stop. */
function isOppositeSide(
  entry: number,
  stopLoss: number,
  takeProfit: number,
): boolean {
  return (stopLoss - entry) * (takeProfit - entry) < 0;
}

/**
 * Floor to a step without dropping a value that is already on the step
 * but lands just under it from binary floating point (e.g. 0.2).
 */
function floorToStep(value: number, step: number): number {
  const scaled = Number((value / step).toFixed(8));
  const steps = Math.floor(scaled);
  return Number((steps * step).toFixed(8));
}
