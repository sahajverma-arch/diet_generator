-- ============================================================================
--  LEANR AI Diet Report Generator — initial schema
--  Run this in the Supabase SQL Editor, or via `supabase db push`.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
--  reports
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  client_name       text not null,
  status            text not null default 'processing'
                      check (status in ('processing', 'completed', 'failed')),
  source_filename   text,
  source_size_bytes bigint,
  original_pdf_path text,
  json_path         text,
  final_pdf_path    text,
  report_data       jsonb,
  error_message     text,
  model             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists reports_user_created_idx
  on public.reports (user_id, created_at desc);

-- keep updated_at fresh -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
--  Row Level Security — every user sees only their own reports
-- ----------------------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
  on public.reports for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own"
  on public.reports for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own"
  on public.reports for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
--  Storage bucket (private) + user-scoped policies
--  The app writes via the service-role key (which bypasses these policies),
--  but the policies provide defence-in-depth for any direct client access.
--  Object paths are laid out as: {user_id}/{report_id}/{file}
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('diet-reports', 'diet-reports', false)
on conflict (id) do nothing;

drop policy if exists "diet_reports_select_own" on storage.objects;
create policy "diet_reports_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'diet-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "diet_reports_insert_own" on storage.objects;
create policy "diet_reports_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'diet-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "diet_reports_update_own" on storage.objects;
create policy "diet_reports_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'diet-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "diet_reports_delete_own" on storage.objects;
create policy "diet_reports_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'diet-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
