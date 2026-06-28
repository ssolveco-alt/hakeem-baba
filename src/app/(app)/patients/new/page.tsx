import { PageHeader } from "@/components/page-header";
import { PatientForm } from "../patient-form";

export default function NewPatientPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Patient" subtitle="Works offline — a code is assigned when it syncs" />
      <PatientForm />
    </div>
  );
}
