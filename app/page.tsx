import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, MapPin } from "lucide-react";
import { BuildingBlocks } from "@/components/building-blocks";
import { projects, skillGroups } from "@/lib/resume";

function SectionHeading({
  number,
  label,
  title,
  muted,
}: {
  number: string;
  label: string;
  title: string;
  muted?: string;
}) {
  return (
    <div className="section-heading" data-reveal>
      <div className="section-kicker">
        <span>{number}</span>
        <span className="section-kicker-line" />
        <span>{label}</span>
      </div>
      <h2 className="section-title">
        {title}
        {muted && (
          <>
            <br />
            <span>{muted}</span>
          </>
        )}
      </h2>
    </div>
  );
}

function ProjectRow({ project, index }: { project: (typeof projects)[number]; index: number }) {
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      className="project-row"
      data-reveal
      aria-label={`View ${project.name} on GitHub`}
    >
      <span className="project-index">0{index + 1}</span>
      <div>
        <p className="project-meta">
          {project.role} · {project.period}
        </p>
        <h3>{project.name}</h3>
        <p className="project-description">{project.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.technologies.map((technology) => (
            <span className="tech-pill" key={technology}>
              {technology}
            </span>
          ))}
        </div>
      </div>
      <span className="project-arrow">
        <ArrowUpRight size={22} />
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="site-container grid items-center gap-14 lg:grid-cols-[1.12fr_.88fr] lg:gap-20">
          <div className="hero-copy">
            <div className="availability" data-reveal>
              <span className="availability-dot" />
              Software engineer · Murska Sobota, Slovenia
            </div>
            <h1 className="hero-title" data-reveal>
              “Life is short,
              <br />
              but the craft is long.”<span>.</span>
            </h1>
            <p className="hero-quote-credit" data-reveal>
              — Hippocrates
            </p>
            <p className="hero-intro" data-reveal>
              I&apos;m Miha. I design and build software with a focus on flow, clear UI/UX, and
              useful automation.
            </p>
            <div className="hero-actions" data-reveal>
              <a className="primary-action" href="#selected-work">
                Selected work <ArrowRight size={16} />
              </a>
              <a className="text-action" href="mailto:miha.plemenitas@gmail.com">
                <Mail size={15} /> Get in touch
              </a>
            </div>
          </div>
          <div className="hero-visual" data-reveal>
            <BuildingBlocks />
            <div className="hero-note hero-note-top">
              <span>Current focus</span>
              <strong>Telemetry systems</strong>
            </div>
            <div className="hero-note hero-note-bottom">
              <MapPin size={13} />
              <span>46.6625° N · 16.1664° E</span>
            </div>
          </div>
        </div>
      </section>
      <div className="marquee" aria-label="Technical disciplines">
        <div className="marquee-track">
          {[...Array(2)].flatMap((_, group) =>
            [
              "Software Engineering",
              "Real-Time Telemetry",
              "Data Acquisition",
              "Data Visualization",
              "Desktop Applications",
              "Web Development",
              "C# & .NET",
              "React & TypeScript",
              "Java & JavaFX",
              "Data Systems",
              "Relational Databases",
              "NoSQL",
              "UI/UX Design",
              "Quality Assurance",
              "Functional Testing",
              "Playwright E2E",
              "Test Automation",
              "Docker & CI/CD",
              "Code Reviews",
              "Risk Analysis",
            ].map((item) => (
              <span key={`${group}-${item}`}>
                {item} <i />
              </span>
            )),
          )}
        </div>
      </div>
      <section id="selected-work" className="page-section">
        <div className="site-container">
          <SectionHeading
            number="01"
            label="Selected work"
            title="Systems built for"
            muted="real use."
          />
          <div className="project-list">
            {projects.map((project, index) => (
              <ProjectRow key={project.name} project={project} index={index} />
            ))}
          </div>
          <div className="mt-10 flex justify-end" data-reveal>
            <Link className="text-action" href="/work">
              Full project details <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section id="resume" className="page-section section-tint">
        <div className="site-container">
          <SectionHeading
            number="02"
            label="Résumé"
            title="Education and"
            muted="technical range."
          />
          <div className="resume-grid">
            <div className="resume-timeline" data-reveal>
              <div className="timeline-item">
                <span className="timeline-dot" />
                <p className="timeline-date">2020 — 2024</p>
                <h3>Bachelor&apos;s degree in Informatics and Communication Technology</h3>
                <p>
                  University of Maribor · Faculty of Electrical Engineering and Computer Science
                </p>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot" />
                <p className="timeline-date">2023 — Present</p>
                <h3>Applied software projects</h3>
                <p>
                  Desktop applications, web products, data pipelines, test automation, and
                  hardware-connected telemetry.
                </p>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot" />
                <p className="timeline-date">Languages</p>
                <h3>Slovenian · English</h3>
                <p>Native Slovenian speaker with advanced C1 English proficiency.</p>
              </div>
            </div>
            <div className="skills-grid">
              {skillGroups.map((group, index) => (
                <div
                  className={`skill-group reveal-delay-${(index % 3) + 1}`}
                  data-reveal
                  key={group.label}
                >
                  <p>{group.label}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="page-section">
        <div className="site-container contact-panel" data-reveal>
          <div>
            <p className="section-kicker mb-5">03 · Contact</p>
            <h2>Have a practical problem worth solving?</h2>
          </div>
          <a className="contact-link" href="mailto:miha.plemenitas@gmail.com">
            <span>Start a conversation</span>
            <ArrowUpRight size={26} />
          </a>
        </div>
      </section>
    </>
  );
}
