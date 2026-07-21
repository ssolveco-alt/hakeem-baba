"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, Plus, Loader2 } from "lucide-react";
import type { Nuskha } from "@/lib/types";
import { NUSKHA_CATEGORIES } from "@/lib/types";
import { useRxData } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OfflineImage } from "@/components/offline-image";

export function NuskhasClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const t = useT();
  const { data, loading } = useRxData<Nuskha>("nuskhas", (c) => c.find());

  const results = useMemo(() => {
    const sorted = [...data].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (n) =>
        (!q || n.name?.toLowerCase().includes(q)) &&
        (!category || n.category === category)
    );
  }, [data, query, category]);

  return (
    <div>
      <PageHeader
        title={t("nuskhas.title")}
        subtitle={t("nuskhas.subtitle")}
        action={
          <Link href="/nuskhas/new">
            <Button><Plus /> {t("nuskhas.add")}</Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-12" placeholder={t("nuskhas.searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select className="sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t("nuskhas.allCategories")}</option>
            {NUSKHA_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="me-2 h-5 w-5 animate-spin" /> {t("common.loading")}
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">{t("nuskhas.none")}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
            {results.map((n) => (
              <Link key={n.id} href={`/nuskhas/${n.id}`}>
                <Card className="overflow-hidden transition-colors hover:border-primary">
                  <div className="aspect-square bg-secondary">
                    {n.image_url ? (
                      <OfflineImage src={n.image_url} alt={n.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-primary">
                        <FileText className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-1 p-3">
                    <p className="truncate font-semibold">{n.name}</p>
                    {n.category && <Badge variant="muted">{n.category}</Badge>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
