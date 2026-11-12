"use client";

import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "p" | "h2" | "span";
};

/**
 * Fade and rise on scroll. Server and browser render the same element;
 * reduced motion is handled in CSS ([data-reveal] in globals.css) so nothing hides or moves.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: Props) {
  const Tag = motion[as];
  return (
    <Tag
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </Tag>
  );
}
