import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="site-container flex h-20 items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          Miha<span className="text-coral">.</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-5 text-sm text-muted sm:gap-8"
        >
          <Link className="transition-colors hover:text-ink" href="/about">
            About
          </Link>
          <Link className="transition-colors hover:text-ink" href="/work">
            Work
          </Link>
          <Link
            className="rounded-full bg-ink px-4 py-2 font-medium text-paper transition-transform hover:-translate-y-0.5"
            href="/toolbox"
          >
            ToolBox
          </Link>
        </nav>
      </div>
    </header>
  );
}
