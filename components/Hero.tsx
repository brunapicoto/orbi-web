"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { OrbitDial } from "@/components/OrbitDial";

export type SceneSlot = { file: string; label: string; alt: string; available: boolean };

/**
 * Centered statement; on scroll, three cards rise over it in staggered columns
 * (the side cards hold the illustrations, the middle one the orbit dial).
 * Reduced motion and phones get the same cards in a simple grid instead.
 */
export function Hero({ scenes }: { scenes: [SceneSlot, SceneSlot] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const left = useTransform(scrollYProgress, [0, 1], ["102vh", "16vh"]);
  const mid = useTransform(scrollYProgress, [0, 1], ["128vh", "6vh"]);
  const right = useTransform(scrollYProgress, [0, 1], ["112vh", "24vh"]);
  const textScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  const statement = (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="mono text-lavender-soft">starting in new york</p>
      <h1 id="hero-title" className="display text-[clamp(120px,24vw,300px)] leading-[0.8] tracking-[-0.06em] text-lavender">
        orbi
      </h1>
      <p className="display max-w-[16ch] text-[clamp(2rem,5vw,4.25rem)] text-bone">from mutuals to real connections.</p>
      <p className="max-w-[34ch] text-lavender-soft">any plan, three or more people, and nobody has to ask first.</p>
      <a
        href="#waitlist"
        className="mono mt-2 inline-flex min-h-14 items-center rounded-full bg-bone px-8 text-[14px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink"
      >
        join the waitlist
      </a>
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
      {!reduce ? (
        <div ref={ref} className="relative hidden h-[220vh] md:block">
          <div className="gutter sticky top-0 flex h-screen items-center justify-center overflow-hidden">
            <motion.div style={{ scale: textScale }}>{statement}</motion.div>
            <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto grid h-screen w-full max-w-6xl grid-cols-3 gap-6 px-6">
              <Column y={left} className="mt-0">{cards[0]}</Column>
              <Column y={mid} className="mt-0">{cards[1]}</Column>
              <Column y={right} className="mt-0">{cards[2]}</Column>
            </div>
          </div>
        </div>
      ) : null}

      {/* phones and reduced motion: statement, then the cards in a grid */}
      <div className={`gutter flex flex-col items-center gap-14 pb-20 pt-32 ${reduce ? "" : "md:hidden"}`}>
        {statement}
        <div className="grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
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
  return (
    <figure className="relative m-0 aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-ink-2 shadow-[0_30px_80px_rgba(14,12,13,0.45)]">
      {slot.available ? (
        <Image src={`/scenes/${slot.file}`} alt={slot.alt} fill sizes="(min-width: 768px) 360px, 50vw" className="object-cover" />
      ) : (
        // PLACEHOLDER: drop the illustration into /public/scenes/ with this file name
        <div className="mono absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-lavender-soft/40 p-4 text-center text-[12px] text-lavender-soft">
          <span>illustration</span>
          <span className="text-muted">{slot.label}</span>
          <span className="text-muted-2">/scenes/{slot.file}</span>
        </div>
      )}
    </figure>
  );
}
