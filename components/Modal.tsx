"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import classNames from "classnames";
import styles from "./Modal.module.scss";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function Modal({ open, onClose, children, className }: ModalProps) {
  const backdropRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !backdropRef.current || !panelRef.current) {
      return;
    }

    gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: "power2.out" });
    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, y: 16, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.26, ease: "power2.out" }
    );
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.root} role="dialog" aria-modal="true">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close dialog"
        onClick={onClose}
        ref={backdropRef}
      />
      <div ref={panelRef} className={classNames(styles.panel, className)} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
