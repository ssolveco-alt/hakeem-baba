import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Nuskha } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { NuskhaGrid } from "./nuskha-grid";

export default async function NuskhasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("nuskhas")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <div>
      <PageHeader
        title="Nuskha Library"
        subtitle="Your own handwritten nuskhas"
        action={
          <Link href="/nuskhas/new">
            <Button>
              <Plus /> Add Nuskha
            </Button>
          </Link>
        }
      />
      <NuskhaGrid initial={(data as Nuskha[]) ?? []} />
    </div>
  );
}
