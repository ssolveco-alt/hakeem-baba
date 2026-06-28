import { NuskhaEditClient } from "../../nuskha-edit-client";

export default async function EditNuskhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NuskhaEditClient id={id} />;
}
