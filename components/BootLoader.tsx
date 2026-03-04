"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion, safeDuration } from "@/lib/motion";
import styles from "./BootLoader.module.scss";

type BootLoaderProps = {
  children: React.ReactNode;
};

const SYSTEM_LINES = [
  "* // Initializing Neural Interface...",
  "* // Decrypting Data Streams...",
  "* // Synchronizing Parallel Realities...",
  "* // Transmitting Quantum Signals...",
  "* // Unlocking Digital Dimensions...",
  "* // You're About to Enter the Future..."
];

export default function BootLoader({ children }: BootLoaderProps) {
  const reduced = usePrefersReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const progressValue = useRef({ value: 0 });

  const reveal = useCallback(() => {
    if (!overlayRef.current) {
      setHidden(true);
      return;
    }

    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      duration: safeDuration(0.32, reduced),
      ease: "power2.out",
      onComplete: () => setHidden(true)
    });
  }, [reduced]);

  useEffect(() => {
    const duration = reduced ? 0.14 : 2.2;

    const tween = gsap.to(progressValue.current, {
      value: 100,
      duration,
      ease: "power1.out",
      onUpdate: () => setProgress(Math.round(progressValue.current.value)),
      onComplete: () => {
        if (!window.localStorage.getItem("audioPreference")) {
          window.localStorage.setItem("audioPreference", "off");
        }
        reveal();
      }
    });

    return () => {
      tween.kill();
    };
  }, [reduced, reveal]);

  useEffect(() => {
    if (reduced) {
      return;
    }

    const timer = window.setInterval(() => {
      setLineIndex((previous) => (previous + 1) % SYSTEM_LINES.length);
    }, 350);

    return () => window.clearInterval(timer);
  }, [reduced]);

  const currentLine = useMemo(() => SYSTEM_LINES[lineIndex], [lineIndex]);

  return (
    <>
      {children}
      {!hidden ? (
        <div ref={overlayRef} className={styles.overlay}>
          <div className={styles.center}>
            <p className={styles.line}>{currentLine}</p>
            <p className={styles.percent}>( {Math.min(100, progress)}% )</p>
            <p className={styles.helper}>{"// Hang tight, Explorer. The data transfer is in progress..."}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
