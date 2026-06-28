-- ============================================================================
-- HakeemCare — Multi-tenant SaaS schema with Row Level Security
-- Run this in the Supabase SQL editor (Dashboard > SQL > New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY guards.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('platform_admin', 'hakeem', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type clinic_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nuskha_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

create table if not exists public.clinics (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  owner_name        text,
  phone             text,
  email             text,
  address           text,
  logo              text,
  subscription_plan text default 'free',
  status            clinic_status not null default 'active',
  patient_seq       integer not null default 0,  -- per-clinic patient code counter
  created_at        timestamptz not null default now()
);

-- Application users. id == auth.users.id (1:1). Platform admins have clinic_id = null.
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  clinic_id  uuid references public.clinics(id) on delete cascade,
  role       user_role not null default 'hakeem',
  name       text,
  email      text,
  phone      text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics(id) on delete cascade,
  patient_code text,
  name         text not null,
  phone        text not null,
  age          integer,
  gender       text,
  address      text,
  notes        text,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (clinic_id, patient_code)
);

create table if not exists public.visits (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_date date not null default current_date,
  disease    text,
  symptoms   text,
  notes      text,
  fee        numeric(10,2) default 0,
  created_by uuid references public.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.nuskhas (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  name        text not null,
  category    text,
  description text,
  image_url   text,
  notes       text,
  status      nuskha_status not null default 'active',
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.visit_nuskhas (
  id        uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  visit_id  uuid not null references public.visits(id) on delete cascade,
  nuskha_id uuid not null references public.nuskhas(id) on delete cascade,
  unique (visit_id, nuskha_id)
);

create table if not exists public.settings (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null unique references public.clinics(id) on delete cascade,
  clinic_name text,
  phone       text,
  address     text,
  logo        text,
  language    text default 'en'
);

-- Helpful indexes for fast search (Primary goal: find a patient in 10s)
create index if not exists idx_patients_clinic       on public.patients (clinic_id);
create index if not exists idx_patients_phone        on public.patients (clinic_id, phone);
create index if not exists idx_patients_name         on public.patients (clinic_id, lower(name));
create index if not exists idx_visits_patient        on public.visits (patient_id);
create index if not exists idx_visits_clinic_date    on public.visits (clinic_id, visit_date desc);
create index if not exists idx_nuskhas_clinic        on public.nuskhas (clinic_id);
create index if not exists idx_visit_nuskhas_visit   on public.visit_nuskhas (visit_id);

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS (SECURITY DEFINER -> bypass RLS to avoid recursion)
-- ----------------------------------------------------------------------------
create or replace function public.current_clinic_id()
returns uuid language sql stable security definer set search_path = public as $$
  select clinic_id from public.users where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'platform_admin'
  );
$$;

-- Auto-generate per-clinic patient_code like P-0001
create or replace function public.assign_patient_code()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  next_seq integer;
begin
  if new.patient_code is null or new.patient_code = '' then
    update public.clinics
       set patient_seq = patient_seq + 1
     where id = new.clinic_id
     returning patient_seq into next_seq;
    new.patient_code := 'P-' || lpad(next_seq::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_patient_code on public.patients;
create trigger trg_assign_patient_code
  before insert on public.patients
  for each row execute function public.assign_patient_code();

-- ----------------------------------------------------------------------------
-- ENABLE RLS
-- ----------------------------------------------------------------------------
alter table public.clinics       enable row level security;
alter table public.users         enable row level security;
alter table public.patients      enable row level security;
alter table public.visits        enable row level security;
alter table public.nuskhas       enable row level security;
alter table public.visit_nuskhas enable row level security;
alter table public.settings      enable row level security;

-- ----------------------------------------------------------------------------
-- POLICIES
-- Note: the service_role key (used by Platform Admin server actions) bypasses
-- RLS entirely. These policies govern logged-in Hakeems/Assistants.
-- ----------------------------------------------------------------------------

-- CLINICS: a user can read their own clinic; platform admin reads all.
drop policy if exists clinics_select on public.clinics;
create policy clinics_select on public.clinics for select
  using (is_platform_admin() or id = current_clinic_id());

drop policy if exists clinics_update on public.clinics;
create policy clinics_update on public.clinics for update
  using (is_platform_admin() or (id = current_clinic_id() and current_user_role() = 'hakeem'));

-- USERS: read users within your clinic; platform admin reads all. Hakeem manages staff.
drop policy if exists users_select on public.users;
create policy users_select on public.users for select
  using (is_platform_admin() or id = auth.uid() or clinic_id = current_clinic_id());

drop policy if exists users_insert on public.users;
create policy users_insert on public.users for insert
  with check (is_platform_admin() or (clinic_id = current_clinic_id() and current_user_role() = 'hakeem'));

drop policy if exists users_update on public.users;
create policy users_update on public.users for update
  using (is_platform_admin() or id = auth.uid() or (clinic_id = current_clinic_id() and current_user_role() = 'hakeem'));

-- Generic tenant tables: everything scoped to current_clinic_id().
-- PATIENTS
drop policy if exists patients_all on public.patients;
create policy patients_all on public.patients for all
  using (is_platform_admin() or clinic_id = current_clinic_id())
  with check (is_platform_admin() or clinic_id = current_clinic_id());

-- VISITS
drop policy if exists visits_all on public.visits;
create policy visits_all on public.visits for all
  using (is_platform_admin() or clinic_id = current_clinic_id())
  with check (is_platform_admin() or clinic_id = current_clinic_id());

-- NUSKHAS
drop policy if exists nuskhas_all on public.nuskhas;
create policy nuskhas_all on public.nuskhas for all
  using (is_platform_admin() or clinic_id = current_clinic_id())
  with check (is_platform_admin() or clinic_id = current_clinic_id());

-- VISIT_NUSKHAS
drop policy if exists visit_nuskhas_all on public.visit_nuskhas;
create policy visit_nuskhas_all on public.visit_nuskhas for all
  using (is_platform_admin() or clinic_id = current_clinic_id())
  with check (is_platform_admin() or clinic_id = current_clinic_id());

-- SETTINGS
drop policy if exists settings_all on public.settings;
create policy settings_all on public.settings for all
  using (is_platform_admin() or clinic_id = current_clinic_id())
  with check (is_platform_admin() or (clinic_id = current_clinic_id() and current_user_role() = 'hakeem'));

-- ----------------------------------------------------------------------------
-- STORAGE BUCKETS + POLICIES
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('clinic-logos', 'clinic-logos', true),
  ('nuskha-images', 'nuskha-images', true),
  ('future-patient-files', 'future-patient-files', false)
on conflict (id) do nothing;

-- Public read for logos & nuskha images (display in <img>). Writes require auth.
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select
  using (bucket_id in ('clinic-logos', 'nuskha-images'));

drop policy if exists "auth upload media" on storage.objects;
create policy "auth upload media" on storage.objects for insert to authenticated
  with check (bucket_id in ('clinic-logos', 'nuskha-images', 'future-patient-files'));

drop policy if exists "auth update media" on storage.objects;
create policy "auth update media" on storage.objects for update to authenticated
  using (bucket_id in ('clinic-logos', 'nuskha-images', 'future-patient-files'));

drop policy if exists "auth delete media" on storage.objects;
create policy "auth delete media" on storage.objects for delete to authenticated
  using (bucket_id in ('clinic-logos', 'nuskha-images', 'future-patient-files'));

-- ============================================================================
-- DONE. Next: create your Platform Admin via supabase/seed-admin.sql
-- ============================================================================
