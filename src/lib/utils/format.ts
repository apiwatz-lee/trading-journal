import { format, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

/** `1234.5` → `$1,234.50`. Pass `signed` to prefix `+` for positive values. */
export function formatCurrency(
  value: number,
  options: { signed?: boolean; compact?: boolean } = {},
): string {
  const { signed = false, compact = false } = options;
  const formatter = compact ? compactCurrencyFormatter : currencyFormatter;
  const formatted = formatter.format(Math.abs(value));
  if (value < 0) return `-${formatted}`;
  if (signed && value > 0) return `+${formatted}`;
  return formatted;
}

/** Prices can have many decimals (e.g. 0.00001234). Keep them precise. */
export function formatPrice(value: number): string {
  return numberFormatter.format(value);
}

/** `55.123` → `55.1%` */
export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** Trade entry date: `22 Oct 2026, 10:30` */
export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}

/** Short date for tables and chart ticks: `22 Oct` */
export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "dd MMM");
}

/** Full date without time: `22 Oct 2026` */
export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy");
}

/** Value for a `<input type="datetime-local">` (local time, minute precision). */
export function toDateTimeLocal(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}

/** Convert a `datetime-local` value back to an ISO timestamp. */
export function fromDateTimeLocal(local: string): string {
  return new Date(local).toISOString();
}
