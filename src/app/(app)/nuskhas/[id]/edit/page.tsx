import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Nuskha } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { NuskhaForm } from "../../nuskha-form";
import { updateNuskha } from "../../actions";

export default async function EditNuskhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("nuskhas").select("*").eq("id", id).single();
  if (!data) notFound();

  const action = updateNuskha.bind(null, id);
  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Nuskha" />
      <NuskhaForm nuskha={data as Nuskha} clinicId={user.clinic_id!} action={action} />
    </div>
  );
}
