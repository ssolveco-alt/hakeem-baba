"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function str(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function createPatient(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const name = str(formData.get("name"));
  const phone = str(formData.get("phone"));
  if (!name || !phone) throw new Error("Name and phone are required");

  const ageRaw = str(formData.get("age"));

  const { data, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: user.clinic_id,
      name,
      phone,
      age: ageRaw ? Number(ageRaw) : null,
      gender: str(formData.get("gender")),
      address: str(formData.get("address")),
      notes: str(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/patients");
  redirect(`/patients/${data.id}`);
}

export async function updatePatient(id: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const name = str(formData.get("name"));
  const phone = str(formData.get("phone"));
  if (!name || !phone) throw new Error("Name and phone are required");

  const ageRaw = str(formData.get("age"));

  const { error } = await supabase
    .from("patients")
    .update({
      name,
      phone,
      age: ageRaw ? Number(ageRaw) : null,
      gender: str(formData.get("gender")),
      address: str(formData.get("address")),
      notes: str(formData.get("notes")),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/patients/${id}`);
  redirect(`/patients/${id}`);
}

// Soft delete (PRD: prefer soft delete). Only Hakeem may delete.
export async function deletePatient(id: string) {
  const user = await requireUser();
  if (user.role === "assistant") throw new Error("Assistants cannot delete data");
  const supabase = await createClient();

  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/patients");
  redirect("/patients");
}
