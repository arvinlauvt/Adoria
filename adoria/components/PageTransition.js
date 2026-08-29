"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../lib/motion";

// Re-keying on pathname remounts the subtree on every navigation, which
// restarts the animation below — giving every page a fade + rise on entry
// instead of just an instant swap.
export default function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
  );
}
