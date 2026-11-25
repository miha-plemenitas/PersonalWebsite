import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SharedSiteShell } from "@/components/site/shared-site-shell";
import "./globals.css";
import "../components/toolbox/toolbox-theme.css";
import "../components/stamp/stamp.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mihaplemenitas.com"),
  title: { default: "Miha Plemenitas.", template: "%s — Miha Plemenitas." },
  description: "Personal website and a collection of small, useful tools.",
  icons: {
    icon: [{ url: "/brand/miha-logo-light-small.png", type: "image/png", sizes: "120x80" }],
    apple: [{ url: "/brand/miha-logo-light-small.png", type: "image/png", sizes: "120x80" }],
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
        <SharedSiteShell footer={<SiteFooter />} toolboxFooter={<SiteFooter fixedTheme />}>
          {children}
        </SharedSiteShell>
      </body>
    </html>
  );
}
