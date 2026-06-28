"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { useDB } from "@/lib/offline/provider";
import { queueImage, flushPendingUploads } from "@/lib/offline/images";
import { cn } from "@/lib/utils";

// Captures an image into the local offline queue and reports the final public
// URL via onUploaded. The bytes upload to Supabase Storage automatically when
// online. Works fully offline (preview comes from the locally-stored copy).
export function ImageUpload({
  name,
  bucket,
  clinicId,
  defaultUrl,
  onUploaded,
}: {
  name?: string;
  bucket: string;
  clinicId: string;
  defaultUrl?: string | null;
  onUploaded?: (url: string | null) => void;
}) {
  const db = useDB();
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (!db) {
      toast.error("Still loading — try again");
      return;
    }
    setBusy(true);
    try {
      const { url: publicUrl, dataUrl } = await queueImage(db, bucket, clinicId, file);
      setUrl(publicUrl);
      setPreview(dataUrl);
      onUploaded?.(publicUrl);
      flushPendingUploads(db).catch(() => {}); // upload now if online
      toast.success(navigator.onLine ? "Image added" : "Image saved offline");
    } catch {
      toast.error("Could not process image");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setUrl(null);
    setPreview(null);
    onUploaded?.(null);
  }

  return (
    <div>
      {name && <input type="hidden" name={name} value={url ?? ""} />}

      {preview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="h-48 w-48 rounded-lg border object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handle(file);
          }}
          className={cn(
            "flex h-48 w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:bg-accent",
            dragOver && "border-primary bg-accent"
          )}
        >
          {busy ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Processing…</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8" />
              <span className="font-medium">Tap to add or drag an image</span>
              <span className="text-sm">Works offline</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handle(file);
        }}
      />
    </div>
  );
}
