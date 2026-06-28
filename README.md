# HakeemCare

A simple, fast, multi-tenant SaaS for traditional Hakeems to digitally manage
patients, visits, and a Nuskha (prescription) image library.

> **Primary goal:** a Hakeem can find any patient and their previous Nuskhas in
> under 10 seconds.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase**
(Auth, Postgres with Row Level Security, and Storage).

---

## 1. One-time Supabase setup

The app is already wired to the Supabase project in `.env.local`. You only need
to create the database schema and your first admin.

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.
   This creates every table, all Row Level Security policies, the patient-code
   trigger, and the three storage buckets (`clinic-logos`, `nuskha-images`,
   `future-patient-files`).
3. Create your **Platform Admin** account:
   - Supabase Dashboard → **Authentication → Users → Add user**. Enter your
     email + password and tick *Auto Confirm User*.
   - Open [`supabase/seed-admin.sql`](supabase/seed-admin.sql), change the email
     to the one you just created, and **Run** it. This promotes that user to
     `platform_admin`.

## 2. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

## 3. How the roles flow

| Role | Lands on | Can do |
|------|----------|--------|
| **Platform Admin** | `/admin` | Create / suspend / activate / delete clinics, reset a clinic owner's password, view platform-wide stats. |
| **Hakeem** (clinic owner) | `/dashboard` | Patients, Visits, Nuskha library, clinic settings, (staff). |
| **Assistant** | `/dashboard` | Add/edit patients, create visits, upload nuskhas. Cannot delete or change settings. |

**Typical first run:** sign in as the Platform Admin → **Create Clinic** (this
also creates the Hakeem's login + an isolated workspace) → hand the Hakeem their
email/password → they log in and start adding patients.

## 4. Architecture notes

- **Multi-tenancy & security.** Every business table has a `clinic_id` and is
  protected by Postgres **Row Level Security**. A logged-in Hakeem/Assistant can
  only ever read or write rows for their own clinic — enforced in the database,
  not just the UI. See the policies in `supabase/schema.sql`.
- **Three Supabase clients** (`src/lib/supabase/`):
  - `client.ts` — browser, anon key, RLS-bound (search, uploads).
  - `server.ts` — server components / actions, honors the user session.
  - `admin.ts` — **service role, bypasses RLS**. Server-only, and every use is
    gated by `requireAdmin()` (`src/lib/admin-guard.ts`). Used solely for
    Platform Admin operations like creating clinics + auth users.
- **Auth & routing.** `src/middleware.ts` refreshes the session and protects
  routes; `src/app/page.tsx` routes each role to its home. Suspended clinics are
  bounced to `/suspended`.
- **Soft deletes.** Patients, visits, and nuskhas set `deleted_at` instead of
  hard-deleting (per the PRD).
- **Patient codes** like `P-0001` are generated per-clinic by a DB trigger.

## 5. Project structure

```
src/
  app/
    (app)/            # Hakeem + Assistant area (dashboard, patients, visits, nuskhas, settings)
    admin/            # Platform Admin area (clinics, create clinic)
    login/ forgot-password/ auth/   # authentication
  components/         # AppShell, cards, image upload, confirm-delete, UI primitives
  lib/                # supabase clients, auth guards, types, utils
supabase/
  schema.sql          # run this first
  seed-admin.sql      # promote your first platform admin
```

## 6. Environment variables (`.env.local`)

| Variable | Used by |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** — admin operations |

> ⚠️ The service role key bypasses RLS. It must never be prefixed with
> `NEXT_PUBLIC_` and is only imported in server-side admin code.

## 7. Deployment (Vercel)

Push to GitHub, import the repo in Vercel, and add the three environment
variables above in **Project → Settings → Environment Variables**. Build command
and output are the Next.js defaults.

---

### Out of scope for this MVP
No AI, OCR, voice, WhatsApp/SMS, billing, inventory, appointments, or analytics —
intentionally kept simple for low-tech-literacy users.
