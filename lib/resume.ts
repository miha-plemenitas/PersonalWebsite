export type Project = {
  name: string;
  period: string;
  role: string;
  description: string;
  highlights: string[];
  technologies: string[];
  href: string;
};

export const projects: Project[] = [
  {
    name: "Formula Student Telemetry",
    period: "2024 — Present",
    role: "Software Engineer",
    description:
      "A desktop system for collecting, processing, and visualizing live Formula Student vehicle data.",
    highlights: [
      "Real-time data acquisition and processing",
      "Live dashboards and structured storage",
      "Integration with racing hardware",
    ],
    technologies: ["C#", ".NET", "MSSQL", "Git"],
    href: "https://github.com/UniMariborGPE/2025TelemetryPCApp",
  },
  {
    name: "ClockWise",
    period: "May — Jul 2024",
    role: "Software Engineer",
    description:
      "A desktop productivity application for tracking focused work, tasks, and elapsed time.",
    highlights: ["Session timers", "Task tracking", "Local data persistence"],
    technologies: ["Java", "JavaFX", "TypeScript", "SQLite"],
    href: "https://github.com/miha-plemenitas/ClockWise",
  },
  {
    name: "LinguaLearn",
    period: "Jun — Jul 2023",
    role: "Software Engineer",
    description:
      "A collaborative language-learning product for vocabulary building and interactive practice.",
    highlights: ["Frontend components", "Backend features", "Team-based delivery"],
    technologies: ["React", "TypeScript", "Python", "Node.js", "MongoDB"],
    href: "https://github.com/tjasagumilar/LinguaLearn",
  },
];

export const skillGroups = [
  { label: "Languages", items: ["C#", "Python", "Java", "JavaScript", "TypeScript"] },
  { label: "Platforms", items: [".NET", "React", "Node.js", "JavaFX", "Linux"] },
  { label: "Data", items: ["MSSQL", "MySQL", "MongoDB", "Redis", "SQLite"] },
  { label: "Engineering", items: ["Git", "Docker", "CI/CD", "Playwright", "E2E testing"] },
];
