"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { RxDatabase } from "rxdb";
import { getDatabase } from "./database";
import { startReplication } from "./replication";
import { flushPendingUploads } from "./images";

export interface ClientSession {
  userId: string;
  clinicId: string;
  role: string;
  name: string | null;
}

interface OfflineCtx {
  db: RxDatabase | null;
  ready: boolean;
  online: boolean;
  syncing: boolean;
  error: string | null;
  session: ClientSession | null;
}

const Ctx = createContext<OfflineCtx>({
  db: null,
  ready: false,
  online: true,
  syncing: false,
  error: null,
  session: null,
});

export function OfflineProvider({
  session,
  children,
}: {
  session: ClientSession;
  children: ReactNode;
}) {
  const [db, setDb] = useState<RxDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const subs: { unsubscribe: () => void }[] = [];

    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      // Push any images captured while offline.
      getDatabase().then(flushPendingUploads).catch(() => {});
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    (async () => {
      try {
        const database = await getDatabase();
        if (cancelled) return;
        setDb(database);
        setReady(true);

        const states = startReplication(database);
        flushPendingUploads(database).catch(() => {}); // upload anything left from last session
        for (const st of states) {
          subs.push(
            st.active$.subscribe((active: boolean) =>
              setActiveCount((n) => (active ? n + 1 : Math.max(0, n - 1)))
            )
          );
          subs.push(
            st.error$.subscribe((e: unknown) => {
              // Offline errors are expected; surface only the message.
              const msg = e instanceof Error ? e.message : String(e);
              setError(msg);
            })
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Offline DB failed");
      }
    })();

    return () => {
      cancelled = true;
      subs.forEach((s) => s.unsubscribe());
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <Ctx.Provider value={{ db, ready, online, syncing: activeCount > 0, error, session }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOffline() {
  return useContext(Ctx);
}

export function useSession() {
  const s = useContext(Ctx).session;
  if (!s) throw new Error("useSession used outside OfflineProvider");
  return s;
}

export function useDB() {
  return useContext(Ctx).db;
}

// Subscribe to a reactive RxDB query and get plain JSON docs back.
// `build` receives the collection and returns an RxQuery; pass deps to re-run.
export function useRxData<T = any>(
  collection: string,
  build: (col: any) => any,
  deps: unknown[] = []
): { data: T[]; loading: boolean } {
  const db = useDB();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const query = build(db[collection]);
    const sub = query.$.subscribe((docs: any[]) => {
      setData(docs.map((d) => d.toJSON()));
      setLoading(false);
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, collection, ...deps]);

  return { data, loading };
}
