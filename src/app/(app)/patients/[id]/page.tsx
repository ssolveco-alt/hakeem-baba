"use client";

import { useParams } from "next/navigation";
import { PatientProfileClient } from "../patient-profile-client";

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  return <PatientProfileClient id={id} />;
}
