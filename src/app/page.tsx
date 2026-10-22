import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * `/` is never rendered: proxy.ts already redirects based on session, and
 * this is a defensive fallback in case the proxy matcher is changed.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
