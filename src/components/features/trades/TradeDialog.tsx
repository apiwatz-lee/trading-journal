"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SetupImageChanges, Trade, TradeInput } from "@/types/trade";
import { TradeForm } from "./TradeForm";

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Trade being edited; omit/null for "new trade". */
  trade?: Trade | null;
  onSubmit: (input: TradeInput, images: SetupImageChanges) => Promise<void>;
}

export function TradeDialog({
  open,
  onOpenChange,
  trade,
  onSubmit,
}: TradeDialogProps) {
  const isEdit = Boolean(trade);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit trade" : "Log a new trade"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {isEdit
              ? "Update the details below. PnL and result are recalculated automatically."
              : "Record a closed position. PnL and result are calculated for you."}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <TradeForm
            key={trade?.id ?? "new"}
            trade={trade}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
