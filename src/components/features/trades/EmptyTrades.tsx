import { NotebookPen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyTradesProps {
  onAdd: () => void;
}

export function EmptyTrades({ onAdd }: EmptyTradesProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-zinc-800 bg-zinc-900/60 px-6 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400/5 via-transparent to-transparent"
      />
      <div className="relative mx-auto flex max-w-sm flex-col items-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20">
          <NotebookPen className="size-7" />
        </span>
        <h3 className="text-lg font-semibold text-zinc-100">No trades yet</h3>
        <p className="mt-1.5 text-sm text-zinc-400">
          Your journal is empty. Log your first closed position and your stats
          and equity curve will appear automatically.
        </p>
        <Button
          onClick={onAdd}
          className="mt-6 h-10 bg-emerald-400 font-medium text-zinc-950 hover:bg-emerald-300"
        >
          <Plus />
          Log your first trade
        </Button>
      </div>
    </div>
  );
}
