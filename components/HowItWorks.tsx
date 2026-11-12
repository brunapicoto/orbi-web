"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { OrbitDial, type DialPhase } from "@/components/OrbitDial";

const STEPS: { n: string; title: string; body: string; phase: DialPhase; image: string; alt: string }[] = [
  {
    n: "01",
    title: "post a plan",
    body: "Painting, a run, the sauna, a dinner. Set the open spots. Every plan needs 3 or more people.",
    phase: "plan",
    image: "step-1.jpg",
    alt: "a woman on a brownstone stoop posting a plan on her phone",
  },
  {
    n: "02",
    title: "mutuals rsvp blind",
    body: "Your mutuals see “someone is hosting.” Nobody sees who else is in, not even the host.",
    phase: "blind",
    image: "step-2.jpg",
    alt: "a phone showing a plan for tennis in central park, for 3 or more people, sent to mutuals",
  },
  {
    n: "03",
    title: "show up and meet",
    body: "The group is revealed when you show up. If a plan doesn't reach 3, it quietly doesn't happen. Nobody gets a no.",
    phase: "reveal",
    image: "step-3.jpg",
    alt: "four friends with tennis rackets laughing together in central park",
  },
];

/**
 * Three steps. On desktop the left column stays put and shows the active step's
 * illustration (with the dial in the corner); on phones each step carries its own.
 * `images` says which illustrations exist in /public/how/; the rest show the dial alone.
 */
export function HowItWorks({ images }: { images: boolean[] }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const step = STEPS[active];
  return (
    <div className="grid gap-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-20">
      <div className="hidden md:block">
        <div className="sticky top-32 mx-auto w-full max-w-[440px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-ink-2 ring-1 ring-line">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={step.n}
                className="absolute inset-0"
                initial={reduce ? false : { opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <StepArt step={step} has={images[active]} />
              </motion.div>
            </AnimatePresence>
            {images[active] ? (
              <div className="absolute bottom-4 right-4 w-14 rounded-full bg-ink/80 p-2 backdrop-blur">
                <OrbitDial phase={step.phase} interactive={false} />
              </div>
            ) : null}
          </div>
          <p className="mono mt-6 text-center text-muted-2" aria-hidden="true">
            {step.n} / 03
          </p>
        </div>
      </div>
      <ol className="flex flex-col gap-24 md:gap-[38vh] md:py-[12vh]">
        {STEPS.map((s, i) => (
          <Step key={s.n} step={s} has={images[i]} onActive={() => setActive(i)} />
        ))}
      </ol>
    </div>
  );
}

function StepArt({ step, has }: { step: (typeof STEPS)[number]; has: boolean }) {
  if (has) {
    return <Image src={`/how/${step.image}`} alt={step.alt} fill sizes="(min-width: 768px) 440px, 100vw" className="object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center p-16">
      <OrbitDial phase={step.phase} label={`orbit dial, step ${step.n}`} />
    </div>
  );
}

function Step({ step, has, onActive }: { step: (typeof STEPS)[number]; has: boolean; onActive: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive();
  }, [inView, onActive]);
  return (
    <li ref={ref} className="flex flex-col gap-5">
      <div className={`md:hidden ${has ? "relative aspect-square w-full overflow-hidden rounded-[24px] ring-1 ring-line" : "w-28"}`}>
        {has ? <Image src={`/how/${step.image}`} alt={step.alt} fill sizes="100vw" className="object-cover" /> : <OrbitDial phase={step.phase} interactive={false} />}
      </div>
      <p className="mono text-lavender">{step.n}</p>
      <h3 className="display text-[clamp(2.25rem,5vw,3.5rem)]">{step.title}</h3>
      <p className="max-w-[44ch] text-muted">{step.body}</p>
    </li>
  );
}
