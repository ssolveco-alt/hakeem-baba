"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, FileText, Loader2 } from "lucide-react";
import type { Nuskha } from "@/lib/types";
import { useDB, useSession, useRxData } from "@/lib/offline/provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/confirm-delete";
import { OfflineImage } from "@/components/offline-image";

export function NuskhaDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const db = useDB();
  const session = useSession();
  const { data, loading } = useRxData<Nuskha>("nuskhas", (c) => c.find({ selector: { id } }), [id]);
  const nuskha = data[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }
  if (!nuskha) {
    return <p className="py-16 text-center text-muted-foreground">Nuskha not found.</p>;
  }

  async function remove() {
    const doc = await db?.nuskhas.findOne(nuskha.id).exec();
    await doc?.remove();
    toast.success("Nuskha deleted");
    router.push("/nuskhas");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={nuskha.name}
        subtitle={nuskha.category ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/nuskhas/${nuskha.id}/edit`}>
              <Button variant="outline"><Pencil /> Edit</Button>
            </Link>
            {session.role !== "assistant" && (
              <ConfirmDelete action={remove} message={`Delete nuskha "${nuskha.name}"?`} />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="aspect-square bg-secondary">
            {nuskha.image_url ? (
              <OfflineImage src={nuskha.image_url} alt={nuskha.name} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-primary">
                <FileText className="h-16 w-16" />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              {nuskha.category && <Badge>{nuskha.category}</Badge>}
              <Badge variant={nuskha.status === "active" ? "success" : "muted"}>{nuskha.status}</Badge>
            </div>
            {nuskha.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{nuskha.description}</p>
              </div>
            )}
            {nuskha.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{nuskha.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
