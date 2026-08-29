"use client";

import { motion } from "motion/react";
import { EASE_PREMIUM } from "../lib/motion";

// On-mount fade + rise (no scroll trigger, unlike Reveal) — for content
// that's already in the initial viewport, like a page's hero. A small
// client-component wrapper so pages that are otherwise Server Components
// don't need to become client components just to animate a heading.
const TAGS = { div: motion.div, h1: motion.h1, h2: motion.h2, p: motion.p, span: motion.span };

export default function AnimateIn({ as = "div", delay = 0, children, ...rest }) {
  const Tag = TAGS[as] || motion.div;
  return (
    <Tag
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: EASE_PREMIUM }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
