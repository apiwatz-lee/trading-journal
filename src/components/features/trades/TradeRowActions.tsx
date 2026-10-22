"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Trade } from "@/types/trade";

interface TradeRowActionsProps {
  trade: Trade;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

export function TradeRowActions({ trade, onEdit, onDelete }: TradeRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${trade.symbol}`}
          className="text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-100"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 border-zinc-800 bg-zinc-900 text-zinc-100"
      >
        <DropdownMenuItem
          onSelect={() => onEdit(trade)}
          className="focus:bg-zinc-800 focus:text-zinc-100"
        >
          <Pencil className="text-zinc-400" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(trade)}
          className="text-rose-400 focus:bg-rose-400/10 focus:text-rose-400"
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
