"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import styles from "./portfolio-header.module.css";

const links = [
  ["Work", "selected-work"],
  ["Projects & Skills", "resume"],
  ["Toolbox", "toolbox"],
  ["Contact", "contact"],
];

function NavigationLinks({
  current,
  onNavigate,
}: {
  current: string;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return links.map(([label, id]) => (
    <NavigationMenuItem key={id}>
      <NavigationMenuLink
        href={`#${id}`}
        aria-current={current === id ? "location" : undefined}
        className={styles.link}
        onClick={onNavigate}
      >
        {label}
      </NavigationMenuLink>
    </NavigationMenuItem>
  ));
}

export function PortfolioHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const header = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState("");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const sections = links.flatMap(([, id]) => {
      const section = document.getElementById(id);
      return section ? [section] : [];
    });
    let frame = 0;

    function updateSection() {
      frame = 0;
      setCompact(window.scrollY > 48);
      // Use the reading area below the sticky header as the activation point.
      const readingLine = Math.max(
        (header.current?.offsetHeight ?? 0) + 16,
        Math.min(200, window.innerHeight * 0.25),
      );
      let visible = sections.findLast(
        (section) => section.getBoundingClientRect().top <= readingLine,
      );
      if (Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight) {
        visible = sections.at(-1);
      }
      setCurrent(visible?.id ?? "");
    }

    function scheduleSectionUpdate() {
      if (!frame) frame = requestAnimationFrame(updateSection);
    }

    scheduleSectionUpdate();
    window.addEventListener("scroll", scheduleSectionUpdate, { passive: true });
    window.addEventListener("resize", scheduleSectionUpdate);
    window.addEventListener("hashchange", scheduleSectionUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleSectionUpdate);
      window.removeEventListener("resize", scheduleSectionUpdate);
      window.removeEventListener("hashchange", scheduleSectionUpdate);
    };
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    function closeMenu() {
      if (menu.current) menu.current.open = false;
    }
    function dismissOnOutsidePointer(event: PointerEvent) {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      ) {
        closeMenu();
      }
    }
    desktop.addEventListener("change", closeMenu);
    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    window.addEventListener("hashchange", closeMenu);
    return () => {
      desktop.removeEventListener("change", closeMenu);
      document.removeEventListener("pointerdown", dismissOnOutsidePointer);
      window.removeEventListener("hashchange", closeMenu);
    };
  }, []);

  return (
    <header
      ref={header}
      className={styles.header}
      data-compact={compact || undefined}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget) &&
          menu.current
        ) {
          menu.current.open = false;
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          event.preventDefault();
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <div className={styles.inner}>
        <a href="#top" className={styles.brand}>
          <Image src="/portfolio/brand-mark.png" alt="" width={33} height={22} unoptimized />
          <span>Miha Plemenitaš</span>
        </a>
        <NavigationMenu className={styles.desktopNav} aria-label="Portfolio">
          <NavigationMenuList className={styles.navList}>
            <NavigationLinks current={current} />
          </NavigationMenuList>
        </NavigationMenu>
        <details className={styles.mobileMenu} ref={menu}>
          <Button asChild variant="outline" className={styles.menuToggle}>
            <summary>
              <span className={styles.openLabel}>Menu</span>
              <span className={styles.closeLabel}>Close</span>
              <Menu size={18} className={styles.openIcon} aria-hidden="true" />
              <X size={18} className={styles.closeIcon} aria-hidden="true" />
            </summary>
          </Button>
          <NavigationMenu className={styles.mobileNav} aria-label="Portfolio">
            <NavigationMenuList className={styles.navList}>
              <NavigationLinks
                current={current}
                onNavigate={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }
                  if (menu.current) menu.current.open = false;
                }}
              />
            </NavigationMenuList>
          </NavigationMenu>
        </details>
      </div>
    </header>
  );
}
