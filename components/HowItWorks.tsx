"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { OrbitDial, type DialPhase } from "@/components/OrbitDial";

const STEPS: { n: string; title: string; body: string; phase: DialPhase }[] = [
  {
    n: "01",
    title: "post a plan",
    body: "Painting, a run, the sauna, a dinner. Set the open spots. Every plan needs 3 or more people.",
    phase: "plan",
  },
  {
    n: "02",
    title: "mutuals rsvp blind",
    body: "Your mutuals see “someone is hosting.” Nobody sees who else is in, not even the host.",
    phase: "blind",
  },
  {
    n: "03",
    title: "show up and meet",
    body: "The group is revealed when you show up. If a plan doesn't reach 3, it quietly doesn't happen. Nobody gets a no.",
    phase: "reveal",
  },
];

/** Three steps; on desktop the dial stays put and changes as each step scrolls past. */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  return (
    <div className="grid gap-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-20">
      <div className="hidden md:block">
        <div className="sticky top-32 mx-auto w-full max-w-[380px]">
          <OrbitDial phase={STEPS[active].phase} label={`orbit dial, step ${STEPS[active].n}`} />
          <p className="mono mt-8 text-center text-muted-2" aria-hidden="true">
            {STEPS[active].n} / 03
          </p>
        </div>
      </div>
      <ol className="flex flex-col gap-24 md:gap-[38vh] md:py-[12vh]">
        {STEPS.map((s, i) => (
          <Step key={s.n} step={s} onActive={() => setActive(i)} />
        ))}
      </ol>
    </div>
  );
}

function Step({ step, onActive }: { step: (typeof STEPS)[number]; onActive: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive();
  }, [inView, onActive]);
  return (
    <li ref={ref} className="flex flex-col gap-5">
      <div className="w-28 md:hidden">
        <OrbitDial phase={step.phase} interactive={false} />
      </div>
      <p className="mono text-lavender">{step.n}</p>
      <h3 className="display text-[clamp(2.25rem,5vw,3.5rem)]">{step.title}</h3>
      <p className="max-w-[44ch] text-muted">{step.body}</p>
    </li>
  );
}
