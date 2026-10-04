import { Gamepad2, QrCode, Sparkles, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TinyTool = {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  status: "available" | "coming-soon";
};

export const toolboxTools: TinyTool[] = [
  {
    slug: "wend",
    name: "Daily Wend",
    description: "Trace connected letters, use every tile, and return for a new puzzle tomorrow.",
    category: "Play",
    icon: Gamepad2,
    status: "available",
  },
  {
    slug: "qr-code-generator",
    name: "QR code generator",
    description: "Turn a link or a short message into a downloadable QR code.",
    category: "Create",
    icon: QrCode,
    status: "available",
  },
  {
    slug: "color-palette",
    name: "Color palette",
    description: "A quick way to collect and share a handful of colors.",
    category: "Design",
    icon: Sparkles,
    status: "coming-soon",
  },
  {
    slug: "more-tools",
    name: "More tools",
    description: "Small, focused utilities for everyday creative work.",
    category: "Explore",
    icon: Wrench,
    status: "coming-soon",
  },
];
