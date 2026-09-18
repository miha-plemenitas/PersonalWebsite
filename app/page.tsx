import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BuildingBlocks } from "@/components/building-blocks";

export default function Home() {
  return (
    <div>
      <section className="site-container flex min-h-[calc(100vh-13rem)] items-center py-20 sm:py-28">
        <div className="grid w-full items-center gap-16 lg:grid-cols-[1fr_.85fr] lg:gap-24">
          <div className="max-w-xl">
            <p className="mb-7 font-mono text-xs uppercase tracking-[.2em] text-coral">
              Make useful things
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-7xl">
              “Life is short,
              <br />
              but the craft is long.”<span className="text-coral">.</span>
            </h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[.18em] text-coral">
              — Hippocrates
            </p>
            <p className="mt-8 max-w-md text-lg leading-8 text-muted">
              Hi, I&apos;m Miha. I like making tools that are fun to use, beautiful to look at, and
              easy to understand. Little things with a bit of personality.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/toolbox"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
              >
                Explore ToolBox <ArrowUpRight size={16} />
              </Link>
              <Link href="/work" className="text-sm font-semibold text-ink hover:text-coral">
                See the work
              </Link>
            </div>
          </div>
          <div className="-mx-5 sm:mx-0">
            <BuildingBlocks />
          </div>
        </div>
      </section>
    </div>
  );
}
