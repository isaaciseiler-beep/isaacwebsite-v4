"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";

export const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
};

export const quickFade = (
  target: gsap.TweenTarget,
  {
    from = 0,
    to = 1,
    duration = 0.22,
    reduced = false
  }: {
    from?: number;
    to?: number;
    duration?: number;
    reduced?: boolean;
  }
): gsap.core.Tween => {
  return gsap.fromTo(
    target,
    { opacity: from },
    {
      opacity: to,
      duration: reduced ? 0.01 : duration,
      ease: "power2.out"
    }
  );
};

export const safeDuration = (duration: number, reduced: boolean): number => (reduced ? 0.01 : duration);
