import { PatientProfileClient } from "../patient-profile-client";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientProfileClient id={id} />;
}
