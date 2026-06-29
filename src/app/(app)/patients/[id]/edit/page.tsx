"use client";

import { useParams } from "next/navigation";
import { PatientEditClient } from "../../patient-edit-client";

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>();
  return <PatientEditClient id={id} />;
}
