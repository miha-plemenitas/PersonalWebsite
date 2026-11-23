"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RouteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      window.setTimeout(
        () => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
    } else {
      window.scrollTo({ top: 0 });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    const elements = document.querySelectorAll("[data-reveal]");
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
