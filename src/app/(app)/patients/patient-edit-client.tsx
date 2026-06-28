"use client";

import { Loader2 } from "lucide-react";
import type { Patient } from "@/lib/types";
import { useRxData } from "@/lib/offline/provider";
import { PageHeader } from "@/components/page-header";
import { PatientForm } from "./patient-form";

export function PatientEditClient({ id }: { id: string }) {
  const { data, loading } = useRxData<Patient>("patients", (c) => c.find({ selector: { id } }), [id]);
  const patient = data[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }
  if (!patient) {
    return <p className="py-16 text-center text-muted-foreground">Patient not found.</p>;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${patient.name}`} />
      <PatientForm patient={patient} />
    </div>
  );
}
