import { NAV_LINKS } from "@/lib/site";

/** Floating nav card. */
export function Nav() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-3 md:px-6"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top, 0px))", paddingLeft: "max(12px, env(safe-area-inset-left, 0px))", paddingRight: "max(12px, env(safe-area-inset-right, 0px))" }}
    >
      <nav
        aria-label="main"
        className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 rounded-2xl bg-ink/85 px-5 shadow-[0_20px_60px_rgba(14,12,13,0.35)] ring-1 ring-line backdrop-blur-md md:h-[72px] md:px-7"
      >
        <a href="#top" className="display text-[26px] tracking-[-0.04em] text-lavender">
          orbi
        </a>
        <ul className="ml-auto hidden items-center gap-7 sm:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="mono link-draw text-bone">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="/app" className="mono link-draw ml-auto whitespace-nowrap text-[13px] text-lavender-soft sm:ml-0">
          sign in
        </a>
        <a
          href="#waitlist"
          className="mono inline-flex min-h-11 items-center rounded-full bg-bone px-5 text-[13px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink"
        >
          join the waitlist
        </a>
      </nav>
    </header>
  );
}
