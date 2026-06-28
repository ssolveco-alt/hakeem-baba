import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { NuskhaForm } from "../nuskha-form";
import { createNuskha } from "../actions";

export default async function NewNuskhaPage() {
  const user = await requireUser();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Nuskha" subtitle="Save a handwritten nuskha to your library" />
      <NuskhaForm clinicId={user.clinic_id!} action={createNuskha} />
    </div>
  );
}
