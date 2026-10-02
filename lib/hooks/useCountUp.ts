"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 400;

/** Animates a displayed integer from its previous value to `target` whenever it changes. */
export function useCountUp(target: number): number {
  const [displayed, setDisplayed] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const duration = reducedMotion ? 0 : DURATION_MS;
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setDisplayed(Math.round(from + (target - from) * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return displayed;
}
