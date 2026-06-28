import Link from "next/link";
import {
  Users,
  CalendarCheck,
  CalendarPlus,
  BookImage,
  UserPlus,
  Camera,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Run count queries in parallel. RLS scopes them to this clinic automatically.
  const [patients, visits, todayVisits, nuskhas] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("visits").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("visits")
      .select("id", { count: "exact", head: true })
      .eq("visit_date", today)
      .is("deleted_at", null),
    supabase.from("nuskhas").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  const quickActions = [
    { href: "/patients/new", label: "New Patient", icon: <UserPlus className="h-7 w-7" /> },
    { href: "/visits/new", label: "New Visit", icon: <CalendarPlus className="h-7 w-7" /> },
    { href: "/nuskhas/new", label: "Add Nuskha", icon: <Camera className="h-7 w-7" /> },
    { href: "/patients", label: "Patients", icon: <Users className="h-7 w-7" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1>Assalam-o-Alaikum, {user.name || "Hakeem Sahib"}</h1>
        <p className="mt-1 text-muted-foreground">Here is your clinic at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Visits" value={todayVisits.count ?? 0} icon={<CalendarCheck />} />
        <StatCard label="Total Patients" value={patients.count ?? 0} icon={<Users />} />
        <StatCard label="Total Visits" value={visits.count ?? 0} icon={<CalendarPlus />} />
        <StatCard label="Total Nuskhas" value={nuskhas.count ?? 0} icon={<BookImage />} />
      </div>

      <div>
        <h2 className="mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="transition-colors hover:border-primary hover:bg-accent">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    {a.icon}
                  </span>
                  <span className="text-lg font-semibold">{a.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
