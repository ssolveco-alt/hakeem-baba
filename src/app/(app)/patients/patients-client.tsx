"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Search, Phone, User, UserPlus, Loader2 } from "lucide-react";
import type { Patient } from "@/lib/types";
import { useRxData } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { useInfiniteList } from "@/lib/hooks/use-infinite-list";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PatientsClient() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  // Reactive local query — instant, works fully offline. Sort/filter in JS
  // (per-clinic data is small; avoids needing RxDB indexes).
  const { data, loading } = useRxData<Patient>("patients", (col) => col.find());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const sorted = [...data].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.patient_code?.toLowerCase().includes(q)
    );
  }, [data, query]);

  const { visible, sentinelRef, hasMore, shown, total } = useInfiniteList(results, {
    pageSize: 24,
    resetKey: query,
  });

  return (
    <div>
      <PageHeader
        title={t("patients.title")}
        subtitle={t("patients.subtitle")}
        action={
          <Link href="/patients/new">
            <Button>
              <UserPlus /> {t("patients.new")}
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            className="h-14 ps-12 text-lg"
            placeholder={t("patients.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="me-2 h-5 w-5 animate-spin" /> {t("common.loading")}
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("patients.none")}
            </CardContent>
          </Card>
        ) : (
          <>
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((p) => (
              <Link key={p.id} href={`/patients/${p.id}`}>
                <Card className="transition-colors hover:border-primary hover:bg-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <User className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-lg font-semibold">{p.name}</p>
                        <Badge variant="muted">{p.patient_code || "new"}</Badge>
                      </div>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-4 w-4" /> {p.phone}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="me-2 h-5 w-5 animate-spin" /> {t("list.loadingMore")}
            </div>
          )}
          <p className="pt-2 text-center text-sm text-muted-foreground">
            {t("list.showing")} {shown} / {total}
          </p>
          </>
        )}
      </div>
    </div>
  );
}
