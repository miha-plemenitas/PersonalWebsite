import type { Metadata } from "next";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import { PixelMountains } from "@/components/portfolio/pixel-mountains";
import { Button } from "@/components/ui/button";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import styles from "@/components/portfolio/portfolio.module.css";
import { projects, skillGroups } from "@/lib/resume";
import { toolboxTools } from "@/lib/tools";

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
                I build software with thoughtful interfaces, reliable systems, and attention to the
                small details that make it easier to use.
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
            <div className={styles.sectionHead}>
              <h2 id="work-title">Selected work</h2>
              <p>Engineering projects across live telemetry, desktop software, and the web.</p>
            </div>
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
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="about"
          tabIndex={-1}
          className={`${styles.section} ${styles.about}`}
          aria-labelledby="about-title"
        >
          <div className={`${styles.wrap} ${styles.split}`}>
            <div>
              <h2 id="about-title" className={styles.label}>
                About me
              </h2>
              <p className={styles.statement}>
                Good software should feel simple<span>.</span>
              </p>
            </div>
            <div className={styles.aboutBody}>
              <p>
                I care about flow and how a product looks, feels, and moves from one step to the
                next.
              </p>
              <p>
                My work sits between software engineering, UI/UX, and design. I like clear
                structure, useful interfaces, and details that make a product easier to use.
              </p>
              <p>
                I’m also interested in automation that removes repetitive work and gives people more
                time for decisions that matter.
              </p>
            </div>
          </div>
        </section>

        <section
          id="resume"
          tabIndex={-1}
          className={`${styles.section} ${styles.resume}`}
          aria-labelledby="resume-title"
        >
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <h2 id="resume-title">Résumé</h2>
              <p>Experience, education, and technical skills.</p>
            </div>
            <div className={styles.split}>
              <div>
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
              </div>
              <div>
                <h3 className={styles.columnTitle}>Technical skills</h3>
                <dl className={styles.skills}>
                  {skillGroups.map((group) => (
                    <div key={group.label}>
                      <dt>{group.label}</dt>
                      <dd>{group.items.join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
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
            <div className={styles.sectionHead}>
              <h2 id="toolbox-title">Toolbox</h2>
              <p>Small utilities you can use right in your browser.</p>
            </div>
            <div className={styles.tools}>
              {tools.map(({ slug, name, description, icon: Icon }) => (
                <a
                  className={styles.tool}
                  key={slug}
                  href={slug === "stamp" ? "/stamp" : `/toolbox/${slug}`}
                >
                  <span className={styles.toolIcons}>
                    <Icon size={28} aria-hidden="true" />
                    <ArrowRight size={20} aria-hidden="true" />
                  </span>
                  <h3>{name}</h3>
                  <p>{description}</p>
                </a>
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
          <div className={`${styles.wrap} ${styles.contactInner}`}>
            <div>
              <h2 id="contact-title">Let’s talk.</h2>
            </div>
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
          </div>
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
