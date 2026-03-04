"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { usePrefersReducedMotion, safeDuration } from "@/lib/motion";
import styles from "./MiniRouteLoader.module.scss";

export default function MiniRouteLoader() {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (!overlayRef.current) {
      return;
    }

    if (previousPath.current === null) {
      previousPath.current = pathname;
      gsap.set(overlayRef.current, { autoAlpha: 0 });
      return;
    }

    if (previousPath.current === pathname) {
      return;
    }

    previousPath.current = pathname;

    const duration = safeDuration(0.11, reduced);
    const timeline = gsap.timeline();
    timeline
      .to(overlayRef.current, { autoAlpha: 1, duration, ease: "power1.out" })
      .to(overlayRef.current, { autoAlpha: 0, duration, ease: "power1.out", delay: reduced ? 0 : 0.04 });

    return () => {
      timeline.kill();
    };
  }, [pathname, reduced]);

  return <div ref={overlayRef} className={styles.overlay} aria-hidden="true" />;
}
