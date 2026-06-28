import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "HakeemCare",
  description: "Simple digital record-keeping for Hakeems",
  manifest: "/manifest.webmanifest",
  applicationName: "HakeemCare",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HakeemCare",
  },
  icons: {
    icon: [
      { url: "/icons/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1f9d57",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-center" toastOptions={{ duration: 3000 }} />
        <ServiceWorker />
      </body>
    </html>
  );
}
