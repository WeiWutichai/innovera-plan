"use client";

import { useEffect, useState } from "react";

/**
 * Returns true below `breakpoint` px. Returns null until mounted so callers can
 * avoid rendering either shell during SSR (prevents a hydration mismatch).
 */
export function useIsMobile(breakpoint = 900): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
