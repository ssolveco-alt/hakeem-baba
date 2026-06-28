"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { createClinic } from "../../actions";

export function ClinicForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createClinic(formData);
        toast.success("Clinic created");
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error(err instanceof Error ? err.message : "Could not create clinic");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Clinic Name" htmlFor="clinic_name" required>
            <Input id="clinic_name" name="clinic_name" autoFocus required />
          </Field>
          <Field label="Owner (Hakeem) Name" htmlFor="owner_name">
            <Input id="owner_name" name="owner_name" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Owner Email" htmlFor="email" required hint="Used to log in">
              <Input id="email" name="email" type="email" required />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" />
            </Field>
            <Field label="Password" htmlFor="password" required hint="Minimum 6 characters">
              <Input id="password" name="password" type="text" minLength={6} required />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Subscription Plan" htmlFor="subscription_plan">
              <Select id="subscription_plan" name="subscription_plan" defaultValue="free">
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </Select>
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue="active">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={pending}>
              <Save /> {pending ? "Creating…" : "Create Clinic"}
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
