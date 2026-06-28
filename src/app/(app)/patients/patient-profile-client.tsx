"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  CalendarPlus,
  Pencil,
  User,
  MapPin,
  StickyNote,
  FileText,
  Loader2,
} from "lucide-react";
import type { Patient, Visit, Nuskha } from "@/lib/types";
import { useDB, useSession, useRxData } from "@/lib/offline/provider";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/confirm-delete";

export function PatientProfileClient({ id }: { id: string }) {
  const router = useRouter();
  const db = useDB();
  const session = useSession();

  const { data: patients, loading } = useRxData<Patient>("patients", (c) => c.find({ selector: { id } }), [id]);
  const { data: allVisits } = useRxData<Visit>("visits", (c) => c.find());
  const { data: links } = useRxData<{ visit_id: string; nuskha_id: string }>("visit_nuskhas", (c) => c.find());
  const { data: nuskhas } = useRxData<Nuskha>("nuskhas", (c) => c.find());

  const patient = patients[0];
  const visits = allVisits
    .filter((v) => v.patient_id === id)
    .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }
  if (!patient) {
    return <p className="py-16 text-center text-muted-foreground">Patient not found.</p>;
  }

  const nuskhaById = new Map(nuskhas.map((n) => [n.id, n]));

  async function deletePatient() {
    const doc = await db?.patients.findOne(patient.id).exec();
    await doc?.remove();
    toast.success("Patient deleted");
    router.push("/patients");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient.name}
        subtitle={patient.patient_code || "code pending sync"}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/visits/new?patient=${patient.id}`}>
              <Button>
                <CalendarPlus /> New Visit
              </Button>
            </Link>
            <Link href={`/patients/${patient.id}/edit`}>
              <Button variant="outline">
                <Pencil /> Edit
              </Button>
            </Link>
            {session.role !== "assistant" && (
              <ConfirmDelete action={deletePatient} message={`Delete ${patient.name}?`} />
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Info icon={<Phone />} label="Phone" value={patient.phone} />
          <Info icon={<User />} label="Age / Gender" value={[patient.age, patient.gender].filter(Boolean).join(" • ") || "—"} />
          <Info icon={<MapPin />} label="Address" value={patient.address || "—"} />
          {patient.notes && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Info icon={<StickyNote />} label="Notes" value={patient.notes} />
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4">Previous Visits ({visits.length})</h2>
        {visits.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No visits yet.{" "}
              <Link href={`/visits/new?patient=${patient.id}`} className="font-medium text-primary hover:underline">
                Create the first visit
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visits.map((v) => {
              const vn = links
                .filter((l) => l.visit_id === v.id)
                .map((l) => nuskhaById.get(l.nuskha_id))
                .filter(Boolean) as Nuskha[];
              return (
                <Card key={v.id}>
                  <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {v.disease || "Visit"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="muted">{formatDate(v.visit_date)}</Badge>
                      {v.fee ? <Badge variant="success">{formatCurrency(v.fee)}</Badge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {v.symptoms && <p><span className="font-medium">Symptoms:</span> {v.symptoms}</p>}
                    {v.notes && <p className="text-muted-foreground">{v.notes}</p>}
                    {vn.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {vn.map((n) => (
                          <Link key={n.id} href={`/nuskhas/${n.id}`} className="flex items-center gap-2 rounded-lg border p-2 hover:border-primary">
                            {n.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={n.image_url} alt={n.name} className="h-12 w-12 rounded-md object-cover" />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
                                <FileText className="h-5 w-5 text-primary" />
                              </span>
                            )}
                            <span className="text-sm font-medium">{n.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
