import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Ensures the caller is a Platform Admin, then returns a service-role client.
// Every admin server action must start with this.
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "platform_admin") {
    throw new Error("Forbidden: platform admin only");
  }
  return { admin: createAdminClient(), user };
}
