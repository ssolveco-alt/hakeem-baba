import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Phone,
  CalendarPlus,
  Pencil,
  User,
  MapPin,
  StickyNote,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Patient } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deletePatient } from "../actions";

type VisitWithNuskhas = {
  id: string;
  visit_date: string;
  disease: string | null;
  symptoms: string | null;
  notes: string | null;
  fee: number | null;
  visit_nuskhas: { nuskha: { id: string; name: string; image_url: string | null } | null }[];
};

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: patientData } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (!patientData) notFound();
  const patient = patientData as Patient;

  const { data: visitData } = await supabase
    .from("visits")
    .select("id, visit_date, disease, symptoms, notes, fee, visit_nuskhas(nuskha:nuskhas(id,name,image_url))")
    .eq("patient_id", id)
    .is("deleted_at", null)
    .order("visit_date", { ascending: false });
  const visits = (visitData as unknown as VisitWithNuskhas[]) ?? [];

  const canDelete = user.role !== "assistant";

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient.name}
        subtitle={patient.patient_code ?? undefined}
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
            {canDelete && (
              <ConfirmDelete
                action={deletePatient.bind(null, patient.id)}
                message={`Delete ${patient.name} and hide their records?`}
              />
            )}
          </div>
        }
      />

      {/* Patient info */}
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

      {/* Visit history */}
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
              const nuskhas = v.visit_nuskhas.map((vn) => vn.nuskha).filter(Boolean) as {
                id: string;
                name: string;
                image_url: string | null;
              }[];
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

                    {nuskhas.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {nuskhas.map((n) => (
                          <Link
                            key={n.id}
                            href={`/nuskhas/${n.id}`}
                            className="group flex items-center gap-2 rounded-lg border p-2 hover:border-primary"
                          >
                            {n.image_url ? (
                              <Image
                                src={n.image_url}
                                alt={n.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
                                <FileText className="h-5 w-5 text-primary" />
                              </span>
                            )}
                            <span className="text-sm font-medium group-hover:text-primary">
                              {n.name}
                            </span>
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

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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
