import type { Metadata } from "next";
import { TradesView } from "@/components/features/trades/TradesView";

export const metadata: Metadata = { title: "Trades" };

export default function TradesPage() {
  return <TradesView />;
}
