"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseBrowserClient } from "@/lib/supabase/client";
import { deriveTradeResult } from "@/lib/utils/trading";
import type { Trade, TradeInput } from "@/types/trade";

export interface UseTradesResult {
  trades: Trade[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTrade: (input: TradeInput) => Promise<Trade>;
  updateTrade: (id: string, input: TradeInput) => Promise<Trade>;
  deleteTrade: (id: string) => Promise<void>;
}

type QueryResult = {
  data: Trade[] | null;
  error: { message: string } | null;
};

async function queryTrades(
  supabase: SupabaseBrowserClient,
): Promise<QueryResult> {
  try {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("entry_date", { ascending: false });
    return { data, error };
  } catch (err) {
    return { data: null, error: { message: toMessage(err) } };
  }
}

function sortByDateDesc(list: Trade[]): Trade[] {
  return [...list].sort(
    (a, b) =>
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
  );
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong";
}

/**
 * CRUD for the current user's trades.
 *
 * - Reads go straight to Supabase; RLS guarantees users only see their rows.
 * - `pnl` / `status` are derived client-side from the form input before
 *   writing, so the DB always holds consistent, queryable values.
 * - Mutations update local state immediately (optimistic for delete, and
 *   from the returned row for create/update) so the UI never has to refetch.
 */
export function useTrades(): UseTradesResult {
  const supabase = useMemo(() => createClient(), []);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((result: QueryResult) => {
    if (result.error) {
      setError(result.error.message);
    } else {
      setError(null);
      setTrades(result.data ?? []);
    }
    setIsLoading(false);
  }, []);

  // Initial load. State is only touched inside the promise callback, so the
  // effect body itself never sets state synchronously.
  useEffect(() => {
    let cancelled = false;
    queryTrades(supabase).then((result) => {
      if (!cancelled) applyResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, applyResult]);

  const fetchTrades = useCallback(async () => {
    applyResult(await queryTrades(supabase));
  }, [supabase, applyResult]);

  const createTrade = useCallback(
    async (input: TradeInput): Promise<Trade> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be signed in to log a trade.");
      }

      const { pnl, status } = deriveTradeResult(input);
      const { data, error: insertError } = await supabase
        .from("trades")
        .insert({ ...input, pnl, status, user_id: user.id })
        .select()
        .single();

      if (insertError || !data) throw new Error(toMessage(insertError));

      setTrades((prev) => sortByDateDesc([data, ...prev]));
      return data;
    },
    [supabase],
  );

  const updateTrade = useCallback(
    async (id: string, input: TradeInput): Promise<Trade> => {
      const { pnl, status } = deriveTradeResult(input);
      const { data, error: updateError } = await supabase
        .from("trades")
        .update({ ...input, pnl, status })
        .eq("id", id)
        .select()
        .single();

      if (updateError || !data) throw new Error(toMessage(updateError));

      setTrades((prev) =>
        sortByDateDesc(prev.map((t) => (t.id === id ? data : t))),
      );
      return data;
    },
    [supabase],
  );

  const deleteTrade = useCallback(
    async (id: string): Promise<void> => {
      // Optimistic removal; roll back if Supabase rejects the delete.
      let removed: Trade | undefined;
      setTrades((prev) => {
        removed = prev.find((t) => t.id === id);
        return prev.filter((t) => t.id !== id);
      });

      const { error: deleteError } = await supabase
        .from("trades")
        .delete()
        .eq("id", id);

      if (deleteError) {
        if (removed) {
          const restore = removed;
          setTrades((prev) => sortByDateDesc([...prev, restore]));
        }
        throw new Error(deleteError.message);
      }
    },
    [supabase],
  );

  return {
    trades,
    isLoading,
    error,
    refetch: fetchTrades,
    createTrade,
    updateTrade,
    deleteTrade,
  };
}
