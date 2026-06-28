"use client";

import { Loader2 } from "lucide-react";
import type { Nuskha } from "@/lib/types";
import { useRxData } from "@/lib/offline/provider";
import { PageHeader } from "@/components/page-header";
import { NuskhaForm } from "./nuskha-form";

export function NuskhaEditClient({ id }: { id: string }) {
  const { data, loading } = useRxData<Nuskha>("nuskhas", (c) => c.find({ selector: { id } }), [id]);
  const nuskha = data[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }
  if (!nuskha) {
    return <p className="py-16 text-center text-muted-foreground">Nuskha not found.</p>;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Nuskha" />
      <NuskhaForm nuskha={nuskha} />
    </div>
  );
}
