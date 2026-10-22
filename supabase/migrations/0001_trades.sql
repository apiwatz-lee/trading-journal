-- Trading Journal: trades table + Row Level Security
-- Run this in the Supabase SQL Editor (or `supabase db push` with the CLI).

create extension if not exists "pgcrypto";

create table if not exists public.trades (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  symbol         text not null,
  side           text not null check (side in ('LONG', 'SHORT')),
  entry_price    numeric not null check (entry_price > 0),
  exit_price     numeric not null check (exit_price > 0),
  position_size  numeric not null check (position_size > 0),
  pnl            numeric not null default 0,
  status         text not null check (status in ('WIN', 'LOSS', 'BREAKEVEN')),
  entry_date     timestamptz not null default now(),
  notes          text,
  created_at     timestamptz not null default now()
);

comment on table public.trades is 'Closed trades logged by users of the trading journal.';

-- Dashboard and history queries are always scoped to a user and sorted by date.
create index if not exists trades_user_date_idx
  on public.trades (user_id, entry_date desc);

alter table public.trades enable row level security;

-- Users may only see and mutate their own rows.
drop policy if exists "Users can manage their own trades" on public.trades;
create policy "Users can manage their own trades"
  on public.trades
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
