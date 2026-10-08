import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RouteEffects } from "@/components/route-effects";
import { ScrollProgress } from "@/components/scroll-progress";
import logoIcon from "@/components/icons/Website logo — Small — 120 × 80@2x.png";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mihaplemenitas.com"),
  title: { default: "Miha Plemenitas.", template: "%s — Miha Plemenitas." },
  description: "Personal website and a collection of small, useful tools.",
  icons: {
    icon: [{ url: logoIcon.src, type: "image/png", sizes: "120x80" }],
    apple: [{ url: logoIcon.src, type: "image/png", sizes: "120x80" }],
  },
  openGraph: {
    type: "website",
    siteName: "Miha Plemenitas.",
    title: "Miha Plemenitas.",
    description: "Personal website and ToolBox.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ScrollProgress />
        <SiteHeader />
        <RouteEffects />
        <main className="min-h-[calc(100vh-13rem)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
