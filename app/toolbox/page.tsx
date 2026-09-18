import type { Metadata } from "next";
import { ToolCard } from "@/components/tool-card";
import { toolboxTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "ToolBox",
  description: "Small, useful browser-based tools by Miha Plemenitas.",
};

export default function ToolBoxPage() {
  return (
    <section className="site-container py-20 sm:py-28">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[.2em] text-coral">Useful experiments</p>
        <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-.05em] sm:text-6xl">
          ToolBox<span className="text-coral">.</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          Small, focused utilities for building, designing, and making sense of information. Free to
          use, right in your browser.
        </p>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {toolboxTools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  );
}
