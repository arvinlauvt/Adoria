"use client";

import { motion } from "motion/react";
import { EASE_PREMIUM } from "../lib/motion";

// Reveals its children with a fade + rise, but only once the element
// actually scrolls into view (`viewport.once` stops watching after the
// first reveal, same as the old IntersectionObserver's `observer.disconnect()`)
// instead of animating on page load, which would waste the effect on
// anything below the fold.
export default function Reveal({ children, delay = 0, style, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE_PREMIUM }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
