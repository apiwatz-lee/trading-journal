"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Trade } from "@/types/trade";

interface DeleteTradeDialogProps {
  trade: Trade | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (trade: Trade) => Promise<void>;
}

export function DeleteTradeDialog({
  trade,
  onOpenChange,
  onConfirm,
}: DeleteTradeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!trade) return;
    setIsDeleting(true);
    try {
      await onConfirm(trade);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(trade)} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {trade && (
              <>
                <span className="font-mono text-zinc-200">{trade.symbol}</span>{" "}
                <span className="font-mono">{trade.side}</span> with a PnL of{" "}
                <span className="font-mono text-zinc-200">
                  {formatCurrency(trade.pnl, { signed: true })}
                </span>{" "}
                will be permanently removed. This cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/30 hover:bg-rose-400/20"
          >
            {isDeleting && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
