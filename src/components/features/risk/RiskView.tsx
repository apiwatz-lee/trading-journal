"use client";

import { useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SideBadge } from "@/components/features/trades/TradeBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  calculatePositionSize,
  cn,
  formatCurrency,
  formatPrice,
  INSTRUMENTS,
  type InstrumentId,
  type PositionSizeResult,
} from "@/lib/utils";

const STORAGE_KEY = "tj.risk.prefs";
const RISK_PRESETS = [1, 10, 20] as const;

const numericInputClass =
  "h-10 bg-zinc-950/60 font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** Bump when the default instrument changes so a saved old default is replaced once. */
const PREFS_VERSION = 2;

interface StoredPrefs {
  balance: string;
  riskPercent: string;
  instrument: InstrumentId;
  version: number;
}

function parsePositive(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : null;
}

const DEFAULT_PREFS: StoredPrefs = {
  balance: "",
  riskPercent: "1",
  instrument: "gold",
  version: PREFS_VERSION,
};

const listeners = new Set<() => void>();
let prefsSnapshot: StoredPrefs = DEFAULT_PREFS;
let prefsLoaded = false;

function subscribePrefs(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function loadPrefs() {
  if (prefsLoaded || typeof window === "undefined") return;
  prefsLoaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    const seenCurrentDefault = parsed.version === PREFS_VERSION;
    prefsSnapshot = {
      balance: typeof parsed.balance === "string" ? parsed.balance : "",
      riskPercent:
        typeof parsed.riskPercent === "string" && parsed.riskPercent.trim()
          ? parsed.riskPercent
          : "1",
      instrument:
        seenCurrentDefault && isInstrumentId(parsed.instrument)
          ? parsed.instrument
          : "gold",
      version: PREFS_VERSION,
    };
    if (!seenCurrentDefault) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsSnapshot));
    }
  } catch {
    // Corrupt prefs fall back to the defaults.
  }
}

function getPrefsSnapshot() {
  loadPrefs();
  return prefsSnapshot;
}

function getServerPrefsSnapshot() {
  return DEFAULT_PREFS;
}

