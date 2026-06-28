import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  BookImage,
  Settings,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/patients", label: "Patients", icon: <Users /> },
  { href: "/visits", label: "Visits", icon: <CalendarPlus /> },
  { href: "/nuskhas", label: "Nuskha Library", icon: <BookImage /> },
  { href: "/settings", label: "Settings", icon: <Settings /> },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Platform admins use /admin, not the clinic app.
  if (user.role === "platform_admin") redirect("/admin");
  if (!user.clinic_id) redirect("/login?error=no-clinic");

  // Block access if the clinic has been suspended (status comes from the
  // same cached query as the user — no extra round-trip).
  if (user.clinic_status === "suspended") redirect("/suspended");

  // Assistants don't get the Settings tab (cannot change settings).
  const items =
    user.role === "assistant"
      ? navItems.filter((i) => i.href !== "/settings")
      : navItems;

  return (
    <AppShell
      navItems={items}
      user={{ name: user.name, role: user.role }}
      brand={user.clinic_name || "HakeemCare"}
      logoUrl={user.clinic_logo}
    >
      {children}
    </AppShell>
  );
}
