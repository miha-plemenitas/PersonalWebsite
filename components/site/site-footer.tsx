import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8 text-sm text-muted">
      <div className="site-container flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="footer-brand">
          <BrandLogo size="medium" />
          <span>© {new Date().getFullYear()} Miha Plemenitaš</span>
        </div>
        <div className="flex items-center gap-5">
          <a className="footer-link" href="mailto:miha.plemenitas@gmail.com">
            Email
          </a>
          <a
            className="footer-link"
            href="https://github.com/miha-plemenitas"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[.16em]">
            Murska Sobota, SI
          </span>
        </div>
      </div>
    </footer>
  );
}
