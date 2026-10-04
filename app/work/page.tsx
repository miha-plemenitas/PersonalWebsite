import type { Metadata } from "next";
import { GitFork } from "lucide-react";
import { projects } from "@/lib/resume";

export const metadata: Metadata = { title: "Work" };

export default function WorkPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="section-heading" data-reveal>
          <div className="section-kicker">
            <span>01</span>
            <span className="section-kicker-line" />
            <span>Work</span>
          </div>
          <h1 className="section-title">
            Selected
            <br />
            <span>engineering projects.</span>
          </h1>
        </div>
        <div className="space-y-6">
          {projects.map((project, index) => (
            <article className="case-card" data-reveal key={project.name}>
              <div className="case-card-top">
                <span className="project-index">0{index + 1}</span>
                <span className="project-meta">{project.period}</span>
              </div>
              <div className="case-card-grid">
                <div>
                  <p className="project-meta">{project.role}</p>
                  <h2>{project.name}</h2>
                  <p className="mt-5 max-w-xl leading-7 text-muted">{project.description}</p>
                </div>
                <div>
                  <p className="case-label">Contribution</p>
                  <ul className="case-list">
                    {project.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.technologies.map((technology) => (
                      <span className="tech-pill" key={technology}>
                        {technology}
                      </span>
                    ))}
                  </div>
                  <a
                    className="text-action mt-8"
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <GitFork size={15} /> View repository
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
