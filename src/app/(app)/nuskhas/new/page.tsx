import { PageHeader } from "@/components/page-header";
import { NuskhaForm } from "../nuskha-form";

export default function NewNuskhaPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Nuskha" subtitle="Save a nuskha to your library — works offline" />
      <NuskhaForm />
    </div>
  );
}
