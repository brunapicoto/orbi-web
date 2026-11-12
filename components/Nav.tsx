"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/site";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`gutter fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-ink/85 backdrop-blur-md" : "bg-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <nav aria-label="main" className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 md:h-20">
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
        <a
          href="#waitlist"
          className="mono ml-auto inline-flex min-h-11 items-center rounded-full bg-bone px-5 text-[13px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink sm:ml-0"
        >
          join the waitlist
        </a>
      </nav>
    </header>
  );
}
