"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { Clinic } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { ImageUpload } from "@/components/image-upload";
import { updateClinicSettings } from "./actions";

export function SettingsForm({ clinic }: { clinic: Clinic }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateClinicSettings(formData);
        toast.success("Settings saved");
        // Re-fetch server components so the header (clinic name + logo) updates now.
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Clinic Logo">
            <ImageUpload
              name="logo"
              bucket="clinic-logos"
              clinicId={clinic.id}
              defaultUrl={clinic.logo}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Clinic Name" htmlFor="name" required>
              <Input id="name" name="name" defaultValue={clinic.name} required />
            </Field>
            <Field label="Doctor / Owner Name" htmlFor="owner_name">
              <Input id="owner_name" name="owner_name" defaultValue={clinic.owner_name ?? ""} />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={clinic.phone ?? ""} />
            </Field>
          </div>
          <Field label="Address" htmlFor="address">
            <Textarea id="address" name="address" defaultValue={clinic.address ?? ""} />
          </Field>
          <Button type="submit" size="lg" disabled={pending}>
            <Save /> {pending ? "Saving…" : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
