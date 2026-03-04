"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { FeedItem, Photo } from "@/lib/content";
import { usePrefersReducedMotion, safeDuration } from "@/lib/motion";
import styles from "./FeedCarousel.module.scss";

type FeedCarouselProps = {
  items: FeedItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onOpenPhoto?: (photo: Photo) => void;
};

export default function FeedCarousel({ items, index, onIndexChange, onOpenPhoto }: FeedCarouselProps) {
  const reduced = usePrefersReducedMotion();
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const pointerStart = useRef<number | null>(null);

  const currentItem = items[index];
  const previousItem = items[(index - 1 + items.length) % items.length];
  const nextItem = items[(index + 1) % items.length];

  const go = (direction: 1 | -1) => {
    if (items.length <= 1) {
      return;
    }

    const nextIndex = (index + direction + items.length) % items.length;
    onIndexChange(nextIndex);
  };

  useEffect(() => {
    if (!cardRef.current) {
      return;
    }

    gsap.fromTo(
      cardRef.current,
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        duration: safeDuration(0.42, reduced),
        ease: "power2.out"
      }
    );
  }, [index, reduced]);

  const body = useMemo(() => {
    if (!currentItem) {
      return null;
    }

    if (currentItem.type === "linkedin") {
      return {
        chip: "linkedin",
        title: currentItem.title,
        text: currentItem.excerpt,
        date: currentItem.date,
        image: currentItem.coverSrc
      };
    }

    return {
      chip: "photo",
      title: currentItem.location,
      text: currentItem.album,
      date: currentItem.takenDate ?? "",
      image: currentItem.src
    };
  }, [currentItem]);

  if (!currentItem || !body) {
    return <div className={styles.empty}>No feed items yet.</div>;
  }

  const onPrimaryAction = () => {
    if (currentItem.type === "linkedin") {
      window.open(currentItem.url, "_blank", "noopener,noreferrer");
      return;
    }

    onOpenPhoto?.(currentItem);
  };

  return (
    <section
      className={styles.root}
      aria-label="Feed carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(1);
        }
      }}
    >
      <div className={styles.track}>
        <button type="button" className={styles.preview} onClick={() => go(-1)} aria-label="Previous slide">
          <Image
            src={previousItem.type === "linkedin" ? previousItem.coverSrc : previousItem.src}
            alt={previousItem.type === "linkedin" ? previousItem.title : previousItem.location}
            fill
            sizes="220px"
            className={styles.image}
          />
        </button>

        <button
          type="button"
          className={styles.card}
          ref={cardRef}
          onClick={onPrimaryAction}
          onPointerDown={(event) => {
            pointerStart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (pointerStart.current === null) {
              return;
            }

            const delta = event.clientX - pointerStart.current;
            pointerStart.current = null;

            if (Math.abs(delta) > 52) {
              go(delta > 0 ? -1 : 1);
            }
          }}
        >
          <span className={styles.chip}>{body.chip}</span>

          <div className={styles.imageWrap}>
            <Image src={body.image} alt={body.title} fill sizes="(max-width: 1024px) 90vw, 920px" className={styles.image} />
          </div>

          <div className={styles.text}>
            <h3>{body.title}</h3>
            <p>{body.text}</p>
            {body.date ? <span>{new Date(body.date).toLocaleDateString()}</span> : null}
          </div>
        </button>

        <button type="button" className={styles.preview} onClick={() => go(1)} aria-label="Next slide">
          <Image
            src={nextItem.type === "linkedin" ? nextItem.coverSrc : nextItem.src}
            alt={nextItem.type === "linkedin" ? nextItem.title : nextItem.location}
            fill
            sizes="220px"
            className={styles.image}
          />
        </button>
      </div>

      <div className={styles.controls}>
        <button type="button" aria-label="Previous slide" onClick={() => go(-1)}>
          ←
        </button>
        <button type="button" aria-label="Next slide" onClick={() => go(1)}>
          →
        </button>
      </div>
    </section>
  );
}
