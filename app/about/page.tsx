import type { Metadata } from "next";
export const metadata: Metadata = { title: "About" };
export default function AboutPage() {
  return (
    <section className="site-container max-w-3xl py-20 sm:py-28">
      <p className="font-mono text-xs uppercase tracking-[.2em] text-coral">How I think</p>
      <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-.05em]">
        About me<span className="text-coral">.</span>
      </h1>
      <div className="mt-10 space-y-6 text-lg leading-8 text-muted">
        <p>
          I&apos;m Miha, a builder with a soft spot for the space where product thinking, data, and
          interface design meet.
        </p>
        <p>
          I like taking complicated systems and finding the shape that makes them easier to
          understand — whether that means a dashboard, a workflow, a visual identity, or a small
          tool that solves one annoying problem.
        </p>
        <p>
          This site is a home for that work, the questions I&apos;m exploring, and the experiments
          that help me learn by making.
        </p>
      </div>
    </section>
  );
}
