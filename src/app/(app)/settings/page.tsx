import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Clinic } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  if (user.role === "assistant") redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", user.clinic_id)
    .single();

  if (!data) redirect("/dashboard");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Clinic Settings" subtitle="Update your clinic details" />
      <SettingsForm clinic={data as Clinic} />
    </div>
  );
}
