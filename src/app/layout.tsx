import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ServiceWorker } from "@/components/service-worker";
import { LanguageProvider } from "@/lib/i18n/provider";
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
    <html lang="en" dir="ltr">
      <head>
        {/* Urdu (Nastaliq) webfont — applied only when Urdu is selected. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <Toaster richColors position="top-center" toastOptions={{ duration: 3000 }} />
          <ServiceWorker />
        </LanguageProvider>
      </body>
    </html>
  );
}
