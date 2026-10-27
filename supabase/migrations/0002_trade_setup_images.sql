-- Before / After setup screenshots for a trade.
-- Run this in the Supabase SQL Editor (or `supabase db push` with the CLI).

alter table public.trades
  add column if not exists setup_before_path text,
  add column if not exists setup_after_path text;

comment on column public.trades.setup_before_path is
  'Object path in the private trade-setups bucket, or null when no before image is attached.';
comment on column public.trades.setup_after_path is
  'Object path in the private trade-setups bucket, or null when no after image is attached.';

-- Private bucket. 5 MB, JPEG / PNG / WebP only. Paths are {user_id}/{trade_id}/{slot}.{ext}.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trade-setups',
  'trade-setups',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Users may only touch objects stored under their own auth uid.
drop policy if exists "Users can read their own trade setups" on storage.objects;
create policy "Users can read their own trade setups"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'trade-setups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload their own trade setups" on storage.objects;
create policy "Users can upload their own trade setups"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'trade-setups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own trade setups" on storage.objects;
create policy "Users can update their own trade setups"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'trade-setups'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'trade-setups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own trade setups" on storage.objects;
create policy "Users can delete their own trade setups"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'trade-setups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
