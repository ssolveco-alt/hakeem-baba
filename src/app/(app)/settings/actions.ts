"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function str(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function updateClinicSettings(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "hakeem") throw new Error("Only the clinic owner can change settings");
  const supabase = await createClient();

  const name = str(formData.get("name"));
  if (!name) throw new Error("Clinic name is required");

  const { error } = await supabase
    .from("clinics")
    .update({
      name,
      owner_name: str(formData.get("owner_name")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
      logo: str(formData.get("logo")),
    })
    .eq("id", user.clinic_id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
