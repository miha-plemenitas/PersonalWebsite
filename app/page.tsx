import type { Metadata } from "next";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import { PixelMountains } from "@/components/portfolio/pixel-mountains";
import { Button } from "@/components/ui/button";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import styles from "@/components/portfolio/portfolio.module.css";
import { projects, skillGroups } from "@/lib/resume";
import { toolboxTools } from "@/lib/tools";
import { HomeReveal } from "@/components/portfolio/home-reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const name = "Miha Plemenitaš";
const email = "miha.plemenitas@gmail.com";
const github = "https://github.com/miha-plemenitas";
const tools = toolboxTools.filter(({ status }) => status === "available");
const projectPixels = [
  ["00001", "00101", "00111", "10111", "11111"],
  ["01110", "10101", "10111", "10001", "01110"],
  ["11100", "10010", "10101", "01001", "00111"],
];

export default function Home() {
  return (
    <div className={styles.portfolio}>
      <a className={styles.skip} href="#portfolio-main">
        Skip to content
      </a>
      <PortfolioHeader />
      <main id="portfolio-main" tabIndex={-1}>
        <section
          id="top"
          className={`${styles.target} ${styles.hero}`}
          aria-labelledby="hero-title"
        >
          <PixelMountains />
          <div className={`${styles.wrap} ${styles.heroInner}`}>
            <div className={styles.heroCopy} data-enter>
              <p className={`${styles.label} ${styles.heroLabel}`}>Software engineer</p>
              <h1 id="hero-title">{name}</h1>
              <p className={styles.heroIntro}>
                “What is not good for the swarm is not good for the bee.” — Marcus Aurelius
              </p>
              <div className={styles.actions}>
                <Button asChild className={styles.primary}>
                  <a href="#selected-work">
                    Explore my work <ArrowDown size={17} aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild variant="outline" className={styles.secondary}>
                  <a href="#contact">
                    Get in touch <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
            <div className={styles.heroFoot}>
              <span>Murska Sobota, SI</span>
              <a href="#selected-work" aria-label="Scroll to selected work">
                <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="selected-work"
          tabIndex={-1}
          className={`${styles.section} ${styles.work}`}
          aria-labelledby="work-title"
        >
          <div className={styles.wrap}>
            <HomeReveal className={styles.sectionHead}>
              <h2 id="work-title">Selected work</h2>
              <p>Engineering projects across live telemetry, desktop software, and the web.</p>
            </HomeReveal>
            <nav className={styles.projectIndex} aria-label="Jump to a project">
              {projects.map((project, index) => (
                <a key={project.name} href={`#project-${index + 1}`}>
                  {project.name} <ArrowDown size={14} aria-hidden="true" />
                </a>
              ))}
            </nav>
            <ol className={styles.projectList}>
              {projects.map((project, index) => (
                <li key={project.name} id={`project-${index + 1}`} className={styles.target}>
                  <HomeReveal>
                    <article className={styles.project}>
                      <div className={styles.projectHeading}>
                        <span className={styles.projectPixels} aria-hidden="true">
                          {Array.from(projectPixels[index]?.join("") ?? "", (pixel, pixelIndex) => (
                            <span key={pixelIndex} data-lit={pixel === "1" || undefined} />
                          ))}
                        </span>
                        <p className={styles.label}>
                          {project.role} · {project.period}
                        </p>
                        <h3>
                          <a
                            href={project.href}
                            className={styles.projectLink}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${project.name} on GitHub`}
                          >
                            {project.name} <ArrowUpRight size={23} aria-hidden="true" />
                          </a>
                        </h3>
                      </div>
                      <div className={styles.projectBody}>
                        <p>{project.description}</p>
                        <ul className={styles.contributions}>
                          {project.highlights.map((highlight) => (
                            <li key={highlight}>{highlight}</li>
                          ))}
                        </ul>
                        <ul className={styles.technologies} aria-label="Technologies">
                          {project.technologies.map((technology) => (
                            <li key={technology}>{technology}</li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  </HomeReveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="resume"
          tabIndex={-1}
          className={`${styles.section} ${styles.resume}`}
          aria-labelledby="projects-skills-title"
        >
          <div className={styles.wrap}>
            <HomeReveal className={styles.sectionHead}>
              <h2 id="projects-skills-title">Projects &amp; Skills</h2>
              <p>Experience, education, and the skills behind my projects.</p>
            </HomeReveal>
            <div className={styles.split}>
              <HomeReveal layout="resumeColumn">
                <h3 className={styles.columnTitle}>Experience &amp; education</h3>
                <ol className={styles.timeline}>
                  <li>
                    <p className={styles.label}>2023 — Present</p>
                    <h4>Applied software projects</h4>
                    <p>
                      Desktop applications, web products, data pipelines, test automation, and
                      hardware-connected telemetry.
                    </p>
                  </li>
                  <li>
                    <p className={styles.label}>2020 — 2024</p>
                    <h4>Bachelor’s degree in Informatics and Communication Technology</h4>
                    <p>
                      University of Maribor · Faculty of Electrical Engineering and Computer Science
                    </p>
                  </li>
                  <li>
                    <h4>Slovenian · English</h4>
                    <p>Native Slovenian speaker with advanced C1 English proficiency.</p>
                  </li>
                </ol>
              </HomeReveal>
              <HomeReveal layout="resumeColumn">
                <h3 className={styles.columnTitle}>Technical skills</h3>
                <dl className={styles.skills}>
                  {skillGroups.map((group) => (
                    <div key={group.label}>
                      <dt>{group.label}</dt>
                      <dd>{group.items.join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              </HomeReveal>
            </div>
          </div>
        </section>
        <section
          id="toolbox"
          tabIndex={-1}
          className={`${styles.section} ${styles.toolbox}`}
          aria-labelledby="toolbox-title"
        >
          <div className={styles.wrap}>
            <HomeReveal className={styles.sectionHead}>
              <h2 id="toolbox-title">Toolbox</h2>
              <p>Small utilities you can use right in your browser.</p>
            </HomeReveal>
            <div className={styles.tools}>
              {tools.map(({ slug, name, description, icon: Icon }) => (
                <HomeReveal layout="toolReveal" key={slug}>
                  <a
                    className={styles.tool}
                    href={slug === "stamp" ? "/stamp" : `/toolbox/${slug}`}
                  >
                    <span className={styles.toolIcons}>
                      <Icon size={28} aria-hidden="true" />
                      <ArrowRight size={20} aria-hidden="true" />
                    </span>
                    <h3>{name}</h3>
                    <p>{description}</p>
                  </a>
                </HomeReveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          tabIndex={-1}
          className={styles.contact}
          aria-labelledby="contact-title"
        >
          <HomeReveal className={`${styles.wrap} ${styles.contactInner}`}>
            <h2 id="contact-title">Let’s talk.</h2>
            <div className={styles.contactLinks}>
              <Button asChild variant="ghost" className={styles.contactLink}>
                <a href={`mailto:${email}`}>
                  {email} <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="ghost" className={styles.contactLink}>
                <a href={github}>
                  GitHub <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </Button>
            </div>
          </HomeReveal>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p>
            © {new Date().getFullYear()} {name}
          </p>
          <Button asChild variant="ghost">
            <a href="#top">
              Back to top <ArrowUp size={15} aria-hidden="true" />
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
