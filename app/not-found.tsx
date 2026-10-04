import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="site-container flex min-h-[calc(100vh-13rem)] flex-col items-start justify-center py-20">
      <p className="section-kicker">404 · Not found</p>
      <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-.05em]">
        This page isn&apos;t available<span className="text-coral">.</span>
      </h1>
      <Link className="primary-action mt-8" href="/">
        <ArrowLeft size={15} /> Back home
      </Link>
    </section>
  );
}
