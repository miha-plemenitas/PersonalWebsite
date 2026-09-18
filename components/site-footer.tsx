export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8 text-sm text-muted">
      <div className="site-container flex flex-col justify-between gap-2 sm:flex-row">
        <span>© {new Date().getFullYear()} Miha Plemenitas</span>
        <span>Made with curiosity and a little code.</span>
      </div>
    </footer>
  );
}
