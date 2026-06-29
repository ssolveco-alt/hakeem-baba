"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { VisitForm } from "../visit-form";

function NewVisitInner() {
  const sp = useSearchParams();
  const patient = sp.get("patient") ?? undefined;
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Visit" subtitle="Record a visit and assign nuskhas — works offline" />
      <VisitForm preselectedId={patient} />
    </div>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense>
      <NewVisitInner />
    </Suspense>
  );
}
