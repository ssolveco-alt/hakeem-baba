"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import type { Clinic } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useSession, useRxData, useOffline } from "@/lib/offline/provider";
import { useT } from "@/lib/i18n/provider";
import { LanguageToggle } from "@/components/language-toggle";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { ImageUpload } from "@/components/image-upload";

export function SettingsClient() {
  const router = useRouter();
  const session = useSession();
  const t = useT();
  const { online } = useOffline();
  const { data, loading } = useRxData<Clinic>("clinics", (c) => c.find({ selector: { id: session.clinicId } }), [session.clinicId]);
  const clinic = data[0];

  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (session.role !== "hakeem") {
    return <p className="py-16 text-center text-muted-foreground">{t("settings.ownerOnly")}</p>;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="me-2 h-5 w-5 animate-spin" /> {t("common.loading")}
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!online) {
      toast.error("Settings need internet to save");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = (fd.get(k) ?? "").toString().trim();
      return v.length ? v : null;
    };
    const name = str("name");
    if (!name) return toast.error("Clinic name is required");

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("clinics")
      .update({
        name,
        owner_name: str("owner_name"),
        phone: str("phone"),
        address: str("address"),
        logo: logo ?? clinic?.logo ?? null,
      })
      .eq("id", session.clinicId);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
    router.refresh(); // refresh header (clinic name + logo)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label={t("settings.language")}>
              <LanguageToggle />
            </Field>
            <Field label={t("settings.logo")}>
              <ImageUpload bucket="clinic-logos" clinicId={session.clinicId} defaultUrl={clinic?.logo} onUploaded={setLogo} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("settings.clinicName")} htmlFor="name" required>
                <Input id="name" name="name" defaultValue={clinic?.name} required />
              </Field>
              <Field label={t("settings.ownerName")} htmlFor="owner_name">
                <Input id="owner_name" name="owner_name" defaultValue={clinic?.owner_name ?? ""} />
              </Field>
              <Field label={t("settings.phone")} htmlFor="phone">
                <Input id="phone" name="phone" defaultValue={clinic?.phone ?? ""} />
              </Field>
            </div>
            <Field label={t("settings.address")} htmlFor="address">
              <Textarea id="address" name="address" defaultValue={clinic?.address ?? ""} />
            </Field>
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? t("common.saving") : t("settings.save")}
            </Button>
            {!online && (
              <p className="text-sm text-amber-700">{t("settings.offlineNote")}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
