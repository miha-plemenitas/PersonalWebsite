import type { Metadata } from "next";
import { StampApp } from "@/components/stamp-app";

export const metadata: Metadata = {
  title: "Stamp | Time tracker",
  description: "A simple way to keep track of your workday.",
  robots: { index: false, follow: false },
};

export default function StampPage() {
  return <StampApp />;
}
