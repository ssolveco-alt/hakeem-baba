import { PageHeader } from "@/components/page-header";
import { PatientForm } from "../patient-form";
import { createPatient } from "../actions";

export default function NewPatientPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Patient" subtitle="A patient code is generated automatically" />
      <PatientForm action={createPatient} />
    </div>
  );
}
