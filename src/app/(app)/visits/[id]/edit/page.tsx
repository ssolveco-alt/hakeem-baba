import { VisitEditClient } from "./visit-edit-client";

export default async function EditVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VisitEditClient id={id} />;
}
