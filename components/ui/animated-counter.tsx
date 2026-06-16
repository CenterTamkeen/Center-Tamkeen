"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  target: number;
  locale?: string;
  duration?: number;
  className?: string;
};

export function AnimatedCounter({
  target,
  locale = "ar-EG",
  duration = 1200,
  className = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();

          function step(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          }

          requestAnimationFrame(step);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString(locale)}
    </span>
  );
}
