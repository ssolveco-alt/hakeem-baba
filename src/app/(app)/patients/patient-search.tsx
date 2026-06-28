"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Phone, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Instant, debounced patient search by name / phone / patient code.
export function PatientSearch({ initial }: { initial: Patient[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>(initial);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    const handle = setTimeout(async () => {
      const supabase = createClient();
      let request = supabase
        .from("patients")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (q) {
        // Match name OR phone OR patient_code.
        request = request.or(
          `name.ilike.%${q}%,phone.ilike.%${q}%,patient_code.ilike.%${q}%`
        );
      }

      setLoading(true);
      const { data } = await request;
      setLoading(false);
      setResults((data as Patient[]) ?? []);
    }, 250);

    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          className="h-14 pl-12 text-lg"
          placeholder="Search by name, phone, or code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Searching…</p>}

      {results.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No patients found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`}>
              <Card className="transition-colors hover:border-primary hover:bg-accent">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <User className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-lg font-semibold">{p.name}</p>
                      {p.patient_code && <Badge variant="muted">{p.patient_code}</Badge>}
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
      )}
    </div>
  );
}
