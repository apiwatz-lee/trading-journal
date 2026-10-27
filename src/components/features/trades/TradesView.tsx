"use client";

import { useState } from "react";
import { AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useTrades } from "@/hooks/useTrades";
import type { SetupImageChanges, Trade, TradeInput } from "@/types/trade";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { TradeTable } from "./TradeTable";
import { TradeTableSkeleton } from "./TradeTableSkeleton";
import { EmptyTrades } from "./EmptyTrades";
import { TradeDialog } from "./TradeDialog";
import { DeleteTradeDialog } from "./DeleteTradeDialog";
import { TradesSummaryBar } from "./TradesSummaryBar";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; trade: Trade };

export function TradesView() {
  const { trades, isLoading, error, refetch, createTrade, updateTrade, deleteTrade } =
    useTrades();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [pendingDelete, setPendingDelete] = useState<Trade | null>(null);

  const openCreate = () => setDialog({ mode: "create" });
  const openEdit = (trade: Trade) => setDialog({ mode: "edit", trade });
  const closeDialog = () => setDialog({ mode: "closed" });

  async function handleSubmit(input: TradeInput, images: SetupImageChanges) {
    try {
      if (dialog.mode === "edit") {
        await updateTrade(dialog.trade.id, input, images);
        toast.success("Trade updated");
      } else {
        await createTrade(input, images);
        toast.success("Trade logged");
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save trade");
    }
  }

  async function handleDelete(trade: Trade) {
    try {
      await deleteTrade(trade);
      toast.success("Trade deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete trade");
    }
  }

  return (
    <>
      <PageHeader
        title="Trades"
        description="Every closed position you have logged, newest first."
      >
        <Button
          onClick={openCreate}
          className="h-9 bg-emerald-400 font-medium text-zinc-950 hover:bg-emerald-300"
        >
          <Plus />
          New trade
        </Button>
      </PageHeader>

      {isLoading ? (
        <TradeTableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : trades.length === 0 ? (
        <EmptyTrades onAdd={openCreate} />
      ) : (
        <div className="flex flex-col gap-4">
          <TradesSummaryBar trades={trades} />
          <TradeTable trades={trades} onEdit={openEdit} onDelete={setPendingDelete} />
        </div>
      )}

      <TradeDialog
        open={dialog.mode !== "closed"}
        onOpenChange={(open) => !open && closeDialog()}
        trade={dialog.mode === "edit" ? dialog.trade : null}
        onSubmit={handleSubmit}
      />

      <DeleteTradeDialog
        trade={pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-rose-400/10 text-rose-400">
        <AlertTriangle className="size-6" />
      </span>
      <div>
        <p className="font-medium text-zinc-100">Could not load trades</p>
        <p className="mt-1 font-mono text-xs text-rose-300/80">{message}</p>
      </div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="mt-2 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
      >
        <RefreshCw />
        Try again
      </Button>
    </div>
  );
}
