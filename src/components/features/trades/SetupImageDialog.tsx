"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Trade } from "@/types/trade";
import { SetupImage } from "./SetupImageSlot";

interface SetupImageDialogProps {
  trade: Trade | null;
  urls: Record<string, string>;
  onOpenChange: (open: boolean) => void;
}

export function SetupImageDialog({
  trade,
  urls,
  onOpenChange,
}: SetupImageDialogProps) {
  const before = trade?.setup_before_path
    ? urls[trade.setup_before_path]
    : undefined;
  const after = trade?.setup_after_path ? urls[trade.setup_after_path] : undefined;

  return (
    <Dialog open={trade !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {trade ? `${trade.symbol} setup` : "Setup"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Before and after this trade.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <SetupPane label="Before" url={before} />
          <SetupPane label="After" url={after} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SetupPane({ label, url }: { label: string; url: string | undefined }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </figcaption>
      {url ? (
        <SetupImage
          src={url}
          alt={`${label} setup`}
          className="max-h-[60vh] w-full rounded-lg border border-zinc-800 bg-zinc-950 object-contain"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-600">
          No image
        </div>
      )}
    </figure>
  );
}
