"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import type { Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export function PatientForm({
  patient,
  action,
}: {
  patient?: Patient;
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
        toast.success("Patient saved");
      } catch (err) {
        // redirect() throws NEXT_REDIRECT — let it bubble (success path).
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error(err instanceof Error ? err.message : "Could not save patient");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Patient Name" htmlFor="name" required>
              <Input id="name" name="name" defaultValue={patient?.name} autoFocus required />
            </Field>
            <Field label="Phone Number" htmlFor="phone" required>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={patient?.phone}
                required
              />
            </Field>
            <Field label="Age" htmlFor="age">
              <Input
                id="age"
                name="age"
                type="number"
                min={0}
                max={150}
                defaultValue={patient?.age ?? ""}
              />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <Select id="gender" name="gender" defaultValue={patient?.gender ?? ""}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
          </div>
          <Field label="Address" htmlFor="address">
            <Input id="address" name="address" defaultValue={patient?.address ?? ""} />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={patient?.notes ?? ""} />
          </Field>

          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={pending}>
              <Save /> {pending ? "Saving…" : "Save Patient"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
            >
              <ArrowLeft /> Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
