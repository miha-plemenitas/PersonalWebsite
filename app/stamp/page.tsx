import type { Metadata, Viewport } from "next";
import { StampApp } from "@/components/stamp-app";

export const metadata: Metadata = {
  title: "Stamp | Time tracker",
  description: "A simple way to keep track of your workday.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Stamp", statusBarStyle: "default" },
  manifest: "/stamp/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/stamp/favicon.svg", type: "image/svg+xml" },
      { url: "/stamp/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/stamp/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/stamp/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f4f0",
  viewportFit: "cover",
};

export default function StampPage() {
  return <StampApp />;
}
