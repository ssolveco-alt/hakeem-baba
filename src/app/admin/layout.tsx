import { redirect } from "next/navigation";
import { LayoutDashboard, Building2, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/admin/clinics", label: "Clinics", icon: <Building2 /> },
  { href: "/admin/clinics/new", label: "Create Clinic", icon: <Plus /> },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (user.role !== "platform_admin") redirect("/dashboard");

  return (
    <AppShell navItems={navItems} user={{ name: user.name, role: user.role }} brand="HakeemCare Admin">
      {children}
    </AppShell>
  );
}
