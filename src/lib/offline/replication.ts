// Supabase <-> RxDB replication. One replication stream per collection.
// Pull: fetch rows changed since the last checkpoint (updated_at).
// Push: upsert locally-changed rows back to Supabase (single-writer model).
import { replicateRxCollection, type RxReplicationState } from "rxdb/plugins/replication";
import type { RxDatabase } from "rxdb";
import { createClient } from "@/lib/supabase/client";
import { COLLECTIONS, type CollectionConfig } from "./schemas";

type Checkpoint = { updated_at: string; id: string };
const EPOCH = "1970-01-01T00:00:00.000Z";

// Only these tables have a deleted_at timestamp column.
const HAS_DELETED_AT = new Set(["patients", "visits", "nuskhas"]);

function toRx(cfg: CollectionConfig, row: Record<string, any>) {
  const doc: Record<string, any> = {};
  for (const col of cfg.columns) doc[col] = row[col] ?? null;
  doc.updated_at = row.updated_at;
  doc._deleted = !!row.deleted;
  return doc;
}

function toSupabase(cfg: CollectionConfig, doc: Record<string, any>) {
  const rec: Record<string, any> = {};
  for (const col of cfg.columns) rec[col] = doc[col] ?? null;
  rec.deleted = !!doc._deleted;
  if (HAS_DELETED_AT.has(cfg.name)) {
    rec.deleted_at = doc._deleted ? new Date().toISOString() : null;
  }
  return rec;
}

export function startReplication(db: RxDatabase): RxReplicationState<any, Checkpoint>[] {
  const supabase = createClient();

  return COLLECTIONS.map((cfg) => {
    const collection = db[cfg.name];
    const selectCols = [...cfg.columns, "updated_at", "deleted"].join(",");

    return replicateRxCollection<any, Checkpoint>({
      collection,
      replicationIdentifier: `supabase-${cfg.name}`,
      live: true,
      retryTime: 5000,
      autoStart: true,
      pull: {
        batchSize: 100,
        async handler(checkpoint, batchSize) {
          const cp = checkpoint ?? { updated_at: EPOCH, id: "" };
          const { data, error } = await supabase
            .from(cfg.name)
            .select(selectCols)
            .gt("updated_at", cp.updated_at)
            .order("updated_at", { ascending: true })
            .order("id", { ascending: true })
            .limit(batchSize);
          if (error) throw new Error(error.message);

          const rows = (data as Record<string, any>[]) ?? [];
          const documents = rows.map((r) => toRx(cfg, r));
          const last = rows[rows.length - 1];
          return {
            documents,
            checkpoint: last ? { updated_at: last.updated_at, id: last.id } : cp,
          };
        },
      },
      push: cfg.push
        ? {
            batchSize: 50,
            async handler(changeRows) {
              const records = changeRows.map((r) => toSupabase(cfg, r.newDocumentState));
              const { error } = await supabase
                .from(cfg.name)
                .upsert(records, { onConflict: "id" });
              if (error) throw new Error(error.message);
              return []; // single writer per clinic — assume no conflicts
            },
          }
        : undefined,
    });
  });
}
