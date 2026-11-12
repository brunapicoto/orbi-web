"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app", label: "plans", d: "M4 11l8-6.5 8 6.5V20h-5v-5.5H9V20H4z" },
  { href: "/app/mutuals", label: "mutuals", d: "M8.5 11a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6zM2.8 19.5c.9-3 3-4.6 5.7-4.6s4.8 1.6 5.7 4.6M16 11a2.8 2.8 0 1 0 0-5.6M17.6 14.9c1.8.4 3.1 1.9 3.6 4.6" },
  { href: "/app/you", label: "you", d: "M12 12a3.8 3.8 0 1 0 0-7.6A3.8 3.8 0 0 0 12 12zM4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" },
];

export function TabBar() {
  const path = usePathname();
  if (["/app/login", "/app/welcome"].some((p) => path.startsWith(p)) || path.startsWith("/app/invite")) return null;
  const isActive = (href: string) => (href === "/app" ? path === "/app" || path.startsWith("/app/plan") : path.startsWith(href));
  return (
    <nav
      aria-label="app"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex h-[68px] max-w-md items-center justify-around px-4">
        {TABS.slice(0, 1).map((t) => (
          <Tab key={t.href} {...t} active={isActive(t.href)} />
        ))}
        <li>
          <Link
            href="/app/new"
            aria-label="post a plan"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-bordeaux text-bone transition-colors hover:bg-lavender hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </li>
        {TABS.slice(1).map((t) => (
          <Tab key={t.href} {...t} active={isActive(t.href)} />
        ))}
      </ul>
    </nav>
  );
}

function Tab({ href, label, d, active }: { href: string; label: string; d: string; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`mono flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 text-[12px] ${active ? "text-lavender" : "text-muted-2 hover:text-bone"}`}
      >
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={d} />
        </svg>
        {label}
      </Link>
    </li>
  );
}
