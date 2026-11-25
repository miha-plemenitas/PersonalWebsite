"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RouteEffects } from "@/components/site/route-effects";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";

export function SharedSiteShell({
  children,
  footer,
  toolboxFooter,
}: {
  children: ReactNode;
  footer: ReactNode;
  toolboxFooter: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/") return children;

  const toolbox = pathname === "/toolbox" || pathname.startsWith("/toolbox/");

  return (
    <>
      <ScrollProgress />
      <PortfolioHeader />
      <RouteEffects />
      <main
        className={`shared-site-main min-h-[calc(100vh-13rem)]${toolbox ? " toolbox-site-main" : ""}`}
      >
        {children}
      </main>
      {toolbox ? toolboxFooter : footer}
    </>
  );
}
