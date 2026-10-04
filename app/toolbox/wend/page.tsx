import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DailyWend } from "@/components/daily-wend";

export const metadata: Metadata = { title: "Daily Wend", description: "A small daily word-path puzzle by Miha Plemenitaš." };

export default function WendPage() {
  return <section className="page-section wend-page"><div className="site-container"><Link href="/toolbox" className="text-action wend-back-link"><ArrowLeft size={15} /> Back to ToolBox</Link><DailyWend /></div></section>;
}
