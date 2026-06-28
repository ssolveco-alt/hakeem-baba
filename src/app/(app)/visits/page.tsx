import Link from "next/link";
import { CalendarPlus, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type VisitRow = {
  id: string;
  visit_date: string;
  disease: string | null;
  fee: number | null;
  patient: { id: string; name: string; phone: string } | null;
};

export default async function VisitsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visits")
    .select("id, visit_date, disease, fee, patient:patients(id,name,phone)")
    .is("deleted_at", null)
    .order("visit_date", { ascending: false })
    .limit(50);
  const visits = (data as unknown as VisitRow[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Visits"
        subtitle="Recent visits across your clinic"
        action={
          <Link href="/visits/new">
            <Button>
              <CalendarPlus /> New Visit
            </Button>
          </Link>
        }
      />

      {visits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No visits yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <Link key={v.id} href={v.patient ? `/patients/${v.patient.id}` : "#"}>
              <Card className="transition-colors hover:border-primary hover:bg-accent">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{v.patient?.name ?? "Unknown"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {v.disease || "Visit"}
                      </p>
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
