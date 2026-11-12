"use client";

import { useState, useTransition } from "react";
import { dropOrbitPick, keepInOrbit } from "@/app/app/actions";
import type { Person } from "@/lib/app/types";

/**
 * After a plan: quietly pick who to keep in your orbit.
 * Two people who pick each other connect; a one-sided pick stays private.
 */
export function OrbitPicks({ planId, people, picked, connected }: { planId: string; people: Person[]; picked: string[]; connected: string[] }) {
  const [picks, setPicks] = useState(new Set(picked));
  const [conn, setConn] = useState(new Set(connected));
  const [justMatched, setJustMatched] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (p: Person) =>
    start(async () => {
      setError(null);
      if (picks.has(p.id)) {
        const res = await dropOrbitPick(planId, p.id);
        if (res.error) return setError(res.error);
        const next = new Set(picks);
        next.delete(p.id);
        setPicks(next);
        return;
      }
      const res = await keepInOrbit(planId, p.id);
      if (res.error) return setError(res.error);
      if (res.result === "connected") {
        setConn(new Set(conn).add(p.id));
        setJustMatched(p.firstName);
      } else {
        setPicks(new Set(picks).add(p.id));
      }
    });

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset">
        {people.map((p) => {
          const isConn = conn.has(p.id);
          const isPicked = picks.has(p.id);
          return (
            <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="display text-[1.35rem]">{p.firstName.toLowerCase()}</span>
              {isConn ? (
                <span className="mono text-lavender">in your orbit</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => toggle(p)}
                  aria-pressed={isPicked}
                  className={`mono min-h-11 rounded-full border px-4 text-[13px] transition-colors disabled:opacity-60 ${
                    isPicked ? "border-lavender bg-lavender text-ink" : "border-line text-bone hover:border-lavender"
                  }`}
                >
                  {isPicked ? "picked" : "keep in orbit"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="text-[15px] text-muted">
        {error ??
          (justMatched
            ? `you and ${justMatched.toLowerCase()} picked each other. you're connected now.`
            : "only mutual picks connect. if they don't pick you back, nothing happens: no notification, no trace.")}
      </p>
    </div>
  );
}
