"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import type { Patient } from "@/lib/types";
import { useDB, useSession } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export function PatientForm({ patient }: { patient?: Patient }) {
  const router = useRouter();
  const db = useDB();
  const session = useSession();
  const t = useT();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!db) {
      toast.error("Still loading — try again in a moment");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = (fd.get(k) ?? "").toString().trim();
      return v.length ? v : null;
    };
    const name = str("name");
    const phone = str("phone");
    if (!name || !phone) {
      toast.error("Name and phone are required");
      return;
    }
    const ageRaw = str("age");
    const values = {
      name,
      phone,
      age: ageRaw ? Number(ageRaw) : null,
      gender: str("gender"),
      address: str("address"),
      notes: str("notes"),
    };

    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (patient) {
        const doc = await db.patients.findOne(patient.id).exec();
        if (!doc) throw new Error("Patient not found locally");
        await doc.patch({ ...values, updated_at: now });
        toast.success(t("patients.saved"));
        router.push(`/patients/${patient.id}`);
      } else {
        const id = crypto.randomUUID();
        await db.patients.insert({
          id,
          clinic_id: session.clinicId,
          patient_code: null, // server assigns the code on sync
          ...values,
          created_at: now,
          updated_at: now,
        });
        toast.success(t("patients.saved"));
        router.push(`/patients/${id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save patient");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("patients.name")} htmlFor="name" required>
              <Input id="name" name="name" defaultValue={patient?.name} autoFocus required />
            </Field>
            <Field label={t("patients.phone")} htmlFor="phone" required>
              <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={patient?.phone} required />
            </Field>
            <Field label={t("patients.age")} htmlFor="age">
              <Input id="age" name="age" type="number" min={0} max={150} defaultValue={patient?.age ?? ""} />
            </Field>
            <Field label={t("patients.gender")} htmlFor="gender">
              <Select id="gender" name="gender" defaultValue={patient?.gender ?? ""}>
                <option value="">{t("patients.select")}</option>
                <option value="Male">{t("patients.male")}</option>
                <option value="Female">{t("patients.female")}</option>
                <option value="Other">{t("patients.other")}</option>
              </Select>
            </Field>
          </div>
          <Field label={t("patients.address")} htmlFor="address">
            <Input id="address" name="address" defaultValue={patient?.address ?? ""} />
          </Field>
          <Field label={t("patients.notes")} htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={patient?.notes ?? ""} />
          </Field>

          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              <Save /> {saving ? t("common.saving") : t("patients.save")}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
              <ArrowLeft /> {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
