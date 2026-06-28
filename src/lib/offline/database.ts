// Creates the browser-side RxDB database (IndexedDB via Dexie). Singleton so
// HMR / re-renders don't try to create the same DB twice.
import { createRxDatabase, addRxPlugin, type RxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { COLLECTIONS } from "./schemas";

let dbPromise: Promise<RxDatabase> | null = null;

export function getDatabase(): Promise<RxDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const isDev = process.env.NODE_ENV !== "production";
    let storage = getRxStorageDexie();

    // Dev-mode plugin gives readable schema errors and requires a schema
    // validator wrapped around the storage; load both only in dev.
    if (isDev) {
      const { RxDBDevModePlugin } = await import("rxdb/plugins/dev-mode");
      addRxPlugin(RxDBDevModePlugin);
      const { wrappedValidateAjvStorage } = await import("rxdb/plugins/validate-ajv");
      storage = wrappedValidateAjvStorage({ storage }) as typeof storage;
    }

    const db = await createRxDatabase({
      name: "hakeemcare",
      storage,
      multiInstance: true,
      ignoreDuplicate: isDev,
    });

    await db.addCollections(
      Object.fromEntries(COLLECTIONS.map((c) => [c.name, { schema: c.schema }]))
    );

    return db;
  })();

  return dbPromise;
}
