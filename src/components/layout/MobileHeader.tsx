import Link from "next/link";
import { CandlestickChart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";

/** Compact header shown below the `md` breakpoint where the sidebar is hidden. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20">
            <CandlestickChart className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Trading Journal
          </span>
        </Link>
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <LogOut />
          </Button>
        </form>
      </div>
      <div className="px-3 pb-3 [&_nav]:flex-row [&_nav]:flex-wrap [&_nav]:gap-2">
        <SidebarNav />
      </div>
    </header>
  );
}
