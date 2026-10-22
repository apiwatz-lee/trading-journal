import type { Trade, TradeInsert, TradeUpdate } from "./trade";

/**
 * supabase-js requires table shapes to be assignable to `Record<string, unknown>`.
 * Interfaces are not (no implicit index signature), so we flatten them into
 * anonymous object types with a mapped type.
 */
type Flatten<T> = { [K in keyof T]: T[K] };

/**
 * Hand-written Supabase `Database` type for the `public` schema.
 *
 * Regenerate with the Supabase CLI once a project is linked:
 *   supabase gen types typescript --linked > src/types/database.ts
 */
export type Database = {
  public: {
    Tables: {
      trades: {
        Row: Flatten<Trade>;
        Insert: Flatten<Partial<Pick<Trade, "id" | "created_at">> & TradeInsert>;
        Update: Flatten<Partial<TradeUpdate>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
