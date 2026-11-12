"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Person } from "@/lib/app/types";

const TONES = ["#7A1428", "#8FA3F5", "#C9D2FA", "#B9B3B5", "#9C9597"];

/** Silhouettes first, then faces and names, one by one. */
export function PeopleReveal({ people, animate }: { people: Person[]; animate: boolean }) {
  const reduce = useReducedMotion();
  const instant = reduce || !animate;
  const [shown, setShown] = useState(instant);
  useEffect(() => {
    if (instant) return;
    const t = setTimeout(() => setShown(true), 900);
    return () => clearTimeout(t);
  }, [instant]);

  return (
    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset" aria-live="polite">
      {people.map((p, i) => {
        const tone = TONES[i % TONES.length];
        const dark = tone === "#7A1428";
        return (
          <li key={p.id} className="flex items-center gap-4 px-5 py-4">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-line">
              <motion.span
                className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-display)] text-[17px]"
                style={{ background: tone, color: dark ? "#F4F1F1" : "#0E0C0D" }}
                initial={false}
                animate={{ opacity: shown ? 1 : 0, filter: shown ? "blur(0px)" : "blur(8px)" }}
                transition={{ duration: instant ? 0 : 0.9, delay: instant ? 0 : i * 0.35 }}
                aria-hidden="true"
              >
                {p.firstName.slice(0, 1).toLowerCase()}
              </motion.span>
              {!shown ? <span className="absolute inset-0 rounded-full bg-muted-2/60 blur-[2px]" aria-hidden="true" /> : null}
            </span>
            <span className="flex min-w-0 flex-col">
              <motion.span
                className="display text-[1.5rem] leading-tight"
                initial={false}
                animate={{ opacity: shown ? 1 : 0.15, filter: shown ? "blur(0px)" : "blur(8px)" }}
                transition={{ duration: instant ? 0 : 0.9, delay: instant ? 0 : i * 0.35 }}
              >
                {shown ? p.firstName.toLowerCase() : "someone"}
              </motion.span>
              <span className="mono text-muted-2">{p.isMe ? "you" : p.isHost ? "hosted it" : "said yes"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
