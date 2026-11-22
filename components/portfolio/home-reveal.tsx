"use client";

import { useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import styles from "./home-reveal.module.css";

type HomeRevealProps = HTMLAttributes<HTMLDivElement> & {
  layout?: "resumeColumn" | "toolReveal";
};

export function HomeReveal({ className, layout, ...props }: HomeRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (
      !element ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    setArmed(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...props}
      ref={ref}
      className={`${styles.reveal} ${layout ? styles[layout] : ""} ${armed ? styles.armed : ""} ${revealed ? styles.revealed : ""} ${className ?? ""}`}
    />
  );
}
