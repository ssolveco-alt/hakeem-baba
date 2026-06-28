/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

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
