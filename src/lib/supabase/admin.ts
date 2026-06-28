import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service_role key, which bypasses RLS.
// Only import from server actions / route handlers guarded by a platform_admin check.
// Never import this into a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
