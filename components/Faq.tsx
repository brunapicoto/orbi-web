"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

type Item = { q: string; a: string };

export function Faq({ items }: { items: Item[] }) {
  return (
    <ul className="border-t border-line">
      {items.map((item) => (
        <FaqItem key={item.q} {...item} />
      ))}
    </ul>
  );
}

function FaqItem({ q, a }: Item) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const id = useId();
  return (
    <li className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="group flex w-full items-center justify-between gap-6 py-6 text-left"
        >
          <span className="display text-[clamp(1.5rem,3.2vw,2.25rem)] text-bone transition-colors group-hover:text-lavender">
            {q}
          </span>
          <span
            aria-hidden="true"
            className={`relative h-5 w-5 shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
          >
            <span className="absolute left-0 top-1/2 h-px w-5 bg-lavender" />
            <span className="absolute left-1/2 top-0 h-5 w-px bg-lavender" />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={id}
            key="a"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[60ch] pb-7 text-muted">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
