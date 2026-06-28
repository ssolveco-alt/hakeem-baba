import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PatientSearch } from "./patient-search";

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Find a patient instantly"
        action={
          <Link href="/patients/new">
            <Button>
              <UserPlus /> New Patient
            </Button>
          </Link>
        }
      />
      <PatientSearch initial={(data as Patient[]) ?? []} />
    </div>
  );
}
