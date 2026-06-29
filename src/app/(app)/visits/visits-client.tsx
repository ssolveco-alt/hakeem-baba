"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarPlus, FileText, Loader2 } from "lucide-react";
import type { Visit, Patient } from "@/lib/types";
import { useRxData } from "@/lib/offline/provider";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function VisitsClient() {
  const { data: visits, loading } = useRxData<Visit>("visits", (c) => c.find());
  const { data: patients } = useRxData<Patient>("patients", (c) => c.find());

  const rows = useMemo(() => {
    const byId = new Map(patients.map((p) => [p.id, p]));
    return [...visits]
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1))
      .map((v) => ({ ...v, patient: byId.get(v.patient_id) }));
  }, [visits, patients]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Visits"
        subtitle="Recent visits across your clinic"
        action={
          <Link href="/visits/new">
            <Button><CalendarPlus /> New Visit</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No visits yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((v) => (
            <Link key={v.id} href={v.patient ? `/patients/${v.patient.id}` : "#"}>
              <Card className="transition-colors hover:border-primary hover:bg-accent">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{v.patient?.name ?? "Unknown"}</p>
                      <p className="truncate text-sm text-muted-foreground">{v.disease || "Visit"}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {v.fee ? <Badge variant="success">{formatCurrency(v.fee)}</Badge> : null}
                    <Badge variant="muted">{formatDate(v.visit_date)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
