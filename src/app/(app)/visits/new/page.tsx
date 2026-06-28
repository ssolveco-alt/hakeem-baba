import { PageHeader } from "@/components/page-header";
import { VisitForm } from "../visit-form";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const { patient } = await searchParams;
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Visit" subtitle="Record a visit and assign nuskhas — works offline" />
      <VisitForm preselectedId={patient} />
    </div>
  );
}
