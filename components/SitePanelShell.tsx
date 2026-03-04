"use client";

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
  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <header className={styles.topRow}>
          <p className={styles.brand}>ISAAC SEILER</p>

          <div className={styles.modeToggle}>
            <button
              type="button"
              className={classNames(styles.toggle, mode === "projects" && styles.active)}
              onClick={() => onModeChange("projects")}
            >
              Projects
            </button>
            <button
              type="button"
              className={classNames(styles.toggle, mode === "feed" && styles.active)}
              onClick={() => onModeChange("feed")}
            >
              Feed
            </button>
          </div>

          <nav className={styles.nav}>
            <Link href="/about">About</Link>
            <Link href="/playground">Playground</Link>
            <button type="button" onClick={onOpenContact}>
              Contact
            </button>
          </nav>
        </header>

        <div className={styles.main}>{children}</div>
      </div>
    </div>
  );
}
