"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import type { Nuskha } from "@/lib/types";
import { NUSKHA_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { ImageUpload } from "@/components/image-upload";

export function NuskhaForm({
  nuskha,
  clinicId,
  action,
}: {
  nuskha?: Nuskha;
  clinicId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Nuskha saved");
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Nuskha Image" hint="Photograph your handwritten Nuskha">
            <ImageUpload
              name="image_url"
              bucket="nuskha-images"
              clinicId={clinicId}
              defaultUrl={nuskha?.image_url}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" required>
              <Input id="name" name="name" defaultValue={nuskha?.name} autoFocus required />
            </Field>
            <Field label="Category" htmlFor="category">
              <Select id="category" name="category" defaultValue={nuskha?.category ?? "General"}>
                {NUSKHA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
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
            <Button type="submit" size="lg" disabled={pending}>
              <Save /> {pending ? "Saving…" : "Save"}
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
