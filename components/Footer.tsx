import { NAV_LINKS, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="gutter border-t border-line bg-ink py-12">
      <div className="mono mx-auto flex w-full max-w-6xl flex-col gap-6 text-muted-2 md:flex-row md:items-center md:justify-between">
        <p className="text-bone">orbi · new york · 2026</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="link-draw">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {/* PLACEHOLDER: swap for a mailto link once the domain exists */}
          <span>{SITE.contactEmail}</span>
          {SITE.instagramUrl ? (
            <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-draw">
              instagram
            </a>
          ) : (
            <span>instagram (coming soon)</span>
          )}
        </div>
      </div>
    </footer>
  );
}
