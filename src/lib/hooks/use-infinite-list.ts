"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a growing list in batches. Only `visible` items are rendered; when the
 * sentinel element scrolls into view, the next batch is appended. Keeps the UI
 * fast even when the local database holds thousands of records.
 *
 * Attach `sentinelRef` to an element placed at the end of the list.
 * Pass `resetKey` (e.g. the search query) to jump back to the first batch.
 */
export function useInfiniteList<T>(
  items: T[],
  { pageSize = 24, resetKey = "" }: { pageSize?: number; resetKey?: string } = {}
) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // New search / filter -> start from the first batch again.
  useEffect(() => {
    setCount(pageSize);
  }, [resetKey, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => (c < items.length ? c + pageSize : c));
        }
      },
      { rootMargin: "300px" } // start loading slightly before it's visible
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, pageSize]);

  const shown = Math.min(count, items.length);
  return {
    visible: items.slice(0, count),
    sentinelRef,
    hasMore: shown < items.length,
    shown,
    total: items.length,
  };
}
