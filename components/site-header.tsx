"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function updateScrolled() {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      const scrollDelta = currentScrollY - lastScrollY.current;

      if (menuOpen || currentScrollY < 40) {
        setHidden(false);
        lastScrollY.current = currentScrollY;
      } else if (scrollDelta > 8) {
        setHidden(true);
        lastScrollY.current = currentScrollY;
      } else if (scrollDelta < -8) {
        setHidden(false);
        lastScrollY.current = currentScrollY;
      }
    }

    lastScrollY.current = window.scrollY;
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""}`}>
      <div className="site-container flex h-20 items-center justify-between">
        <Link
          href="/"
          className="site-brand"
          onClick={() => setMenuOpen(false)}
        >
          <BrandLogo size="small" />
          <span>Miha Plemenitaš<span className="text-coral">.</span></span>
        </Link>
        <nav aria-label="Main navigation" className={`site-nav ${menuOpen ? "site-nav-open" : ""}`}>
          <Link className="nav-item" href="/about" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          <Link className="nav-item" href="/work" onClick={() => setMenuOpen(false)}>
            Work
          </Link>
          <Link className="nav-item" href="/#resume" onClick={() => setMenuOpen(false)}>
            Résumé
          </Link>
          <Link className="nav-item" href="/toolbox" onClick={() => setMenuOpen(false)}>
            ToolBox
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}
