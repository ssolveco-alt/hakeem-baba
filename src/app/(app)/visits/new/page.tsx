import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Patient, Nuskha } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { VisitForm } from "../visit-form";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const { patient: patientId } = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: nuskhas }, preselected] = await Promise.all([
    supabase
      .from("nuskhas")
      .select("*")
      .is("deleted_at", null)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30),
    patientId
      ? supabase.from("patients").select("*").eq("id", patientId).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Visit" subtitle="Record a patient's visit and assign nuskhas" />
      <VisitForm
        clinicId={user.clinic_id!}
        nuskhas={(nuskhas as Nuskha[]) ?? []}
        preselected={(preselected?.data as Patient) ?? null}
      />
    </div>
  );
}
