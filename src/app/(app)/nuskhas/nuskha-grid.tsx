"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Nuskha } from "@/lib/types";
import { NUSKHA_CATEGORIES } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function NuskhaGrid({ initial }: { initial: Nuskha[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<Nuskha[]>(initial);

  useEffect(() => {
    const handle = setTimeout(async () => {
      const supabase = createClient();
      let request = supabase
        .from("nuskhas")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(60);

      const q = query.trim();
      if (q) request = request.ilike("name", `%${q}%`);
      if (category) request = request.eq("category", category);

      const { data } = await request;
      setResults((data as Nuskha[]) ?? []);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-12"
            placeholder="Search nuskhas by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          className="sm:w-56"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {NUSKHA_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No nuskhas found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((n) => (
            <Link key={n.id} href={`/nuskhas/${n.id}`}>
              <Card className="overflow-hidden transition-colors hover:border-primary">
                <div className="aspect-square bg-secondary">
                  {n.image_url ? (
                    <Image
                      src={n.image_url}
                      alt={n.name}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover"
                    />
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
  );
}
