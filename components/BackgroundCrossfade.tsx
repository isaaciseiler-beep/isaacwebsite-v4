"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import styles from "./BackgroundCrossfade.module.scss";

type BackgroundCrossfadeProps = {
  imageSrc: string;
  imageAlt?: string;
};

export default function BackgroundCrossfade({ imageSrc, imageAlt = "Background" }: BackgroundCrossfadeProps) {
  const [front, setFront] = useState(imageSrc);
  const [back, setBack] = useState<string | null>(null);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imageSrc === front) {
      return;
    }

    setBack(front);
    setFront(imageSrc);
  }, [front, imageSrc]);

  useEffect(() => {
    if (!back || !frontRef.current || !backRef.current) {
      return;
    }

    gsap.set(frontRef.current, { autoAlpha: 0 });
    const timeline = gsap.timeline({ onComplete: () => setBack(null) });
    timeline.to(frontRef.current, { autoAlpha: 1, duration: 0.42, ease: "power2.out" }, 0);
    timeline.to(backRef.current, { autoAlpha: 0, duration: 0.42, ease: "power2.out" }, 0);

    return () => {
      timeline.kill();
    };
  }, [back, front]);

  return (
    <div className={styles.root} aria-hidden="true">
      {back ? (
        <div className={styles.layer} ref={backRef}>
          <Image src={back} alt={imageAlt} fill priority sizes="100vw" className={styles.image} />
        </div>
      ) : null}
      <div className={styles.layer} ref={frontRef}>
        <Image src={front} alt={imageAlt} fill priority sizes="100vw" className={styles.image} />
      </div>
      <div className={styles.overlay} />
    </div>
  );
}
