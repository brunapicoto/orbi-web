"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * The orbit dial: a central disc (the plan) with three people orbiting it
 * and two faint rings. Rotates once every 40s and leans toward the cursor.
 *
 * phase controls the how-it-works story:
 *   "full"   everyone is there (hero)
 *   "plan"   only the plan, the spots are empty
 *   "blind"  people are in, but you can't see who
 *   "reveal" the group shows up
 */
export type DialPhase = "full" | "plan" | "blind" | "reveal";

type Props = {
  phase?: DialPhase;
  size?: number | string;
  /** color of the disc and dots */
  fg?: string;
  /** color of the rings */
  ring?: string;
  /** follow the cursor */
  interactive?: boolean;
  className?: string;
  label?: string;
};

const DOTS = [
  { cx: 60, cy: 29 },
  { cx: 86.8, cy: 75.5 },
  { cx: 33.2, cy: 75.5 },
];

export function OrbitDial({
  phase = "full",
  size = "100%",
  fg = "#F4F1F1",
  ring = "rgba(244,241,241,0.22)",
  interactive = true,
  className,
  label,
}: Props) {
  const reduce = useReducedMotion();

  // cursor reaction: a small tilt toward the pointer, softened by a spring
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 });
  const rotateY = useTransform(sx, [-1, 1], [-10, 10]);
  const rotateX = useTransform(sy, [-1, 1], [8, -8]);
  const shiftX = useTransform(sx, [-1, 1], [-4, 4]);
  const shiftY = useTransform(sy, [-1, 1], [-4, 4]);

  useEffect(() => {
    if (!interactive || reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [interactive, reduce, mx, my]);

  const showDots = phase !== "plan";
  const hidden = phase === "blind";

  return (
    <motion.div
      className={className}
      style={{
        width: size,
        aspectRatio: "1 / 1",
        perspective: 800,
        rotateX: reduce ? 0 : rotateX,
        rotateY: reduce ? 0 : rotateY,
      }}
    >
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        style={{ overflow: "visible" }}
      >
        <circle cx="60" cy="60" r="31" fill="none" stroke={ring} strokeWidth="0.6" />
        <circle cx="60" cy="60" r="50" fill="none" stroke={ring} strokeWidth="0.5" strokeDasharray="0.6 2.4" />

        <motion.g
          style={{ x: reduce ? 0 : shiftX, y: reduce ? 0 : shiftY }}
          animate={reduce ? { rotate: 0 } : { rotate: 360 }}
          transition={reduce ? { duration: 0 } : { duration: 40, ease: "linear", repeat: Infinity }}
        >
          {/* invisible ring keeps the group's box centred on the plan, so it spins around it */}
          <circle cx="60" cy="60" r="50" fill="none" stroke="none" />
          {DOTS.map((d, i) => (
            <g key={i}>
              {/* the empty spot: always there, faint */}
              <circle cx={d.cx} cy={d.cy} r="8" fill="none" stroke={ring} strokeWidth="0.8" strokeDasharray="1.6 1.6" />
              <motion.circle
                cx={d.cx}
                cy={d.cy}
                r="8"
                initial={false}
                animate={{
                  scale: showDots ? 1 : 0,
                  opacity: showDots ? (hidden ? 0.35 : 1) : 0,
                }}
                transition={reduce ? { duration: 0 } : { duration: 0.8, delay: showDots ? i * 0.15 : 0, ease: [0.2, 0.7, 0.2, 1] }}
                style={{ filter: hidden ? "blur(1.6px)" : "none" }}
                fill={fg}
              />
            </g>
          ))}
        </motion.g>

        <circle cx="60" cy="60" r="19" fill={fg} />
      </svg>
    </motion.div>
  );
}
