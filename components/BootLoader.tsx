"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [choice, setChoice] = useState<"on" | "off" | null>(null);
  const [hidden, setHidden] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const progressValue = useRef({ value: 0 });

  useEffect(() => {
    const targetValue = reduced ? 100 : 96;
    const duration = reduced ? 0.01 : 2.2;

    const tween = gsap.to(progressValue.current, {
      value: targetValue,
      duration,
      ease: "power1.out",
      onUpdate: () => setProgress(Math.round(progressValue.current.value))
    });

    return () => {
      tween.kill();
    };
  }, [reduced]);

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

  const reveal = () => {
    if (!overlayRef.current) {
      setHidden(true);
      return;
    }

    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      duration: safeDuration(0.36, reduced),
      ease: "power2.out",
      onComplete: () => setHidden(true)
    });
  };

  const completeProgress = () => {
    if (progress >= 100) {
      reveal();
      return;
    }

    gsap.to(progressValue.current, {
      value: 100,
      duration: safeDuration(progress < 96 ? 0.6 : 0.2, reduced),
      ease: "power2.out",
      onUpdate: () => setProgress(Math.round(progressValue.current.value)),
      onComplete: reveal
    });
  };

  const pickAudio = (value: "on" | "off") => {
    setChoice(value);
    window.localStorage.setItem("audioPreference", value);
    completeProgress();
  };

  return (
    <>
      {children}
      {!hidden ? (
        <div ref={overlayRef} className={styles.overlay}>
          <div className={styles.center}>
            <p className={styles.line}>{currentLine}</p>
            <p className={styles.percent}>( {Math.min(100, progress)}% )</p>
            <p className={styles.helper}>{"// Hang tight, Explorer. The data transfer is in progress..."}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.action}
                data-selected={choice === "on"}
                onClick={() => pickAudio("on")}
              >
                enter with audio
              </button>
              <button
                type="button"
                className={styles.action}
                data-selected={choice === "off"}
                onClick={() => pickAudio("off")}
              >
                enter without sound
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
