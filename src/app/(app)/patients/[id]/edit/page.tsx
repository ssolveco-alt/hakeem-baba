import { PatientEditClient } from "../../patient-edit-client";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientEditClient id={id} />;
}
