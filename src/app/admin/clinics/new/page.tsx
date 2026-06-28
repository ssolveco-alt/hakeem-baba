import { PageHeader } from "@/components/page-header";
import { ClinicForm } from "./clinic-form";

export default function NewClinicPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create Clinic"
        subtitle="This also creates the Hakeem's login account and workspace"
      />
      <ClinicForm />
    </div>
  );
}
