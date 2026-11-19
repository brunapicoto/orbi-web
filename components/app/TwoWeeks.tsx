"use client";

import Link from "next/link";
import { useState } from "react";
import { KindIcon } from "@/components/app/KindIcon";

export type CalPlan = { id: string; day: string; time: string; title: string; kind: string; hosting: boolean };
export type CalDay = { day: string; weekday: string; date: number; month: string; today: boolean };

/** The next two weeks: a dot for each plan you're in. Tap a day to see them. */
export function TwoWeeks({ days, plans }: { days: CalDay[]; plans: CalPlan[] }) {
  const firstWithPlans = days.find((d) => plans.some((p) => p.day === d.day))?.day ?? days[0].day;
  const [picked, setPicked] = useState(firstWithPlans);
  const onDay = plans.filter((p) => p.day === picked);
  const pickedDay = days.find((d) => d.day === picked)!;

  return (
    <div className="flex flex-col gap-4 rounded-[20px] bg-ink-2 p-4 ring-1 ring-line ring-inset">
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label="the next two weeks">
        {days.slice(0, 7).map((d) => (
          <span key={`h-${d.day}`} className="mono pb-1 text-[10px] uppercase tracking-wider text-muted-2" aria-hidden="true">
            {d.weekday.slice(0, 1)}
          </span>
        ))}
        {days.map((d) => {
          const mine = plans.filter((p) => p.day === d.day);
          const on = d.day === picked;
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => setPicked(d.day)}
              aria-pressed={on}
              aria-label={`${d.weekday} ${d.month} ${d.date}${mine.length ? `, ${mine.length} ${mine.length === 1 ? "plan" : "plans"}` : ""}`}
              className={`flex min-h-[54px] flex-col items-center justify-start gap-1 rounded-xl pt-1.5 transition-colors ${on ? "bg-bone text-ink" : d.today ? "ring-1 ring-inset ring-lavender/60" : "hover:bg-ink"}`}
            >
              <span className={`display text-[1.15rem] leading-none ${on ? "" : mine.length ? "text-bone" : "text-muted-2"}`}>{d.date}</span>
              <span className="flex h-3 items-center gap-0.5" aria-hidden="true">
                {mine.slice(0, 3).map((p) => (
                  <span key={p.id} className={`h-1.5 w-1.5 rounded-full ${p.hosting ? (on ? "bg-wine" : "bg-bone") : "bg-lavender"}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-3" aria-live="polite">
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">
          {pickedDay.today ? "today" : `${pickedDay.weekday} · ${pickedDay.month} ${pickedDay.date}`}
        </p>
        {onDay.length ? (
          <ul className="flex flex-col gap-2">
            {onDay.map((p) => (
              <li key={p.id}>
                <Link href={`/app/plan/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-ink px-3 py-2.5 hover:ring-1 hover:ring-lavender/50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine text-bone">
                    <KindIcon kind={p.kind} className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="display truncate text-[1.15rem] leading-tight">{p.title}</span>
                    <span className="mono text-[11px] text-muted-2">{p.time}{p.hosting ? " · you're hosting" : ""}</span>
                  </span>
                  <span aria-hidden="true" className="text-lavender">›</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-muted">nothing yet. <Link href="/app?show=open" className="link-draw text-lavender">see what&apos;s open</Link></p>
        )}
        <p className="mono flex items-center gap-3 pt-1 text-[11px] text-muted-2">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lavender" />going</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-bone" />hosting</span>
        </p>
      </div>
    </div>
  );
}
