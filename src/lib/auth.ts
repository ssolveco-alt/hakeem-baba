import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

export type SessionUser = AppUser & {
  clinic_status: string | null;
  clinic_name: string | null;
  clinic_logo: string | null;
};

// Fetches the auth user + profile + clinic status in ONE round-trip.
// Wrapped in cache() so the layout and the page in the same navigation
// reuse a single result instead of re-querying Supabase each time.
const loadUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*, clinic:clinics(status, name, logo)")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { clinic, ...rest } = profile as AppUser & {
    clinic: { status: string; name: string | null; logo: string | null } | null;
  };
  return {
    ...(rest as AppUser),
    clinic_status: clinic?.status ?? null,
    clinic_name: clinic?.name ?? null,
    clinic_logo: clinic?.logo ?? null,
  };
});

// Returns the logged-in user or redirects to /login.
export async function requireUser(): Promise<SessionUser> {
  const user = await loadUser();
  if (!user) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }
  return user;
}

export async function getUser(): Promise<SessionUser | null> {
  return loadUser();
}
