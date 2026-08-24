"use client";

import { usePathname } from "next/navigation";

// Re-keying on pathname remounts the subtree on every navigation, which
// restarts the CSS animation below — giving every page a fade + rise on
// entry instead of just an instant swap.
export default function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
