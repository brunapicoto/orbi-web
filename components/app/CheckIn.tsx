"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkIn } from "@/app/app/actions";

/** At the door: tap in, and the group is revealed to you. */
export function CheckIn({ planId, place, arrived, total }: { planId: string; place: string; arrived: number; total: number }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="checkin-title" className="flex flex-col gap-4 rounded-[24px] bg-ink-2 p-6 ring-1 ring-line ring-inset">
      <div className="flex items-center justify-between">
        <span className="mono text-[11px] uppercase tracking-widest text-muted-2">ready when you are</span>
        <span className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i < arrived ? "bg-lavender" : "border border-lavender/50"}`} />
          ))}
        </span>
      </div>
      <h2 id="checkin-title" className="display text-[2rem] leading-[1.02]">
        walk in. tell them <span className="text-lavender">&ldquo;i&apos;m with orbi.&rdquo;</span>
      </h2>
      <p className="text-[15px] text-muted">
        {arrived} of {total} {arrived === 1 ? "has" : "have"} arrived. still no names: you&apos;ll see who&apos;s there once you check in.
      </p>
      <p className="mono flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-[13px] text-muted">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-lavender" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
        {place}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr("");
            const res = await checkIn(planId);
            if (res.error) setErr(res.error);
            else router.refresh();
          })
        }
        className="mono min-h-14 rounded-full bg-bone px-8 text-[15px] text-ink transition-colors hover:bg-lavender disabled:opacity-60"
      >
        {pending ? "checking you in…" : "i'm at the door"}
      </button>
      {err ? <p role="alert" className="mono text-lavender">{err}</p> : null}
    </section>
  );
}
