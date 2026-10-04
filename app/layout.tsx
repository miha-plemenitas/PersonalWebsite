import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RouteEffects } from "@/components/route-effects";
import { ScrollProgress } from "@/components/scroll-progress";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mihaplemenitas.com"),
  title: { default: "Miha Plemenitas.", template: "%s — Miha Plemenitas." },
  description: "Personal website and a collection of small, useful tools.",
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
