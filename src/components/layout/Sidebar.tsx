import Link from "next/link";
import { CandlestickChart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";

interface SidebarProps {
  email: string;
}

export const SIDEBAR_WIDTH_CLASS = "w-64";

export function Sidebar({ email }: SidebarProps) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden ${SIDEBAR_WIDTH_CLASS} flex-col border-r border-zinc-800 bg-zinc-950 md:flex`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20">
            <CandlestickChart className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            Trading Journal
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
          Overview
        </p>
        <SidebarNav />
      </div>

      {/* User */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100">{email}</p>
            <p className="text-xs text-zinc-500">Trader</p>
          </div>
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
      </div>
    </aside>
  );
}