function writePrefs(next: StoredPrefs) {
  prefsSnapshot = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function isInstrumentId(value: unknown): value is InstrumentId {
  return INSTRUMENTS.some((item) => item.id === value);
}

export function RiskView() {
  const prefs = useSyncExternalStore(
    subscribePrefs,
    getPrefsSnapshot,
    getServerPrefsSnapshot,
  );
  const { balance, riskPercent, instrument } = prefs;
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  function patchPrefs(patch: Partial<StoredPrefs>) {
    writePrefs({ ...prefs, ...patch });
  }

  const preset =
    INSTRUMENTS.find((item) => item.id === instrument) ?? INSTRUMENTS[0];
  const contractSize = preset.contractSize;
  const balanceN = parsePositive(balance);
  const riskN = parsePositive(riskPercent);
  const entryN = parsePositive(entry);
  const stopN = parsePositive(stopLoss);
  const takeProfitN = parsePositive(takeProfit);
  const stopEqualsEntry =
    entryN != null && stopN != null && entryN === stopN;
  const takeProfitSameSide =
    entryN != null &&
    stopN != null &&
    takeProfitN != null &&
    !stopEqualsEntry &&
    (stopN - entryN) * (takeProfitN - entryN) > 0;

  const result =
    balanceN != null &&
    riskN != null &&
    entryN != null &&
    stopN != null &&
    contractSize != null
      ? calculatePositionSize({
          balance: balanceN,
          riskPercent: riskN,
          entry: entryN,
          stopLoss: stopN,
          contractSize,
          takeProfit: takeProfitN,
        })
      : null;

  const riskValue = Number(riskPercent);

  return (
    <>
      <PageHeader
        title="Risk"
        description="Size the lot so a stop-out stays inside your risk budget."
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border border-zinc-800 bg-zinc-900 ring-0 [--card-spacing:--spacing(5)]">
          <CardContent>
            <FieldGroup className="gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  data-invalid={
                    (balance.trim() !== "" && balanceN == null) || undefined
                  }
                >
                  <FieldLabel htmlFor="balance">Account balance</FieldLabel>
                  <Input
                    id="balance"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="10000"
                    aria-invalid={balance.trim() !== "" && balanceN == null}
                    className={numericInputClass}
                    value={balance}
                    onChange={(event) => patchPrefs({ balance: event.target.value })}
                  />
                  <FieldDescription>USD</FieldDescription>
                </Field>

                <Field
                  data-invalid={
                    (riskPercent.trim() !== "" && riskN == null) || undefined
                  }
                >
                  <FieldLabel htmlFor="risk-percent">Risk per trade</FieldLabel>
                  <Input
                    id="risk-percent"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    placeholder="1"
                    aria-invalid={riskPercent.trim() !== "" && riskN == null}
                    className={numericInputClass}
                    value={riskPercent}
                    onChange={(event) =>
                      patchPrefs({ riskPercent: event.target.value })
                    }
                  />
                  <FieldDescription>Percent of balance</FieldDescription>
                  <div className="flex gap-1.5">
                    {RISK_PRESETS.map((presetRisk) => {
                      const selected = riskValue === presetRisk;
                      return (
                        <Button
                          key={presetRisk}
                          type="button"
                          size="xs"
                          variant="ghost"
                          aria-pressed={selected}
                          onClick={() =>
                            patchPrefs({ riskPercent: String(presetRisk) })
                          }
                          className={cn(
                            "font-mono tabular-nums",
                            selected
                              ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100",
                          )}
                        >
                          {presetRisk}%
                        </Button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <Field>
                <FieldLabel>Instrument</FieldLabel>
                <div
                  role="radiogroup"
                  aria-label="Instrument"
                  className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1"
                >
                  {INSTRUMENTS.map((item) => {
                    const selected = instrument === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => patchPrefs({ instrument: item.id })}
                        className={cn(
                          "rounded-md text-sm font-medium transition-colors",
                          selected
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-400 hover:text-zinc-200",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <FieldDescription>{preset.hint} per 1.00 lot.</FieldDescription>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  data-invalid={
                    (entry.trim() !== "" && entryN == null) || undefined
                  }
                >
                  <FieldLabel htmlFor="entry">Entry</FieldLabel>
                  <Input
                    id="entry"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    aria-invalid={entry.trim() !== "" && entryN == null}
                    className={numericInputClass}
                    value={entry}
                    onChange={(event) => setEntry(event.target.value)}
                  />
                </Field>

                <Field
                  data-invalid={
                    (stopLoss.trim() !== "" && stopN == null) ||
                    stopEqualsEntry ||
                    undefined
                  }
                >
                  <FieldLabel htmlFor="stop-loss">Stop loss</FieldLabel>
                  <Input
                    id="stop-loss"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    aria-invalid={
                      (stopLoss.trim() !== "" && stopN == null) ||
                      stopEqualsEntry
                    }
                    className={numericInputClass}
                    value={stopLoss}
                    onChange={(event) => setStopLoss(event.target.value)}
                  />
                </Field>

                <Field
                  data-invalid={
                    (takeProfit.trim() !== "" && takeProfitN == null) ||
                    undefined
                  }
                >
                  <FieldLabel htmlFor="take-profit">
                    Take profit{" "}
                    <span className="font-normal text-zinc-500">
                      (optional)
                    </span>
                  </FieldLabel>
                  <Input
                    id="take-profit"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    aria-invalid={
                      takeProfit.trim() !== "" && takeProfitN == null
                    }
                    className={numericInputClass}
                    value={takeProfit}
                    onChange={(event) => setTakeProfit(event.target.value)}
                  />
                </Field>
              </div>

              {stopEqualsEntry && (
                <p role="alert" className="text-sm text-rose-400">
                  Stop loss must differ from entry.
                </p>
              )}
              {takeProfitSameSide && (
                <p className="text-sm text-zinc-400">
                  Take profit is on the same side as the stop, so R:R stays
                  hidden.
                </p>
              )}
            </FieldGroup>
          </CardContent>
        </Card>

        <RiskResult result={result} />
      </div>
    </>
  );
}

function RiskResult({ result }: { result: PositionSizeResult | null }) {
  return (
    <Card className="rounded-xl border border-zinc-800 bg-zinc-900 ring-0 [--card-spacing:--spacing(5)]">
      <CardContent aria-live="polite">
        {result == null ? (
          <div className="flex min-h-48 flex-col justify-center">
            <p className="text-sm font-medium text-zinc-300">Suggested lot</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Enter balance, risk, entry, and stop loss to size the trade.
            </p>
          </div>
        ) : (
          <ResultBody result={result} />
        )}
      </CardContent>
    </Card>
  );
}

function ResultBody({ result }: { result: PositionSizeResult }) {
  const floored =
    !result.belowMinimumLot && result.lots - result.lotsRounded > 1e-8;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-400">Suggested lot</p>
          <SideBadge side={result.side} />
        </div>
        <p className="mt-2 font-mono text-5xl font-semibold tracking-tight text-zinc-100 tabular-nums">
          {result.belowMinimumLot ? "—" : result.lotsRounded.toFixed(2)}
        </p>
        {result.belowMinimumLot ? (
          <p role="alert" className="mt-2 text-sm text-rose-400">
            Exact size is {formatExactLots(result.lots)} lots. The 0.01 minimum
            would spend more than this risk budget.
          </p>
        ) : floored ? (
          <p className="mt-2 text-sm text-zinc-500">
            Exact size is {formatExactLots(result.lots)} lots, floored so the
            stop stays inside the budget.
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            A stop-out costs {formatCurrency(result.actualRisk)}.
          </p>
        )}
      </div>

      <dl className="border-t border-zinc-800">
        <ResultRow
          label="Risk budget"
          value={formatCurrency(result.riskAmount)}
        />
        <ResultRow
          label="Risk at stop"
          value={formatCurrency(result.actualRisk)}
          hint={
            result.belowMinimumLot
              ? "No 0.01 lot fits this budget"
              : floored
                ? "After flooring the lot"
                : undefined
          }
        />
        <ResultRow
          label="Position size"
          value={
            result.belowMinimumLot
              ? "—"
              : formatPrice(result.sizedPosition)
          }
          hint="Paste into the trade form"
        />
        {result.reward != null && result.riskReward != null && (
          <>
            <ResultRow
              label="Reward at target"
              value={formatCurrency(result.reward)}
            />
            <ResultRow
              label="Risk / reward"
              value={`1 : ${result.riskReward.toFixed(2)}`}
            />
          </>
        )}
      </dl>
    </div>
  );
}

function ResultRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-800/80 py-3 last:border-b-0">
      <dt>
        <span className="text-sm text-zinc-400">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>}
      </dt>
      <dd className="font-mono text-sm font-medium text-zinc-100 tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function formatExactLots(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
