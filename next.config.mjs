/** @type {import('next').NextConfig} */
// Never let a missing/malformed env var crash the build.
function resolveSupabaseHost() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^['"]|['"]$/g, "");
  if (!raw) return "*.supabase.co";
  try {
    return new URL(raw).hostname;
  } catch {
    return "*.supabase.co";
  }
}
const supabaseHost = resolveSupabaseHost();

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  experimental: {
    // Client-side router cache: keep already-visited pages in the browser so
    // navigating back to them is instant (no server/Supabase round-trip).
    // Writes (create/edit) call revalidatePath/router.refresh, so this never
    // shows stale data after you add or change something.
    staleTimes: {
      dynamic: 60, // re-use a visited dynamic page for 60s
      static: 300,
    },
  },
};

export default nextConfig;
