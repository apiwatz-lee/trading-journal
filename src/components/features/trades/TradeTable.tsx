"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSetupImageUrls } from "@/hooks/useSetupImageUrls";
import { cn, formatCurrency, formatDateTime, formatPrice } from "@/lib/utils";
import type { Trade } from "@/types/trade";
import { pnlColor, SideBadge, StatusBadge } from "./TradeBadges";
import { SetupImageDialog } from "./SetupImageDialog";
import { SetupImage } from "./SetupImageSlot";
import { TradeRowActions } from "./TradeRowActions";

interface TradeTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

const headClass = "h-11 px-4 text-xs font-medium tracking-wide text-zinc-500 uppercase";
const numClass = "px-4 text-right font-mono tabular-nums";

export function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
  const paths = trades.flatMap((trade) =>
    [trade.setup_before_path, trade.setup_after_path].filter(
      (path): path is string => Boolean(path),
    ),
  );
  const { urls, isLoading } = useSetupImageUrls(paths);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = trades.find((trade) => trade.id === viewingId) ?? null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className={headClass}>Date</TableHead>
            <TableHead className={headClass}>Symbol</TableHead>
            <TableHead className={headClass}>Side</TableHead>
            <TableHead className={cn(headClass, "text-right")}>Entry</TableHead>
            <TableHead className={cn(headClass, "text-right")}>Exit</TableHead>
            <TableHead className={cn(headClass, "text-right")}>Size</TableHead>
            <TableHead className={cn(headClass, "text-right")}>PnL</TableHead>
            <TableHead className={headClass}>Result</TableHead>
            <TableHead className={headClass}>Setup</TableHead>
            <TableHead className={cn(headClass, "w-12")}>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow
              key={trade.id}
              className="group border-zinc-800/80 transition-colors duration-200 hover:bg-zinc-800/50"
            >
              <TableCell className="px-4 py-3 font-mono text-xs text-zinc-400 tabular-nums">
                {formatDateTime(trade.entry_date)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-semibold text-zinc-100">
                    {trade.symbol}
                  </span>
                  {trade.notes && (
                    <span
                      className="max-w-48 truncate text-xs text-zinc-500"
                      title={trade.notes}
                    >
                      {trade.notes}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <SideBadge side={trade.side} />
              </TableCell>
              <TableCell className={cn(numClass, "py-3 text-zinc-300")}>
                {formatPrice(trade.entry_price)}
              </TableCell>
              <TableCell className={cn(numClass, "py-3 text-zinc-300")}>
                {formatPrice(trade.exit_price)}
              </TableCell>
              <TableCell className={cn(numClass, "py-3 text-zinc-300")}>
                {formatPrice(trade.position_size)}
              </TableCell>
              <TableCell
                className={cn(numClass, "py-3 font-semibold", pnlColor(trade.pnl))}
              >
                {formatCurrency(trade.pnl, { signed: true })}
              </TableCell>
              <TableCell className="px-4 py-3">
                <StatusBadge status={trade.status} />
              </TableCell>
              <TableCell className="px-4 py-3">
                <SetupThumbs
                  trade={trade}
                  urls={urls}
                  isLoading={isLoading}
                  onView={() => setViewingId(trade.id)}
                />
              </TableCell>
              <TableCell className="px-2 py-3 text-right">
                <TradeRowActions
                  trade={trade}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <SetupImageDialog
        trade={viewing}
        urls={urls}
        onOpenChange={(open) => !open && setViewingId(null)}
      />
    </div>
  );
}

function SetupThumbs({
  trade,
  urls,
  isLoading,
  onView,
}: {
  trade: Trade;
  urls: Record<string, string>;
  isLoading: boolean;
  onView: () => void;
}) {
  const slots = [
    { label: "Before", path: trade.setup_before_path },
    { label: "After", path: trade.setup_after_path },
  ].filter((slot) => slot.path);

  if (slots.length === 0) {
    return <span className="font-mono text-sm text-zinc-600">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {slots.map((slot) => {
        const url = slot.path ? urls[slot.path] : undefined;
        if (!url) {
          return (
            <span
              key={slot.label}
              className={cn(
                "size-8 rounded bg-zinc-800",
                isLoading && "animate-pulse",
              )}
              aria-hidden
            />
          );
        }
        return (
          <button
            key={slot.label}
            type="button"
            onClick={onView}
            aria-label={`View ${slot.label.toLowerCase()} setup for ${trade.symbol}`}
            className="overflow-hidden rounded border border-zinc-700 transition-colors duration-200 hover:border-zinc-400"
          >
            <SetupImage src={url} alt="" className="size-8 object-cover" />
          </button>
        );
      })}
    </div>
  );
}
