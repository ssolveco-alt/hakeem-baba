"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { NUSKHA_CATEGORIES } from "@/lib/types";
import { useDB, useSession } from "@/lib/offline/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { ImageUpload } from "@/components/image-upload";

// Compact Nuskha creator used inside the visit screen's modal. Saves to the
// Nuskha Library (RxDB) and returns the new id so the caller can pre-select it.
export function NuskhaQuickCreate({ onCreated }: { onCreated: (id: string) => void }) {
  const db = useDB();
  const session = useSession();
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!db) return toast.error("Still loading — try again");
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = (fd.get(k) ?? "").toString().trim();
      return v.length ? v : null;
    };
    const name = str("name");
    if (!name) return toast.error("Name is required");

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      await db.nuskhas.insert({
        id,
        clinic_id: session.clinicId,
        name,
        category: str("category") ?? "General",
        description: null,
        image_url: image,
        notes: str("notes"),
        status: "active",
        created_at: now,
        updated_at: now,
      });
      toast.success("Nuskha added to library");
      onCreated(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Image" hint="Photo of the handwritten nuskha (optional)">
        <ImageUpload bucket="nuskha-images" clinicId={session.clinicId} onUploaded={setImage} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="qc-name" required>
          <Input id="qc-name" name="name" autoFocus required />
        </Field>
        <Field label="Category" htmlFor="qc-category">
          <Select id="qc-category" name="category" defaultValue="General">
            {NUSKHA_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="qc-notes">
        <Textarea id="qc-notes" name="notes" />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : <Save />}
        {saving ? "Saving…" : "Save & Select"}
      </Button>
    </form>
  );
}
