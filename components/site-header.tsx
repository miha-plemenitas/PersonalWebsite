"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-container flex h-20 items-center justify-between">
        <Link
          href="/"
          className="font-display text-base font-bold uppercase tracking-[.12em] text-ink"
          onClick={() => setMenuOpen(false)}
        >
          Miha Plemenitaš<span className="text-coral">.</span>
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
