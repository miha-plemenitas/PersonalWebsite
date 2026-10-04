import type { Metadata } from "next";
import { Check } from "lucide-react";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="section-heading" data-reveal>
          <div className="section-kicker">
            <span>01</span>
            <span className="section-kicker-line" />
            <span>About</span>
          </div>
          <h1 className="section-title">
            Good software
            <br />
            <span>should feel simple.</span>
          </h1>
        </div>
        <div className="editorial-grid">
          <div className="editorial-lead" data-reveal>
            <p>
              I care about flow—how a product looks, feels, and moves from one step to the next.
            </p>
          </div>
          <div className="editorial-body" data-reveal>
            <p>
              My work sits between software engineering, UI/UX, and design. I like clear structure,
              useful interfaces, and details that make a product easier to use.
            </p>
            <p>
              I&apos;m also interested in automation: removing repetitive work and helping people
              spend more time on decisions that matter.
            </p>
            <div className="principles">
              {["Clear flows", "Useful interfaces", "Thoughtful automation"].map((principle) => (
                <span key={principle}>
                  <Check size={14} /> {principle}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
