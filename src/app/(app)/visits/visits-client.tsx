"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarPlus, FileText, Loader2 } from "lucide-react";
import type { Visit, Patient } from "@/lib/types";
import { useRxData } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { useInfiniteList } from "@/lib/hooks/use-infinite-list";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function VisitsClient() {
  const t = useT();
  const { data: visits, loading } = useRxData<Visit>("visits", (c) => c.find());
  const { data: patients } = useRxData<Patient>("patients", (c) => c.find());

  const rows = useMemo(() => {
    const byId = new Map(patients.map((p) => [p.id, p]));
    return [...visits]
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1))
      .map((v) => ({ ...v, patient: byId.get(v.patient_id) }));
  }, [visits, patients]);

  const { visible, sentinelRef, hasMore, shown, total } = useInfiniteList(rows, { pageSize: 24 });

  return (
    <div>
      <PageHeader
        title={t("visits.title")}
        subtitle={t("visits.subtitle")}
        action={
          <Link href="/visits/new">
            <Button><CalendarPlus /> {t("visits.new")}</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="me-2 h-5 w-5 animate-spin" /> {t("common.loading")}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t("visits.none")}</CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((v) => (
            <Link key={v.id} href={v.patient ? `/patients/${v.patient.id}` : "#"}>
              <Card className="h-full transition-colors hover:border-primary hover:bg-accent">
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

        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="me-2 h-5 w-5 animate-spin" /> {t("list.loadingMore")}
          </div>
        )}
        <p className="pt-2 text-center text-sm text-muted-foreground">
          {t("list.showing")} {shown} / {total}
        </p>
        </>
      )}
    </div>
  );
}
