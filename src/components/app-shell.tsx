"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function initials(name: string | null) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  navItems,
  user,
  brand = "HakeemCare",
  logoUrl,
  children,
}: {
  navItems: NavItem[];
  user: { name: string | null; role: string };
  brand?: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" || href === "/admin"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={brand}
              className="h-9 w-9 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-sm">
              <Leaf className="h-5 w-5" />
            </span>
          )}
          <span className="max-w-[12rem] truncate text-lg font-bold tracking-tight text-foreground">
            {brand}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight">{user.name || "User"}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {user.role.replace("_", " ")}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
            {initials(user.name)}
          </span>
          <SignOutButton />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop only) — flush to the left edge */}
        <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
          <nav className="sticky top-16 flex flex-col gap-1.5 p-3">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors [&_svg]:size-5",
                      active
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-secondary text-primary group-hover:bg-white"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content — full width, extra bottom padding on mobile for the tab bar */}
        <main className="min-h-[calc(100vh-4rem)] w-full min-w-0 flex-1 p-4 pb-24 sm:p-6 md:pb-8 lg:p-8">
          {children}
        </main>
      </div>

      {/* Bottom tab bar (mobile only) — native-app style */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors [&_svg]:size-6",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-secondary"
                  )}
                >
                  {item.icon}
                </span>
                <span className="leading-none">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
