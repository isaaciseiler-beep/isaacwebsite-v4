"use client";

import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./Cursor.module.scss";

type Point = { x: number; y: number };

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, [data-cursor='hover'], summary";

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const target = useRef<Point>({ x: 0, y: 0 });
  const current = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !cursorRef.current) {
      document.body.removeAttribute("data-cursor-active");
      return;
    }

    document.body.setAttribute("data-cursor-active", "true");

    let frame = 0;

    const loop = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * 0.16;
      current.current.y += dy * 0.16;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }

      frame = window.requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      target.current = { x: event.clientX, y: event.clientY };
      if (current.current.x === 0 && current.current.y === 0) {
        current.current = target.current;
      }
    };

    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onOver = (event: Event) => {
      const targetElement = event.target as Element | null;
      if (!targetElement) {
        return;
      }
      if (targetElement.closest(INTERACTIVE_SELECTOR)) {
        setHovered(true);
      }
    };

    const onOut = (event: Event) => {
      const related = (event as MouseEvent).relatedTarget as Element | null;
      if (related?.closest(INTERACTIVE_SELECTOR)) {
        return;
      }
      setHovered(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);

    frame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
      document.body.removeAttribute("data-cursor-active");
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return <div ref={cursorRef} className={classNames(styles.cursor, hovered && styles.hovered, pressed && styles.pressed)} />;
}
