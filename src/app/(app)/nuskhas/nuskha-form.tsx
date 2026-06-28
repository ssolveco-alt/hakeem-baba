"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import type { Nuskha } from "@/lib/types";
import { NUSKHA_CATEGORIES } from "@/lib/types";
import { useDB, useSession } from "@/lib/offline/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { ImageUpload } from "@/components/image-upload";

export function NuskhaForm({ nuskha }: { nuskha?: Nuskha }) {
  const router = useRouter();
  const db = useDB();
  const session = useSession();
  const [imageUrl, setImageUrl] = useState<string | null>(nuskha?.image_url ?? null);
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
    if (!name) {
      toast.error("Name is required");
      return;
    }
    const values = {
      name,
      category: str("category"),
      description: str("description"),
      image_url: imageUrl,
      notes: str("notes"),
      status: str("status") ?? "active",
    };

    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (nuskha) {
        const doc = await db.nuskhas.findOne(nuskha.id).exec();
        if (!doc) throw new Error("Nuskha not found locally");
        await doc.patch({ ...values, updated_at: now });
        toast.success("Nuskha saved");
        router.push(`/nuskhas/${nuskha.id}`);
      } else {
        const id = crypto.randomUUID();
        await db.nuskhas.insert({
          id,
          clinic_id: session.clinicId,
          ...values,
          created_at: now,
          updated_at: now,
        });
        toast.success("Nuskha saved");
        router.push(`/nuskhas/${id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Nuskha Image" hint="Photograph your handwritten nuskha (needs internet to upload)">
            <ImageUpload
              name="image_url"
              bucket="nuskha-images"
              clinicId={session.clinicId}
              defaultUrl={nuskha?.image_url}
              onUploaded={setImageUrl}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" required>
              <Input id="name" name="name" defaultValue={nuskha?.name} autoFocus required />
            </Field>
            <Field label="Category" htmlFor="category">
              <Select id="category" name="category" defaultValue={nuskha?.category ?? "General"}>
                {NUSKHA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Description" htmlFor="description">
            <Textarea id="description" name="description" defaultValue={nuskha?.description ?? ""} />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={nuskha?.notes ?? ""} />
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={nuskha?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>

          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              <Save /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
              <ArrowLeft /> Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
