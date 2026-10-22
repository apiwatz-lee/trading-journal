"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";

import {
  tradeFormSchema,
  type TradeFormInput,
  type TradeFormValues,
} from "@/lib/validations/trade";
import { cn, formatCurrency, fromDateTimeLocal, toDateTimeLocal } from "@/lib/utils";
import { deriveTradeResult } from "@/lib/utils/trading";
import type { Trade, TradeInput, TradeSide } from "@/types/trade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { pnlColor, StatusBadge } from "./TradeBadges";

interface TradeFormProps {
  /** When provided the form is in edit mode and pre-filled. */
  trade?: Trade | null;
  onSubmit: (input: TradeInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

function toFormDefaults(trade?: Trade | null): TradeFormInput {
  if (!trade) {
    return {
      symbol: "",
      side: "LONG",
      entry_price: "",
      exit_price: "",
      position_size: "",
      entry_date: toDateTimeLocal(new Date().toISOString()),
      notes: "",
    };
  }
  return {
    symbol: trade.symbol,
    side: trade.side,
    entry_price: String(trade.entry_price),
    exit_price: String(trade.exit_price),
    position_size: String(trade.position_size),
    entry_date: toDateTimeLocal(trade.entry_date),
    notes: trade.notes ?? "",
  };
}

function toTradeInput(values: TradeFormValues): TradeInput {
  return {
    symbol: values.symbol,
    side: values.side,
    entry_price: values.entry_price,
    exit_price: values.exit_price,
    position_size: values.position_size,
    entry_date: fromDateTimeLocal(values.entry_date),
    notes: values.notes ? values.notes : null,
  };
}

const numericInputClass =
  "h-10 bg-zinc-950/60 font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function TradeForm({
  trade,
  onSubmit,
  onCancel,
  submitLabel,
}: TradeFormProps) {
  const form = useForm<TradeFormInput, unknown, TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: toFormDefaults(trade),
    mode: "onBlur",
  });
  const { errors, isSubmitting } = form.formState;

  // Re-populate when switching between "new" and "edit <trade>".
  useEffect(() => {
    form.reset(toFormDefaults(trade));
  }, [trade, form]);

  // Live PnL preview (useWatch subscribes without re-rendering on every field)
  const [side, entry, exit, size] = useWatch({
    control: form.control,
    name: ["side", "entry_price", "exit_price", "position_size"],
  });
  const entryN = Number(entry);
  const exitN = Number(exit);
  const sizeN = Number(size);
  const previewReady =
    entryN > 0 && exitN > 0 && sizeN > 0 && (side === "LONG" || side === "SHORT");
  const preview = previewReady
    ? deriveTradeResult({
        side: side as TradeSide,
        entry_price: entryN,
        exit_price: exitN,
        position_size: sizeN,
      })
    : null;

  async function handleSubmit(values: TradeFormValues) {
    await onSubmit(toTradeInput(values));
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      <FieldGroup className="gap-5">
        {/* Symbol + Side */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.symbol || undefined}>
            <FieldLabel htmlFor="symbol">Symbol</FieldLabel>
            <Input
              id="symbol"
              placeholder="BTC/USDT"
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={!!errors.symbol}
              className="h-10 bg-zinc-950/60 font-mono uppercase"
              {...form.register("symbol")}
            />
            <FieldError errors={[errors.symbol]} />
          </Field>

          <Field data-invalid={!!errors.side || undefined}>
            <FieldLabel>Side</FieldLabel>
            <Controller
              control={form.control}
              name="side"
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label="Side"
                  className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1"
                >
                  <SideOption
                    value="LONG"
                    selected={field.value === "LONG"}
                    onSelect={() => field.onChange("LONG")}
                  />
                  <SideOption
                    value="SHORT"
                    selected={field.value === "SHORT"}
                    onSelect={() => field.onChange("SHORT")}
                  />
                </div>
              )}
            />
            <FieldError errors={[errors.side]} />
          </Field>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field data-invalid={!!errors.entry_price || undefined}>
            <FieldLabel htmlFor="entry_price">Entry price</FieldLabel>
            <Input
              id="entry_price"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0.00"
              aria-invalid={!!errors.entry_price}
              className={numericInputClass}
              {...form.register("entry_price")}
            />
            <FieldError errors={[errors.entry_price]} />
          </Field>

          <Field data-invalid={!!errors.exit_price || undefined}>
            <FieldLabel htmlFor="exit_price">Exit price</FieldLabel>
            <Input
              id="exit_price"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0.00"
              aria-invalid={!!errors.exit_price}
              className={numericInputClass}
              {...form.register("exit_price")}
            />
            <FieldError errors={[errors.exit_price]} />
          </Field>

          <Field data-invalid={!!errors.position_size || undefined}>
            <FieldLabel htmlFor="position_size">Position size</FieldLabel>
            <Input
              id="position_size"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0.00"
              aria-invalid={!!errors.position_size}
              className={numericInputClass}
              {...form.register("position_size")}
            />
            <FieldError errors={[errors.position_size]} />
          </Field>
        </div>

        {/* Date */}
        <Field data-invalid={!!errors.entry_date || undefined}>
          <FieldLabel htmlFor="entry_date">Entry date</FieldLabel>
          <Input
            id="entry_date"
            type="datetime-local"
            aria-invalid={!!errors.entry_date}
            className="h-10 bg-zinc-950/60 font-mono [color-scheme:dark]"
            {...form.register("entry_date")}
          />
          <FieldError errors={[errors.entry_date]} />
        </Field>

        {/* Notes */}
        <Field data-invalid={!!errors.notes || undefined}>
          <FieldLabel htmlFor="notes">
            Notes{" "}
            <span className="font-normal text-zinc-500">(optional)</span>
          </FieldLabel>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Setup, reasoning, what went right or wrong…"
            aria-invalid={!!errors.notes}
            className="min-h-20 resize-none bg-zinc-950/60"
            {...form.register("notes")}
          />
          <FieldError errors={[errors.notes]} />
        </Field>

        {/* PnL preview */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
          <span className="text-sm text-zinc-400">Realised PnL</span>
          <div className="flex items-center gap-3">
            {preview ? (
              <>
                <StatusBadge status={preview.status} />
                <span
                  className={cn(
                    "font-mono text-base font-semibold tabular-nums",
                    pnlColor(preview.pnl),
                  )}
                >
                  {formatCurrency(preview.pnl, { signed: true })}
                </span>
              </>
            ) : (
              <span className="font-mono text-sm text-zinc-600">—</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-10 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 min-w-28 bg-emerald-400 font-medium text-zinc-950 hover:bg-emerald-300"
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            {submitLabel ?? (trade ? "Save changes" : "Log trade")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function SideOption({
  value,
  selected,
  onSelect,
}: {
  value: TradeSide;
  selected: boolean;
  onSelect: () => void;
}) {
  const isLong = value === "LONG";
  const Icon = isLong ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md font-mono text-xs font-semibold tracking-wide transition-colors duration-200",
        selected
          ? isLong
            ? "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/30"
            : "bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/30"
          : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300",
      )}
    >
      <Icon className="size-3.5" />
      {value}
    </button>
  );
}
