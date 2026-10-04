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
    <section className="page-section">
      <div className="site-container">
        <Link href="/toolbox" className="text-action">
          <ArrowLeft size={15} /> Back to ToolBox
        </Link>
        <div className="mt-12">
          <div className="section-heading" data-reveal>
            <div className="section-kicker">
              <span>01</span>
              <span className="section-kicker-line" />
              <span>Create</span>
            </div>
            <h1 className="section-title">
              QR code
              <br />
              <span>generator.</span>
            </h1>
          </div>
        </div>
        <p className="page-intro" data-reveal>
          Convert a URL or short message into a downloadable QR code. Processing stays in your
          browser.
        </p>
        <div className="mt-12" data-reveal>
          <QrGenerator />
        </div>
      </div>
    </section>
  );
}
