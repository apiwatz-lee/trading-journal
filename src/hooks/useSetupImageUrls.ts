"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signSetupImages } from "@/lib/supabase/trade-images";

/**
 * One signed-URL batch for every setup image on the current page.
 * The cache key is the path set, so a new trades array with the same
 * paths does not refetch.
 */
export function useSetupImageUrls(paths: readonly string[]): {
  urls: Record<string, string>;
  isLoading: boolean;
} {
  const supabase = useMemo(() => createClient(), []);
  const key = [...new Set(paths.filter(Boolean))].sort().join("\n");
  const [result, setResult] = useState<{
    key: string;
    urls: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const list = key ? key.split("\n") : [];
    if (list.length === 0) return;

    let cancelled = false;
    signSetupImages(supabase, list)
      .then((urls) => {
        if (!cancelled) setResult({ key, urls });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, urls: {} });
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, key]);

  const ready = result?.key === key;
  return {
    urls: ready ? result.urls : {},
    isLoading: key.length > 0 && !ready,
  };
}
