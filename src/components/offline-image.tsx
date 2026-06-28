"use client";

import { useRxData } from "@/lib/offline/provider";

// Renders an image by its public URL, but transparently falls back to the
// locally-stored copy if that image hasn't been uploaded to Supabase yet
// (so images captured offline still display everywhere).
export function OfflineImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const { data } = useRxData<{ url: string; data: string }>("pending_uploads", (c) => c.find());
  const pending = data.find((p) => p.url === src);
  const resolved = pending ? pending.data : src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolved} alt={alt} className={className} />;
}
