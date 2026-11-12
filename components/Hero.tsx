"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { OrbitDial } from "@/components/OrbitDial";
import { CafeArt, DinnerArt } from "@/components/SceneArt";

export type SceneSlot = { file: string; label: string; alt: string; available: boolean; art: "dinner" | "cafe" };

/**
 * Centered statement; on scroll, three cards rise over it in staggered columns
 * (the side cards hold the illustrations, the middle one the orbit dial).
 * Reduced motion and phones get the same cards in a simple grid instead.
 */
export function Hero({ scenes }: { scenes: [SceneSlot, SceneSlot] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const left = useTransform(scrollYProgress, [0, 1], ["102vh", "16vh"]);
  const mid = useTransform(scrollYProgress, [0, 1], ["128vh", "6vh"]);
  const right = useTransform(scrollYProgress, [0, 1], ["112vh", "24vh"]);
  const textScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  // rendered in both layouts (only one is visible); only the first copy carries the id
  const statement = (withId: boolean) => (
    <div className="flex w-full flex-col items-start gap-7 text-left">
      <h1 id={withId ? "hero-title" : undefined} className="display text-[clamp(120px,min(26vw,32vh),300px)] leading-[0.8] tracking-[-0.06em] text-lavender">
        orbi
      </h1>
      <p className="display max-w-[14ch] text-[clamp(1.9rem,4.4vw,3.25rem)] text-bone">from mutuals to real connections.</p>
      <p className="max-w-[34ch] text-lavender-soft">any plan, three or more people, and nobody has to ask first.</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
        <a
          href="#waitlist"
          className="mono inline-flex min-h-14 items-center rounded-full bg-bone px-8 text-[14px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink"
        >
          join the waitlist
        </a>
        <span className="mono text-lavender-soft">starting in new york</span>
      </div>
    </div>
  );

  const cards = [
    <SceneCard key="l" slot={scenes[0]} />,
    <DialCard key="m" />,
    <SceneCard key="r" slot={scenes[1]} />,
  ];

  return (
    <section id="top" aria-labelledby="hero-title" className="relative bg-bordeaux">
      {/* desktop, motion allowed: sticky statement with cards rising over it */}
      {/* both layouts are always rendered; CSS picks one, so server and browser agree */}
      <div ref={ref} className="hero-motion relative hidden h-[220vh] md:block">
          <div className="gutter sticky top-0 flex h-screen items-start overflow-hidden pt-[clamp(120px,17vh,168px)]">
            <motion.div style={{ scale: textScale, transformOrigin: "0% 50%" }} className="mx-auto w-full max-w-6xl">
              {statement(true)}
            </motion.div>
            <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto grid h-screen w-full max-w-6xl grid-cols-3 gap-6 px-6">
              <Column y={left} className="mt-0">{cards[0]}</Column>
              <Column y={mid} className="mt-0">{cards[1]}</Column>
              <Column y={right} className="mt-0">{cards[2]}</Column>
            </div>
          </div>
        </div>

      {/* phones and reduced motion: statement, then the cards in a grid */}
      <div className="hero-static gutter flex flex-col gap-14 pb-20 pt-32 md:hidden">
        <div className="mx-auto w-full max-w-6xl">{statement(false)}</div>
        <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
          <div className="col-span-2 md:col-span-1">{cards[1]}</div>
          {cards[0]}
          {cards[2]}
        </div>
      </div>
    </section>
  );
}

function Column({ y, className, children }: { y: MotionValue<string>; className?: string; children: React.ReactNode }) {
  return (
    <motion.div style={{ y }} className={`pointer-events-auto self-start ${className ?? ""}`}>
      {children}
    </motion.div>
  );
}

function DialCard() {
  return (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-6 rounded-[28px] bg-ink p-8 shadow-[0_30px_80px_rgba(14,12,13,0.45)]">
      <div className="w-[70%]">
        <OrbitDial label="the orbit dial: a plan in the middle with three people around it" />
      </div>
      <p className="mono text-center text-muted-2">one plan · three or more people</p>
    </div>
  );
}

function SceneCard({ slot }: { slot: SceneSlot }) {
  if (slot.available) {
    return (
      <figure className="relative m-0 aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-ink shadow-[0_30px_80px_rgba(14,12,13,0.45)]">
        <Image src={`/scenes/${slot.file}`} alt={slot.alt} fill sizes="(min-width: 768px) 360px, 50vw" className="object-cover" />
      </figure>
    );
  }
  return (
    <figure className="m-0 flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-[24px] bg-ink p-4 shadow-[0_30px_80px_rgba(14,12,13,0.45)] md:gap-6 md:rounded-[28px] md:p-8">
      <div className="w-[88%] md:w-[78%]">{slot.art === "dinner" ? <DinnerArt /> : <CafeArt />}</div>
      <figcaption className="mono text-center text-[11.5px] leading-snug text-muted-2 md:text-[13.5px]">{slot.label}</figcaption>
    </figure>
  );
}
