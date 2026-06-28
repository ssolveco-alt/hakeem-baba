import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Pencil, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Nuskha } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteNuskha } from "../actions";

export default async function NuskhaDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("nuskhas")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (!data) notFound();
  const nuskha = data as Nuskha;

  return (
    <div className="space-y-6">
      <PageHeader
        title={nuskha.name}
        subtitle={nuskha.category ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/nuskhas/${nuskha.id}/edit`}>
              <Button variant="outline">
                <Pencil /> Edit
              </Button>
            </Link>
            {user.role !== "assistant" && (
              <ConfirmDelete
                action={deleteNuskha.bind(null, nuskha.id)}
                message={`Delete nuskha "${nuskha.name}"?`}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="aspect-square bg-secondary">
            {nuskha.image_url ? (
              <Image
                src={nuskha.image_url}
                alt={nuskha.name}
                width={800}
                height={800}
                className="h-full w-full object-contain"
              />
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
              <Badge variant={nuskha.status === "active" ? "success" : "muted"}>
                {nuskha.status}
              </Badge>
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
