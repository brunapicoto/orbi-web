"use client";

import { useEffect, useState } from "react";

type Count = { going: number; min: number; max: number; status: string; joined: boolean };

/** "2 of 4 in", refreshed every few seconds while the page is open. */
export function LiveCount({ slug, initial }: { slug: string; initial: Count }) {
  const [c, setC] = useState(initial);
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/plans/${slug}/count`, { cache: "no-store" });
        if (res.ok && !stop) setC(await res.json());
      } catch {
        // keep the last number
      }
    };
    const id = setInterval(tick, 5000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stop = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [slug]);

  const confirmed = c.status === "on" || c.status === "live";
  const dots = Math.max(c.min, Math.min(c.going, c.max));
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-ink-2 p-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span className={`mono ${confirmed ? "text-ink bg-lavender" : "text-lavender border border-lavender/50"} rounded-full px-3 py-1 text-[12px]`}>
          {c.status === "live" ? "happening now" : confirmed ? "confirmed" : "waiting for enough people"}
        </span>
        <span className="mono text-muted-2">{c.max > c.min ? `up to ${c.max}` : `${c.max} max`}</span>
      </div>
      <p className="display text-[2.75rem] leading-none">
        {c.going} <span className="text-muted-2">of {c.min}</span> <span className="text-[1.5rem] text-muted">in</span>
      </p>
      <span className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: dots }).map((_, i) => (
          <span key={i} className={`h-4 w-4 rounded-full ${i < c.going ? "bg-bone" : "border border-dashed border-lavender/70"}`} />
        ))}
      </span>
      <p className="text-[15px] text-muted">
        {confirmed
          ? "it's on. nobody sees who else is in until it starts."
          : `${c.min - c.going} more and it's on. if it doesn't get there, it quietly doesn't happen.`}
      </p>
    </div>
  );
}
