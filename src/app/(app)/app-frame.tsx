"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  BookImage,
  Settings,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OfflineProvider, type ClientSession } from "@/lib/offline/provider";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/patients", label: "Patients", icon: <Users /> },
  { href: "/visits", label: "Visits", icon: <CalendarPlus /> },
  { href: "/nuskhas", label: "Nuskha Library", icon: <BookImage /> },
  { href: "/settings", label: "Settings", icon: <Settings /> },
];

const key = (uid: string) => `hakeemcare.profile.${uid}`;

// Client-side authenticated shell. Reads the cached Supabase session (works
// offline) and a cached profile so the whole app is navigable without the
// server. Refreshes the profile from Supabase whenever online.
export function AppFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<ClientSession | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "redirect">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) {
        router.replace("/login");
        return;
      }

      // 1) Instant render from cache (critical for offline).
      const cached = localStorage.getItem(key(s.user.id));
      if (cached && active) {
        setSession(JSON.parse(cached));
        setStatus("ready");
      }

      // 2) Refresh from the server when online.
      if (navigator.onLine) {
        const { data: profile } = await supabase
          .from("users")
          .select("*, clinic:clinics(status, name, logo)")
          .eq("id", s.user.id)
          .single();

        if (!active) return;
        if (!profile) {
          if (!cached) router.replace("/login?error=no-profile");
          return;
        }
        const clinic = (profile as any).clinic;
        if (profile.role === "platform_admin") {
          setStatus("redirect");
          router.replace("/admin");
          return;
        }
        if (!profile.clinic_id) {
          router.replace("/login?error=no-clinic");
          return;
        }
        if (clinic?.status === "suspended") {
          setStatus("redirect");
          router.replace("/suspended");
          return;
        }
        const cs: ClientSession = {
          userId: profile.id,
          clinicId: profile.clinic_id,
          role: profile.role,
          name: profile.name,
          clinicName: clinic?.name ?? null,
          clinicLogo: clinic?.logo ?? null,
        };
        localStorage.setItem(key(s.user.id), JSON.stringify(cs));
        setSession(cs);
        setStatus("ready");
      } else if (!cached) {
        // Offline with no cached profile (never logged in online here).
        router.replace("/login");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (status !== "ready" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading…
      </div>
    );
  }

  const items = session.role === "assistant" ? NAV.filter((i) => i.href !== "/settings") : NAV;

  return (
    <OfflineProvider session={session}>
      <AppShell
        navItems={items}
        user={{ name: session.name, role: session.role }}
        brand={session.clinicName || "HakeemCare"}
        logoUrl={session.clinicLogo}
      >
        {children}
      </AppShell>
    </OfflineProvider>
  );
}
