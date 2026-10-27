import type { Metadata } from "next";
import { RiskView } from "@/components/features/risk/RiskView";

export const metadata: Metadata = { title: "Risk" };

export default function RiskPage() {
  return <RiskView />;
}
