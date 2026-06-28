"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function str(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function createNuskha(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const name = str(formData.get("name"));
  if (!name) throw new Error("Name is required");

  const { data, error } = await supabase
    .from("nuskhas")
    .insert({
      clinic_id: user.clinic_id,
      name,
      category: str(formData.get("category")),
      description: str(formData.get("description")),
      image_url: str(formData.get("image_url")),
      notes: str(formData.get("notes")),
      status: (str(formData.get("status")) as "active" | "inactive") ?? "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/nuskhas");
  redirect(`/nuskhas/${data.id}`);
}

export async function updateNuskha(id: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const name = str(formData.get("name"));
  if (!name) throw new Error("Name is required");

  const { error } = await supabase
    .from("nuskhas")
    .update({
      name,
      category: str(formData.get("category")),
      description: str(formData.get("description")),
      image_url: str(formData.get("image_url")),
      notes: str(formData.get("notes")),
      status: (str(formData.get("status")) as "active" | "inactive") ?? "active",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/nuskhas/${id}`);
  redirect(`/nuskhas/${id}`);
}

export async function deleteNuskha(id: string) {
  const user = await requireUser();
  if (user.role === "assistant") throw new Error("Assistants cannot delete data");
  const supabase = await createClient();

  const { error } = await supabase
    .from("nuskhas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/nuskhas");
  redirect("/nuskhas");
}
