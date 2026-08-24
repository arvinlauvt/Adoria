"use client";

import { useEffect, useRef, useState } from "react";

// Reveals its children with a fade + rise, but only once the element actually
// scrolls into view — instead of animating on page load, which wastes the
// effect on anything below the fold. Uses the native IntersectionObserver (no
// library) and stops observing after the first reveal, so it costs nothing
// once triggered.
//
// Driven by an inline CSS transition (not a keyframe animation class) — the
// keyframe + animation-fill-mode:"both" approach could leave a section
// permanently stuck at opacity 0 after a fast/aggressive scroll, even though
// its computed opacity read back as 1. A plain opacity/transform transition
// doesn't have that failure mode.
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
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.7s var(--ease-premium) ${delay}s, transform 0.7s var(--ease-premium) ${delay}s`,
        willChange: "opacity, transform",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
