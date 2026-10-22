"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDateTime, formatPrice } from "@/lib/utils";
import type { Trade } from "@/types/trade";
import { pnlColor, SideBadge, StatusBadge } from "./TradeBadges";
import { TradeRowActions } from "./TradeRowActions";

interface TradeTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

const headClass = "h-11 px-4 text-xs font-medium tracking-wide text-zinc-500 uppercase";
const numClass = "px-4 text-right font-mono tabular-nums";

export function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
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
    </div>
  );
}
