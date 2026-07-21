"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft, Search, Check, User, FileText, Loader2, Plus } from "lucide-react";
import type { Patient, Nuskha, Visit } from "@/lib/types";
import { useDB, useSession, useRxData } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { OfflineImage } from "@/components/offline-image";
import { Modal } from "@/components/ui/modal";
import { NuskhaQuickCreate } from "./nuskha-quick-create";

export function VisitForm({
  preselectedId,
  visit,
  existingNuskhaIds,
}: {
  preselectedId?: string;
  visit?: Visit;
  existingNuskhaIds?: string[];
}) {
  const router = useRouter();
  const db = useDB();
  const session = useSession();
  const t = useT();
  const isEdit = !!visit;
  const lockedPatient = !!preselectedId || isEdit;

  const { data: patients } = useRxData<Patient>("patients", (c) => c.find());
  const { data: nuskhas } = useRxData<Nuskha>("nuskhas", (c) => c.find());

  const [patientId, setPatientId] = useState<string | null>(visit?.patient_id ?? preselectedId ?? null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(existingNuskhaIds ?? []));
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [nuskhaQuery, setNuskhaQuery] = useState("");

  function onNuskhaCreated(id: string) {
    setSelected((prev) => new Set(prev).add(id)); // auto-select the new nuskha
    setShowCreate(false);
  }

  const patient = patients.find((p) => p.id === patientId) ?? null;
  const activeNuskhas = useMemo(() => nuskhas.filter((n) => n.status === "active"), [nuskhas]);
  const shownNuskhas = useMemo(() => {
    const q = nuskhaQuery.trim().toLowerCase();
    const list = q
      ? activeNuskhas.filter((n) => n.name?.toLowerCase().includes(q) || n.category?.toLowerCase().includes(q))
      : activeNuskhas;
    return list.slice(0, 60); // cap rendered items for large libraries
  }, [activeNuskhas, nuskhaQuery]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? patients.filter((p) => p.name?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q))
      : patients;
    return list.slice(0, 50); // list scrolls, so show plenty
  }, [patients, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!db) return toast.error("Still loading — try again");
    if (!patient) return toast.error(t("visits.choosePatient"));

    const fd = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = (fd.get(k) ?? "").toString().trim();
      return v.length ? v : null;
    };
    const feeRaw = str("fee");

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const fields = {
        visit_date: str("visit_date") ?? now.slice(0, 10),
        disease: str("disease"),
        symptoms: str("symptoms"),
        notes: str("notes"),
        fee: feeRaw ? Number(feeRaw) : 0,
      };

      const visitId = visit?.id ?? crypto.randomUUID();
      if (isEdit) {
        const doc = await db.visits.findOne(visitId).exec();
        if (!doc) throw new Error("Visit not found locally");
        await doc.patch({ ...fields, updated_at: now });
      } else {
        await db.visits.insert({
          id: visitId,
          clinic_id: session.clinicId,
          patient_id: patient.id,
          ...fields,
          created_by: session.userId,
          created_at: now,
          updated_at: now,
        });
      }

      // Reconcile assigned nuskhas (add new, remove deselected).
      const allLinks = await db.visit_nuskhas.find().exec();
      const current = allLinks.filter((l: any) => l.visit_id === visitId);
      const currentIds = new Set(current.map((l: any) => l.nuskha_id));
      for (const nid of selected) {
        if (!currentIds.has(nid)) {
          await db.visit_nuskhas.insert({
            id: crypto.randomUUID(),
            clinic_id: session.clinicId,
            visit_id: visitId,
            nuskha_id: nid,
            updated_at: now,
          });
        }
      }
      for (const l of current) {
        if (!selected.has(l.nuskha_id)) await l.remove();
      }

      toast.success(t("visits.saved"));
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save visit");
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Patient picker */}
      <Card>
        <CardContent className="pt-6">
          <Field label={t("visits.patient")} required>
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
                {!lockedPatient && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPatientId(null)}>
                    {t("visits.change")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input className="ps-12" placeholder={t("visits.searchPatient")} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
                </div>
                {matches.length > 0 ? (
                  // Scrolls once there are more than ~3 results.
                  <div className="max-h-52 divide-y overflow-y-auto rounded-lg border">
                    {matches.map((p) => (
                      <button type="button" key={p.id} onClick={() => setPatientId(p.id)} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-accent">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="shrink-0 text-sm text-muted-foreground">{p.phone}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-1 text-sm text-muted-foreground">{t("visits.noPatientMatch")}</p>
                )}
              </div>
            )}
          </Field>
        </CardContent>
      </Card>

      {/* Visit details */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("visits.date")} htmlFor="visit_date">
              <Input id="visit_date" name="visit_date" type="date" defaultValue={visit?.visit_date ?? today} />
            </Field>
            <Field label={t("visits.fee")} htmlFor="fee">
              <Input id="fee" name="fee" type="number" min={0} step="1" placeholder="0" defaultValue={visit?.fee ?? ""} />
            </Field>
          </div>
          <Field label={t("visits.disease")} htmlFor="disease">
            <Input id="disease" name="disease" placeholder={t("visits.diseasePlaceholder")} defaultValue={visit?.disease ?? ""} />
          </Field>
          <Field label={t("visits.symptoms")} htmlFor="symptoms">
            <Textarea id="symptoms" name="symptoms" defaultValue={visit?.symptoms ?? ""} />
          </Field>
          <Field label={t("visits.notes")} htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={visit?.notes ?? ""} />
          </Field>
        </CardContent>
      </Card>

      {/* Assign nuskha */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{t("visits.assignNuskha")}</h2>
              <p className="text-sm text-muted-foreground">{t("visits.assignHint")}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)}>
              <Plus /> {t("visits.newNuskha")}
            </Button>
          </div>

          {activeNuskhas.length > 6 && (
            <div className="relative">
              <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input className="ps-12" placeholder={t("visits.searchNuskhas")} value={nuskhaQuery} onChange={(e) => setNuskhaQuery(e.target.value)} />
            </div>
          )}

          {shownNuskhas.length > 0 ? (
            <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {shownNuskhas.map((n) => {
                const active = selected.has(n.id);
                return (
                  <button type="button" key={n.id} onClick={() => toggle(n.id)} className={cn("relative flex items-center gap-2 rounded-lg border-2 p-2 text-left transition-colors", active ? "border-primary bg-accent" : "border-input hover:border-primary")}>
                    {n.image_url ? (
                      <OfflineImage src={n.image_url} alt={n.name} className="h-10 w-10 rounded-md object-cover" />
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
          ) : (
            <p className="text-sm text-muted-foreground">
              {nuskhaQuery ? t("visits.noNuskhaMatch") : t("visits.noNuskhas")}
            </p>
          )}

          {selected.size > 0 && <Badge variant="success">{selected.size} {t("visits.selectedCount")}</Badge>}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? t("common.saving") : isEdit ? t("visits.update") : t("visits.save")}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          <ArrowLeft /> {t("common.cancel")}
        </Button>
      </div>
      </form>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t("visits.newNuskha")}>
        <NuskhaQuickCreate onCreated={onNuskhaCreated} />
      </Modal>
    </>
  );
}
