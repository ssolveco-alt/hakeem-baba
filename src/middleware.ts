import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything EXCEPT static assets and public PWA files. The manifest,
    // service worker, and icons must be reachable without auth, otherwise the
    // middleware redirects them to /login and the PWA/manifest breaks.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
