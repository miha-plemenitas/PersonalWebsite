import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import type { TinyTool } from "@/lib/tools";

export function ToolCard({ tool }: { tool: TinyTool }) {
  const Icon = tool.icon;
  const available = tool.status === "available";

  return (
    <div className="group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-1 hover:border-coral/40 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-sand text-coral">
          <Icon size={23} strokeWidth={1.8} />
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-muted">
          {tool.category}
        </span>
      </div>
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">{tool.name}</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{tool.description}</p>
        {available ? (
          <Link
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-coral"
            href={`/toolbox/${tool.slug}` as Route}
          >
            Try it{" "}
            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        ) : (
          <span className="mt-5 inline-block text-sm font-medium text-muted">Coming soon</span>
        )}
      </div>
    </div>
  );
}
