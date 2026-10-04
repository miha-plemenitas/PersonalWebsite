import type { Metadata } from "next";
import { ToolCard } from "@/components/tool-card";
import { toolboxTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "ToolBox",
  description: "Small, useful browser-based tools by Miha Plemenitas.",
};

export default function ToolBoxPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="section-heading" data-reveal>
          <div className="section-kicker">
            <span>01</span>
            <span className="section-kicker-line" />
            <span>ToolBox</span>
          </div>
          <h1 className="section-title">
            Small tools,
            <br />
            <span>one clear job.</span>
          </h1>
        </div>
        <p className="page-intro" data-reveal>
          Browser-based utilities designed to be direct, private, and easy to use.
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {toolboxTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
