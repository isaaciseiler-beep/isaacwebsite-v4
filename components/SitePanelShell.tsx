"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import styles from "./SitePanelShell.module.scss";

type SitePanelShellProps = {
  mode: "feed" | "projects";
  onModeChange: (mode: "feed" | "projects") => void;
  onOpenContact: () => void;
  children: React.ReactNode;
};

export default function SitePanelShell({ mode, onModeChange, onOpenContact, children }: SitePanelShellProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  const runMenuTransition = (action: () => void) => {
    if (isExiting) {
      return;
    }

    setIsEntering(false);
    setIsExiting(true);

    window.setTimeout(() => {
      action();
      setIsExiting(false);
      setIsEntering(true);
    }, 460);
  };

  return (
    <div className={styles.shell}>
      <div className={classNames(styles.panel, isExiting && styles.panelExit)}>
        <header className={styles.topRow}>
          <Link href="/" className={styles.brand}>
            ISAAC SEILER
          </Link>

          <div className={styles.modeToggle}>
            <button
              type="button"
              className={classNames(styles.toggle, mode === "projects" && styles.active)}
              onClick={() => onModeChange("projects")}
            >
              List
            </button>
            <button
              type="button"
              className={classNames(styles.toggle, mode === "feed" && styles.active)}
              onClick={() => onModeChange("feed")}
            >
              Slider
            </button>
          </div>

          <nav className={styles.nav}>
            <button type="button" onClick={() => runMenuTransition(() => router.push("/about"))}>
              About
            </button>
            <button type="button" onClick={() => runMenuTransition(() => router.push("/playground"))}>
              Photos
            </button>
            <button type="button" onClick={() => runMenuTransition(onOpenContact)}>
              Contact
            </button>
          </nav>
        </header>

        <div className={classNames(styles.main, isEntering && styles.mainEnter)}>{children}</div>
      </div>
    </div>
  );
}
