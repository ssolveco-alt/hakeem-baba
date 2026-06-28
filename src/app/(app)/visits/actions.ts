"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function str(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function createVisit(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const patientId = str(formData.get("patient_id"));
  if (!patientId) throw new Error("Please choose a patient");

  const feeRaw = str(formData.get("fee"));

  // 1) Create the visit.
  const { data: visit, error } = await supabase
    .from("visits")
    .insert({
      clinic_id: user.clinic_id,
      patient_id: patientId,
      visit_date: str(formData.get("visit_date")) ?? new Date().toISOString().slice(0, 10),
      disease: str(formData.get("disease")),
      symptoms: str(formData.get("symptoms")),
      notes: str(formData.get("notes")),
      fee: feeRaw ? Number(feeRaw) : 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // 2) Collect nuskha links. Existing selected ids come as repeated "nuskha_ids".
  const nuskhaIds = new Set(
    formData.getAll("nuskha_ids").map((v) => v.toString()).filter(Boolean)
  );

  // 3) Optional brand-new nuskha from an uploaded image.
  const newImage = str(formData.get("new_nuskha_image"));
  if (newImage) {
    const { data: created, error: nErr } = await supabase
      .from("nuskhas")
      .insert({
        clinic_id: user.clinic_id,
        name: str(formData.get("disease")) || "Visit Nuskha",
        category: "General",
        image_url: newImage,
        status: "active",
      })
      .select("id")
      .single();
    if (nErr) throw new Error(nErr.message);
    nuskhaIds.add(created.id);
  }

  if (nuskhaIds.size > 0) {
    const rows = [...nuskhaIds].map((nuskha_id) => ({
      clinic_id: user.clinic_id,
      visit_id: visit.id,
      nuskha_id,
    }));
    const { error: linkErr } = await supabase.from("visit_nuskhas").insert(rows);
    if (linkErr) throw new Error(linkErr.message);
  }

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/visits");
  redirect(`/patients/${patientId}`);
}

export async function deleteVisit(id: string, patientId: string) {
  const user = await requireUser();
  if (user.role === "assistant") throw new Error("Assistants cannot delete data");
  const supabase = await createClient();

  const { error } = await supabase
    .from("visits")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}
