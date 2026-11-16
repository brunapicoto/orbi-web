"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { joinPlan } from "@/app/app/actions";

/** Saving a spot without seeing who's coming: a prompt, then the sealed group. */
export function SaveSpot({ planId, place, when, unknown, saved = false }: { planId: string; place: string; when: string; unknown: number; saved?: boolean }) {
  const [sealed, setSealed] = useState(saved);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      setErr("");
      const res = await joinPlan(planId);
      if (res.error) setErr(res.error);
      else setSealed(true);
    });

  return (
    <div className="flex min-h-[70dvh] flex-col justify-between gap-10 pt-4">
      <div className="flex flex-col items-center gap-8">
        <div className="relative w-full rounded-[24px] bg-ink-2 p-7 ring-1 ring-line ring-inset">
          <span className="display absolute -top-5 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-lavender text-[1.6rem] text-ink" aria-hidden="true">
            0
          </span>
          <p className="mono text-[11px] uppercase tracking-widest text-muted-2">{sealed ? "sealed" : "pending"} · {when}</p>
          {sealed ? (
            <>
              <h1 className="display mt-4 text-[2.6rem]">your spot is saved.</h1>
              <p className="mt-4 text-muted">
                the group is sealed. you&apos;ll find out who else is there <span className="display text-lavender">at {place}.</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="display mt-4 text-[2.4rem]">
                you&apos;re saving a spot at <span className="text-lavender">{place}.</span>
              </h1>
              <p className="mt-4 text-muted">you won&apos;t see who else confirms. everyone meets in person.</p>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-3" aria-label={`you and ${unknown} people you'll meet there`}>
          <div className="flex gap-2.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] ${sealed ? "bg-lavender text-ink" : "border border-dashed border-lavender/70 text-lavender"}`} aria-hidden="true">
              {sealed ? "✓" : "?"}
            </span>
            {Array.from({ length: Math.min(unknown, 7) }).map((_, i) => (
              <span key={i} className="display flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-lavender/50 text-lavender/80" aria-hidden="true">
                ?
              </span>
            ))}
          </div>
          <p className="mono text-[11px] uppercase tracking-widest text-muted-2">you · {unknown} unknown</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {err ? <p role="alert" className="mono text-lavender">{err}</p> : null}
        {sealed ? (
          <Link href="/app" className="mono flex min-h-14 items-center justify-center rounded-full bg-bone px-8 text-[15px] text-ink hover:bg-lavender">
            back to the feed
          </Link>
        ) : (
          <>
            <button type="button" onClick={save} disabled={pending} className="mono min-h-14 rounded-full bg-bone px-8 text-[15px] text-ink hover:bg-lavender disabled:opacity-60">
              {pending ? "saving…" : "yes, save my spot"}
            </button>
            <Link href={`/app/plan/${planId}`} className="mono self-center text-muted-2 link-draw">not yet</Link>
          </>
        )}
      </div>
    </div>
  );
}
