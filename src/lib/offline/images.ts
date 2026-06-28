// Offline-capable image handling. Captures an image into the local RxDB
// `pending_uploads` collection (downscaled), assigns the final public URL up
// front, and uploads the bytes to Supabase Storage whenever online.
import type { RxDatabase } from "rxdb";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function publicUrlOf(bucket: string, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Downscale to a max dimension and re-encode as JPEG to keep local storage small.
async function scaleToDataUrl(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // flatten transparency (logos) onto white
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

// Stores the image locally and returns the public URL the record should use,
// plus the data URL for instant preview. Works fully offline.
export async function queueImage(
  db: RxDatabase,
  bucket: string,
  clinicId: string,
  file: File
): Promise<{ url: string; dataUrl: string }> {
  const dataUrl = await scaleToDataUrl(file);
  const path = `${clinicId}/${crypto.randomUUID()}.jpg`;
  const url = publicUrlOf(bucket, path);
  await db.pending_uploads.insert({
    id: crypto.randomUUID(),
    bucket,
    path,
    url,
    data: dataUrl,
    content_type: "image/jpeg",
    created_at: new Date().toISOString(),
  });
  return { url, dataUrl };
}

let running = false;

// Uploads every queued image to Supabase Storage; removes each on success.
// Safe to call repeatedly; no-ops while already running or offline.
export async function flushPendingUploads(db: RxDatabase): Promise<void> {
  if (running) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  running = true;
  const supabase = createClient();
  try {
    const pending = await db.pending_uploads.find().exec();
    for (const doc of pending) {
      try {
        const blob = await (await fetch(doc.data)).blob();
        const { error } = await supabase.storage
          .from(doc.bucket)
          .upload(doc.path, blob, { contentType: doc.content_type, upsert: true });
        if (!error || /already exists/i.test(error.message)) {
          await doc.remove();
        } else {
          break; // likely offline / transient — stop and retry later
        }
      } catch {
        break; // network error — retry later
      }
    }
  } finally {
    running = false;
  }
}
