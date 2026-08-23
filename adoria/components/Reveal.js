"use client";

import { useEffect, useRef, useState } from "react";

// Reveals its children with the same fadeInUp motion as .animate-in, but only
// once the element actually scrolls into view — instead of animating on
// page load, which wastes the effect on anything below the fold. Uses the
// native IntersectionObserver (no library) and stops observing after the
// first reveal, so it costs nothing once triggered.
export default function Reveal({ children, delay = 0, style, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={visible ? "animate-in" : ""}
      style={{ opacity: visible ? undefined : 0, animationDelay: `${delay}s`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
