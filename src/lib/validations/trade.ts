import { z } from "zod";

const positiveNumber = (label: string) =>
  z.coerce
    .number({ error: `${label} is required` })
    .refine((v) => Number.isFinite(v), `${label} must be a number`)
    .refine((v) => v > 0, `${label} must be greater than 0`);

/**
 * Shape of the trade form. Numeric fields are coerced from the string values
 * that `<input type="number">` produces.
 */
export const tradeFormSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long")
    .transform((s) => s.toUpperCase()),
  side: z.enum(["LONG", "SHORT"], { error: "Select a side" }),
  entry_price: positiveNumber("Entry price"),
  exit_price: positiveNumber("Exit price"),
  position_size: positiveNumber("Position size"),
  /** `datetime-local` value, e.g. 2026-10-22T10:30 */
  entry_date: z
    .string()
    .min(1, "Entry date is required")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

/** Raw values held by react-hook-form (before coercion). */
export type TradeFormInput = z.input<typeof tradeFormSchema>;
/** Parsed values after validation. */
export type TradeFormValues = z.output<typeof tradeFormSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
