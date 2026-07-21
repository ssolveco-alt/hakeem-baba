"use client";

import Link from "next/link";
import {
  Users,
  CalendarCheck,
  CalendarPlus,
  BookImage,
  UserPlus,
  Camera,
} from "lucide-react";
import type { Patient, Visit, Nuskha } from "@/lib/types";
import { useSession, useRxData } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardClient() {
  const session = useSession();
  const t = useT();
  const { data: patients } = useRxData<Patient>("patients", (c) => c.find());
  const { data: visits } = useRxData<Visit>("visits", (c) => c.find());
  const { data: nuskhas } = useRxData<Nuskha>("nuskhas", (c) => c.find());

  const today = new Date().toISOString().slice(0, 10);
  const todayVisits = visits.filter((v) => v.visit_date === today).length;

  const quickActions = [
    { href: "/patients/new", label: t("dash.newPatient"), icon: <UserPlus className="h-7 w-7" /> },
    { href: "/visits/new", label: t("dash.newVisit"), icon: <CalendarPlus className="h-7 w-7" /> },
    { href: "/nuskhas/new", label: t("dash.addNuskha"), icon: <Camera className="h-7 w-7" /> },
    { href: "/patients", label: t("dash.patients"), icon: <Users className="h-7 w-7" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1>{t("dash.greeting")}, {session.name || "Hakeem"}</h1>
        <p className="mt-1 text-muted-foreground">{t("dash.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("dash.todayVisits")} value={todayVisits} icon={<CalendarCheck />} />
        <StatCard label={t("dash.totalPatients")} value={patients.length} icon={<Users />} />
        <StatCard label={t("dash.totalVisits")} value={visits.length} icon={<CalendarPlus />} />
        <StatCard label={t("dash.totalNuskhas")} value={nuskhas.length} icon={<BookImage />} />
      </div>

      <div>
        <h2 className="mb-4">{t("dash.quickActions")}</h2>
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
