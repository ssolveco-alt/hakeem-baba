import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PatientForm } from "../../patient-form";
import { updatePatient } from "../../actions";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!data) notFound();

  const patient = data as Patient;
  const action = updatePatient.bind(null, id);

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${patient.name}`} />
      <PatientForm patient={patient} action={action} />
    </div>
  );
}
