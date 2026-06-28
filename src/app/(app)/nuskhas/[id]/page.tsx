import { NuskhaDetailsClient } from "../nuskha-details-client";

export default async function NuskhaDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NuskhaDetailsClient id={id} />;
}
