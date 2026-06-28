"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Save, ArrowLeft, Search, Check, User, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Patient, Nuskha } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/image-upload";
import { createVisit } from "./actions";

export function VisitForm({
  clinicId,
  nuskhas,
  preselected,
}: {
  clinicId: string;
  nuskhas: Nuskha[];
  preselected?: Patient | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [patient, setPatient] = useState<Patient | null>(preselected ?? null);
  const [selectedNuskhas, setSelectedNuskhas] = useState<Set<string>>(new Set());

  function toggleNuskha(id: string) {
    setSelectedNuskhas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patient) {
      toast.error("Please choose a patient first");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("patient_id", patient.id);
    selectedNuskhas.forEach((id) => formData.append("nuskha_ids", id));

    startTransition(async () => {
      try {
        await createVisit(formData);
        toast.success("Visit saved");
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error(err instanceof Error ? err.message : "Could not save visit");
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Patient picker */}
      <Card>
        <CardContent className="pt-6">
          <Field label="Patient" required>
            {patient ? (
              <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-accent p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  </div>
                </div>
                {!preselected && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPatient(null)}>
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <PatientPicker onPick={setPatient} />
            )}
          </Field>
        </CardContent>
      </Card>

      {/* Visit details */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Visit Date" htmlFor="visit_date">
              <Input id="visit_date" name="visit_date" type="date" defaultValue={today} />
            </Field>
            <Field label="Fee" htmlFor="fee">
              <Input id="fee" name="fee" type="number" min={0} step="1" placeholder="0" />
            </Field>
          </div>
          <Field label="Disease" htmlFor="disease">
            <Input id="disease" name="disease" placeholder="e.g. Joint pain" />
          </Field>
          <Field label="Symptoms" htmlFor="symptoms">
            <Textarea id="symptoms" name="symptoms" />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" />
          </Field>
        </CardContent>
      </Card>

      {/* Assign nuskha */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Assign Nuskha</h2>
            <p className="text-sm text-muted-foreground">
              Choose existing nuskhas and/or upload a new one for this visit.
            </p>
          </div>

          {nuskhas.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {nuskhas.map((n) => {
                const active = selectedNuskhas.has(n.id);
                return (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => toggleNuskha(n.id)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg border-2 p-2 text-left transition-colors",
                      active ? "border-primary bg-accent" : "border-input hover:border-primary"
                    )}
                  >
                    {n.image_url ? (
                      <Image
                        src={n.image_url}
                        alt={n.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                        <FileText className="h-5 w-5 text-primary" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.name}</span>
                    {active && <Check className="h-5 w-5 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          <Field label="Or upload a new nuskha image">
            <ImageUpload name="new_nuskha_image" bucket="nuskha-images" clinicId={clinicId} />
          </Field>

          {selectedNuskhas.size > 0 && (
            <Badge variant="success">{selectedNuskhas.size} nuskha(s) selected</Badge>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          <Save /> {pending ? "Saving…" : "Save Visit"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          <ArrowLeft /> Cancel
        </Button>
      </div>
    </form>
  );
}

function PatientPicker({ onPick }: { onPick: (p: Patient) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      const supabase = createClient();
      let request = supabase
        .from("patients")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(8);
      const q = query.trim();
      if (q) request = request.or(`name.ilike.%${q}%,phone.ilike.%${q}%,patient_code.ilike.%${q}%`);
      const { data } = await request;
      setResults((data as Patient[]) ?? []);
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-12"
          placeholder="Search patient by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {results.length > 0 && (
        <div className="divide-y rounded-lg border">
          {results.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => onPick(p)}
              className="flex w-full items-center justify-between p-3 text-left hover:bg-accent"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-sm text-muted-foreground">{p.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
