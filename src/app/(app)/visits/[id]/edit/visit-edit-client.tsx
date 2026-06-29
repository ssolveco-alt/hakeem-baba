"use client";

import { Loader2 } from "lucide-react";
import type { Visit } from "@/lib/types";
import { useRxData } from "@/lib/offline/provider";
import { PageHeader } from "@/components/page-header";
import { VisitForm } from "../../visit-form";

export function VisitEditClient({ id }: { id: string }) {
  const { data: visits, loading } = useRxData<Visit>("visits", (c) => c.find({ selector: { id } }), [id]);
  const { data: links } = useRxData<{ visit_id: string; nuskha_id: string }>("visit_nuskhas", (c) => c.find());
  const visit = visits[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }
  if (!visit) {
    return <p className="py-16 text-center text-muted-foreground">Visit not found.</p>;
  }

  const existingNuskhaIds = links.filter((l) => l.visit_id === id).map((l) => l.nuskha_id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Visit" />
      <VisitForm visit={visit} existingNuskhaIds={existingNuskhaIds} />
    </div>
  );
}
