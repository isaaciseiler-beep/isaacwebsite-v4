"use client";

import { useState } from "react";
import Link from "next/link";
import ContactModal from "@/components/ContactModal";
import PlaygroundAlbumCanvas from "@/components/PlaygroundAlbumCanvas";
import { PHOTOS } from "@/lib/content";
import styles from "./page.module.scss";

export default function PlaygroundPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          ISAAC SEILER
        </Link>

        <div className={styles.titleWrap}>
          <p className={styles.pageTitle}>PLAYGROUND</p>
          <p className={styles.pageSubtitle}>photo album</p>
        </div>

        <nav className={styles.links}>
          <Link href="/about">About</Link>
          <Link href="/playground">Playground</Link>
          <button type="button" onClick={() => setContactOpen(true)}>
            Contact
          </button>
        </nav>
      </header>

      <PlaygroundAlbumCanvas photos={PHOTOS} />

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
