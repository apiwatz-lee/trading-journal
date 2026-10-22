import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for Client Components and hooks.
 *
 * `createBrowserClient` memoises a singleton per browser tab, so calling this
 * from multiple hooks/components is cheap and shares the same auth session.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>;
