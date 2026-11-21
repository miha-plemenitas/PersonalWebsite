"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RouteEffects } from "@/components/route-effects";
import { ScrollProgress } from "@/components/scroll-progress";
import { SiteHeader } from "@/components/site-header";

export function SharedSiteShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") return children;

  return (
    <>
      <ScrollProgress />
      <SiteHeader />
      <RouteEffects />
      <main className="shared-site-main min-h-[calc(100vh-13rem)]">{children}</main>
      {footer}
    </>
  );
}
