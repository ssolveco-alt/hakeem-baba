import Link from "next/link";
import { Plus, Phone, Mail, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import type { Clinic } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClinicActions } from "./clinic-actions";

export default async function ClinicsPage() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("clinics")
    .select("*")
    .order("created_at", { ascending: false });
  const clinics = (data as Clinic[]) ?? [];

  // Patient counts per clinic (small N of clinics in MVP).
  const counts = await Promise.all(
    clinics.map((c) =>
      admin
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", c.id)
        .is("deleted_at", null)
        .then((r) => r.count ?? 0)
    )
  );

  return (
    <div>
      <PageHeader
        title="Clinics"
        subtitle={`${clinics.length} total`}
        action={
          <Link href="/admin/clinics/new">
            <Button>
              <Plus /> Create Clinic
            </Button>
          </Link>
        }
      />

      {clinics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No clinics yet.{" "}
            <Link href="/admin/clinics/new" className="font-medium text-primary hover:underline">
              Create the first one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clinics.map((c, i) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{c.name}</h3>
                    <Badge variant={c.status === "active" ? "success" : "warning"}>
                      {c.status}
                    </Badge>
                    <Badge variant="muted">{c.subscription_plan}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {c.owner_name || "—"} · Created {formatDate(c.created_at)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" /> {c.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {counts[i]} patients
                    </span>
                  </div>
                </div>
                <ClinicActions clinicId={c.id} clinicName={c.name} status={c.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
