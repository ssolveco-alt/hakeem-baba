-- ============================================================================
-- Promote an existing auth user to Platform Admin (Super Admin).
--
-- Step 1: In Supabase Dashboard > Authentication > Users, click "Add user",
--         create one with your email + a password (and confirm the email).
-- Step 2: Replace the email below and run this in the SQL editor.
-- ============================================================================

insert into public.users (id, clinic_id, role, name, email, active)
select id, null, 'platform_admin', 'Platform Admin', email, true
from auth.users
where email = 'admin@hakeemcare.app'   -- <-- CHANGE THIS to your admin email
on conflict (id) do update
  set role = 'platform_admin', clinic_id = null, active = true;
