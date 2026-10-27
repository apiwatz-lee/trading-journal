"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseBrowserClient } from "@/lib/supabase/client";
import {
  extensionForSetupImage,
  removeSetupFolder,
  removeSetupImages,
  setupImageObjectPath,
  uploadSetupImage,
  type SetupSlot,
} from "@/lib/supabase/trade-images";
import { deriveTradeResult } from "@/lib/utils/trading";
import type { SetupImageChange, SetupImageChanges, Trade, TradeInput } from "@/types/trade";

export interface UseTradesResult {
  trades: Trade[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTrade: (input: TradeInput, images: SetupImageChanges) => Promise<Trade>;
  updateTrade: (
    id: string,
    input: TradeInput,
    images: SetupImageChanges,
  ) => Promise<Trade>;
  deleteTrade: (trade: Trade) => Promise<void>;
}

type QueryResult = {
  data: Trade[] | null;
  error: { message: string } | null;
};

type SlotPaths = Pick<Trade, "setup_before_path" | "setup_after_path">;

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

function pathOrNull(path: string | null | undefined): string | null {
  return path ?? null;
}

function pathsEqual(a: SlotPaths, b: SlotPaths): boolean {
  return (
    pathOrNull(a.setup_before_path) === pathOrNull(b.setup_before_path) &&
    pathOrNull(a.setup_after_path) === pathOrNull(b.setup_after_path)
  );
}

/**
 * Uploads replacements and records which existing objects to delete.
 * Does not write the trade row or remove old files — the caller does that
 * only after the new objects are in place, so a failed upload leaves the
 * previous image attached.
 */
async function stageSetupImages(
  supabase: SupabaseBrowserClient,
  userId: string,
  tradeId: string,
  current: SlotPaths,
  changes: SetupImageChanges,
): Promise<{ paths: SlotPaths; obsolete: string[] }> {
  const obsolete: string[] = [];
  const uploaded: string[] = [];

  async function nextPath(
    slot: SetupSlot,
    change: SetupImageChange,
    currentPath: string | null,
  ): Promise<string | null> {
    if (change.kind === "keep") return pathOrNull(currentPath);
    if (change.kind === "remove") {
      if (currentPath) obsolete.push(currentPath);
      return null;
    }

    const extension = extensionForSetupImage(change.file);
    const path = setupImageObjectPath(userId, tradeId, slot, extension);
    await uploadSetupImage(supabase, path, change.file);
    uploaded.push(path);
    if (currentPath && currentPath !== path) obsolete.push(currentPath);
    return path;
  }

  try {
    const setup_before_path = await nextPath(
      "before",
      changes.before,
      current.setup_before_path,
    );
    const setup_after_path = await nextPath(
      "after",
      changes.after,
      current.setup_after_path,
    );
    return {
      paths: { setup_before_path, setup_after_path },
      obsolete,
    };
  } catch (err) {
    const orphans = uploaded.filter(
      (path) =>
        path !== current.setup_before_path && path !== current.setup_after_path,
    );
    await removeSetupImages(supabase, orphans).catch(() => undefined);
    throw err;
  }
}

async function writeSetupPaths(
  supabase: SupabaseBrowserClient,
  trade: Trade,
  paths: SlotPaths,
): Promise<Trade> {
  if (pathsEqual(trade, paths)) return trade;
  const { data, error } = await supabase
    .from("trades")
    .update(paths)
    .eq("id", trade.id)
    .select()
    .single();
  if (error || !data) throw new Error(toMessage(error));
  return data;
}

/**
 * Best-effort undo for a trade inserted before its images failed.
 * The row is always removed so a retry does not create a duplicate.
 * Leftover objects are removed when Storage allows it.
 */
async function discardNewTrade(
  supabase: SupabaseBrowserClient,
  userId: string,
  tradeId: string,
): Promise<void> {
  await removeSetupFolder(supabase, userId, tradeId).catch(() => undefined);
  const { error } = await supabase.from("trades").delete().eq("id", tradeId);
  if (error) {
    throw new Error(
      `The image could not be saved, and the new trade could not be removed (${error.message}). Refresh and delete it if it still appears.`,
    );
  }
}

/**
 * CRUD for the current user's trades.
 *
 * - Reads go straight to Supabase; RLS guarantees users only see their rows.
 * - `pnl` / `status` are derived client-side from the form input before
 *   writing, so the DB always holds consistent, queryable values.
 * - Setup images are uploaded after the row exists, then the path columns
 *   are updated. Storage objects are removed before the row on delete.
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
    async (input: TradeInput, images: SetupImageChanges): Promise<Trade> => {
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

      let saved = data;
      let committed = false;
      try {
        const staged = await stageSetupImages(
          supabase,
          user.id,
          data.id,
          data,
          images,
        );
        // Drop replaced files before the row points at the new ones, so a
        // failed write can be retried and still finds the previous path.
        await removeSetupImages(supabase, staged.obsolete);
        saved = await writeSetupPaths(supabase, data, staged.paths);
        committed = true;
      } catch (err) {
        if (!committed) {
          await discardNewTrade(supabase, user.id, data.id);
        } else {
          setTrades((prev) => sortByDateDesc([saved, ...prev]));
        }
        throw err instanceof Error ? err : new Error(toMessage(err));
      }

      setTrades((prev) => sortByDateDesc([saved, ...prev]));
      return saved;
    },
    [supabase],
  );

  const updateTrade = useCallback(
    async (
      id: string,
      input: TradeInput,
      images: SetupImageChanges,
    ): Promise<Trade> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be signed in to edit a trade.");
      }

      const { pnl, status } = deriveTradeResult(input);
      const { data, error: updateError } = await supabase
        .from("trades")
        .update({ ...input, pnl, status })
        .eq("id", id)
        .select()
        .single();

      if (updateError || !data) throw new Error(toMessage(updateError));

      let saved = data;
      try {
        const staged = await stageSetupImages(supabase, user.id, id, data, images);
        await removeSetupImages(supabase, staged.obsolete);
        saved = await writeSetupPaths(supabase, data, staged.paths);
        setTrades((prev) =>
          sortByDateDesc(prev.map((t) => (t.id === id ? saved : t))),
        );
      } catch (err) {
        setTrades((prev) =>
          sortByDateDesc(prev.map((t) => (t.id === id ? saved : t))),
        );
        throw err instanceof Error ? err : new Error(toMessage(err));
      }

      return saved;
    },
    [supabase],
  );

  const deleteTrade = useCallback(
    async (trade: Trade): Promise<void> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be signed in to delete a trade.");
      }

      const paths = [trade.setup_before_path, trade.setup_after_path].filter(
        (path): path is string => Boolean(path),
      );
      // Remove files first. A failed delete leaves the row so the user can retry
      // instead of orphaning screenshots with no trade to clean them up.
      // Trades with no images skip Storage entirely.
      if (paths.length > 0) {
        await removeSetupImages(supabase, paths);
        await removeSetupFolder(supabase, user.id, trade.id);
      }

      const id = trade.id;
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
