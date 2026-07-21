"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useOffline } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

// Small badge showing online/offline + sync activity. Reassures the Hakeem
// that offline changes are saved and will sync.
export function SyncIndicator() {
  const { online, syncing, ready } = useOffline();
  const t = useT();

  if (!ready) return null;

  let label: string;
  let icon: React.ReactNode;
  let tone: string;

  if (!online) {
    label = t("sync.offline");
    icon = <CloudOff className="h-4 w-4" />;
    tone = "bg-amber-100 text-amber-800";
  } else if (syncing) {
    label = t("sync.syncing");
    icon = <RefreshCw className="h-4 w-4 animate-spin" />;
    tone = "bg-secondary text-primary";
  } else {
    label = t("sync.online");
    icon = <Cloud className="h-4 w-4" />;
    tone = "bg-green-100 text-green-800";
  }

  return (
    <span
      className={cn("hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex", tone)}
      title={online ? "Connected to server" : "Working offline — changes will sync when back online"}
    >
      {icon}
      {label}
    </span>
  );
}
