import { Building2, CheckCircle2, XCircle, Users, CalendarPlus, BookImage } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";

export default async function AdminDashboardPage() {
  const { admin } = await requireAdmin();

  const [clinics, activeClinics, patients, visits, nuskhas] = await Promise.all([
    admin.from("clinics").select("id", { count: "exact", head: true }),
    admin.from("clinics").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("visits").select("id", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("nuskhas").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  const total = clinics.count ?? 0;
  const active = activeClinics.count ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Platform Dashboard" subtitle="Across all clinics" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Clinics" value={total} icon={<Building2 />} />
        <StatCard label="Active Clinics" value={active} icon={<CheckCircle2 />} />
        <StatCard label="Inactive Clinics" value={total - active} icon={<XCircle />} />
        <StatCard label="Total Patients" value={patients.count ?? 0} icon={<Users />} />
        <StatCard label="Total Visits" value={visits.count ?? 0} icon={<CalendarPlus />} />
        <StatCard label="Total Nuskhas" value={nuskhas.count ?? 0} icon={<BookImage />} />
      </div>
    </div>
  );
}
