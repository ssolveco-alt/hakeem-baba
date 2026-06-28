-- ============================================================================
-- HakeemCare — Offline sync support (RxDB <-> Supabase replication)
-- Adds the columns RxDB needs to detect changes & deletions:
--   updated_at  -> replication checkpoint (what changed since last sync)
--   deleted     -> soft-delete flag RxDB maps to its _deleted
-- Safe to re-run.
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
  synced_tables text[] := array['patients','visits','nuskhas','visit_nuskhas','settings','clinics'];
begin
  foreach t in array synced_tables loop
    -- updated_at column
    execute format(
      'alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
    -- deleted flag (join/settings/clinics may not have had deleted_at)
    execute format(
      'alter table public.%I add column if not exists deleted boolean not null default false', t);
    -- keep updated_at fresh on every UPDATE
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
    -- index to make "changed since checkpoint" pulls fast
    execute format(
      'create index if not exists idx_%I_updated_at on public.%I (updated_at, id)', t, t);
  end loop;
end $$;

-- Backfill: mark already soft-deleted rows as deleted = true.
update public.patients set deleted = true where deleted_at is not null and deleted = false;
update public.visits   set deleted = true where deleted_at is not null and deleted = false;
update public.nuskhas  set deleted = true where deleted_at is not null and deleted = false;

-- ============================================================================
-- DONE.
-- ============================================================================
