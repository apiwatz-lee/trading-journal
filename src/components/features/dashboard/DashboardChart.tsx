"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDate, formatShortDate } from "@/lib/utils";
import type { EquityPoint } from "@/types/trade";
import { pnlColor } from "@/components/features/trades/TradeBadges";

/* Tailwind palette values used inside SVG, where utility classes don't apply. */
const COLORS = {
  emerald: "#34d399", // emerald-400
  rose: "#fb7185", // rose-400
  grid: "#27272a", // zinc-800
  axis: "#71717a", // zinc-500
  zeroLine: "#3f3f46", // zinc-700
} as const;

const MONO_TICK = {
  fill: COLORS.axis,
  fontSize: 11,
  fontFamily: "var(--font-geist-mono)",
} as const;

interface DashboardChartProps {
  data: EquityPoint[];
  className?: string;
}

export function DashboardChart({ data, className }: DashboardChartProps) {
  const gradientId = useId();

  const { lastEquity, color, isEmpty } = useMemo(() => {
    const last = data.at(-1)?.equity ?? 0;
    return {
      lastEquity: last,
      color: last >= 0 ? COLORS.emerald : COLORS.rose,
      isEmpty: data.length === 0,
    };
  }, [data]);

  return (
    <Card
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900 ring-0 [--card-spacing:--spacing(5)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-zinc-100">
            Equity curve
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Cumulative realised PnL by trading day
          </CardDescription>
        </div>
        {!isEmpty && (
          <div className="text-right">
            <p className="text-xs text-zinc-500">Current</p>
            <p
              className={cn(
                "font-mono text-lg font-semibold tabular-nums",
                pnlColor(lastEquity),
              )}
            >
              {formatCurrency(lastEquity, { signed: true })}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isEmpty ? (
          <ChartEmptyState />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke={COLORS.grid}
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={MONO_TICK}
                  tickLine={false}
                  axisLine={{ stroke: COLORS.grid }}
                  tickMargin={10}
                  minTickGap={32}
                  tickFormatter={formatShortDate}
                />
                <YAxis
                  tick={MONO_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v: number) =>
                    formatCurrency(v, { compact: true, signed: true })
                  }
                />

                <ReferenceLine
                  y={0}
                  stroke={COLORS.zeroLine}
                  strokeDasharray="4 4"
                />

                <Tooltip
                  cursor={{ stroke: COLORS.axis, strokeDasharray: "3 3" }}
                  content={<EquityTooltip />}
                />

                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: color,
                    stroke: "#18181b",
                    strokeWidth: 2,
                  }}
                  isAnimationActive
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EquityTooltip({
  active,
  payload,
}: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as EquityPoint | undefined;
  if (!point) return null;

  return (
    <div className="min-w-44 rounded-lg border border-zinc-800 bg-zinc-900/95 p-3 font-mono text-xs shadow-xl shadow-black/40 backdrop-blur">
      <p className="mb-2 text-zinc-400">{formatDate(point.date)}</p>
      <div className="flex flex-col gap-1.5">
        <Row
          label="Equity"
          value={formatCurrency(point.equity, { signed: true })}
          valueClass={pnlColor(point.equity)}
        />
        <Row
          label="Day PnL"
          value={formatCurrency(point.pnl, { signed: true })}
          valueClass={pnlColor(point.pnl)}
        />
        <Row label="Trades" value={String(point.trades)} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-zinc-500">{label}</span>
      <span className={cn("font-semibold text-zinc-100 tabular-nums", valueClass)}>
        {value}
      </span>
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-400">
        <LineChartIcon className="size-6" />
      </span>
      <p className="text-sm font-medium text-zinc-200">No data to chart yet</p>
      <p className="mt-1 max-w-xs text-xs text-zinc-500">
        Your equity curve will draw itself as soon as you log a trade.
      </p>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-4 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
      >
        <Link href="/trades">Go to trades</Link>
      </Button>
    </div>
  );
}

export function DashboardChartSkeleton({ className }: { className?: string }) {
  return (
    <Card
      role="status"
      aria-label="Loading chart"
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900 ring-0 [--card-spacing:--spacing(5)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28 bg-zinc-800" />
          <Skeleton className="h-3 w-48 bg-zinc-800" />
        </div>
        <Skeleton className="h-6 w-24 bg-zinc-800" />
      </CardHeader>
      <CardContent>
        <div className="flex h-72 items-end gap-2 px-2 pb-6">
          {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-sm bg-zinc-800"
              style={{ height: `${h}%`, opacity: 0.4 + (i / 12) * 0.6 }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
