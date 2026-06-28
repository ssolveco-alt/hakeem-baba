"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";

function str(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

// Creates a clinic + its Hakeem (owner) auth account + profile + settings.
// Uses the service-role client (bypasses RLS) — guarded by requireAdmin().
export async function createClinic(formData: FormData) {
  const { admin } = await requireAdmin();

  const clinicName = str(formData.get("clinic_name"));
  const ownerName = str(formData.get("owner_name"));
  const email = str(formData.get("email"));
  const password = str(formData.get("password"));

  if (!clinicName || !email || !password) {
    throw new Error("Clinic name, email and password are required");
  }
  if (password.length < 6) throw new Error("Password must be at least 6 characters");

  // 1) Create the auth user (owner / Hakeem).
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: ownerName },
  });
  if (authErr || !created.user) {
    throw new Error(authErr?.message || "Could not create owner account");
  }
  const ownerId = created.user.id;

  // 2) Create the clinic.
  const { data: clinic, error: clinicErr } = await admin
    .from("clinics")
    .insert({
      name: clinicName,
      owner_name: ownerName,
      email,
      phone: str(formData.get("phone")),
      subscription_plan: str(formData.get("subscription_plan")) ?? "free",
      status: (str(formData.get("status")) as "active" | "suspended") ?? "active",
    })
    .select("id")
    .single();

  if (clinicErr || !clinic) {
    await admin.auth.admin.deleteUser(ownerId); // rollback orphan auth user
    throw new Error(clinicErr?.message || "Could not create clinic");
  }

  // 3) Create the owner's profile row + clinic settings.
  const { error: profileErr } = await admin.from("users").insert({
    id: ownerId,
    clinic_id: clinic.id,
    role: "hakeem",
    name: ownerName,
    email,
    phone: str(formData.get("phone")),
    active: true,
  });
  if (profileErr) {
    await admin.from("clinics").delete().eq("id", clinic.id);
    await admin.auth.admin.deleteUser(ownerId);
    throw new Error(profileErr.message);
  }

  await admin.from("settings").insert({
    clinic_id: clinic.id,
    clinic_name: clinicName,
    phone: str(formData.get("phone")),
  });

  revalidatePath("/admin/clinics");
  redirect("/admin/clinics");
}

export async function setClinicStatus(clinicId: string, status: "active" | "suspended") {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("clinics").update({ status }).eq("id", clinicId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/clinics");
}

export async function resetOwnerPassword(clinicId: string, formData: FormData) {
  const { admin } = await requireAdmin();
  const password = str(formData.get("password"));
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");

  // Find the clinic owner (Hakeem).
  const { data: owner } = await admin
    .from("users")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("role", "hakeem")
    .limit(1)
    .single();
  if (!owner) throw new Error("Clinic owner not found");

  const { error } = await admin.auth.admin.updateUserById(owner.id, { password });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/clinics");
}

export async function deleteClinic(clinicId: string) {
  const { admin } = await requireAdmin();

  // Delete all auth users belonging to the clinic first.
  const { data: members } = await admin.from("users").select("id").eq("clinic_id", clinicId);
  for (const m of members ?? []) {
    await admin.auth.admin.deleteUser(m.id);
  }
  // Deleting the clinic cascades to users/patients/visits/nuskhas/settings.
  const { error } = await admin.from("clinics").delete().eq("id", clinicId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/clinics");
  redirect("/admin/clinics");
}
