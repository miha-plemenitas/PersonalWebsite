import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QrGenerator } from "@/components/qr-generator";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Create and download a QR code from text or a URL.",
};

export default function QrCodeGeneratorPage() {
  return (
    <section className="site-container py-16 sm:py-24">
      <Link
        href="/toolbox"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to ToolBox
      </Link>
      <div className="mt-10 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[.2em] text-coral">TinyTool / Create</p>
        <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-.05em] sm:text-6xl">
          QR code generator<span className="text-coral">.</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          Turn any link or short message into a QR code you can download and share.
        </p>
      </div>
      <div className="mt-12">
        <QrGenerator />
      </div>
    </section>
  );
}
