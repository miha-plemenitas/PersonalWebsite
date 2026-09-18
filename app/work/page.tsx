import type { Metadata } from "next";
export const metadata: Metadata = { title: "Work" };
export default function WorkPage() {
  return (
    <section className="site-container py-20 sm:py-28">
      <p className="font-mono text-xs uppercase tracking-[.2em] text-coral">
        Product · Data · UI/UX
      </p>
      <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-.05em]">
        Work<span className="text-coral">.</span>
      </h1>
      <div className="mt-14 rounded-3xl border border-line bg-white p-8 sm:p-12">
        <p className="font-mono text-xs uppercase tracking-[.15em] text-muted">In progress</p>
        <h2 className="mt-4 font-display text-3xl font-semibold">Building the case studies.</h2>
        <p className="mt-4 max-w-xl leading-7 text-muted">
          This space will document work across product building, data analytics, and UI/UX design —
          what was built, what was learned, and why the details matter.
        </p>
        <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-muted">
          <span className="rounded-full bg-sand px-3 py-2">Product building</span>
          <span className="rounded-full bg-sand px-3 py-2">Data analytics</span>
          <span className="rounded-full bg-sand px-3 py-2">UI/UX design</span>
        </div>
      </div>
    </section>
  );
}
