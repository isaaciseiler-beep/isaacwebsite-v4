"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ContactModal from "@/components/ContactModal";
import { SITE } from "@/lib/content";
import styles from "./page.module.scss";

const CONTACT_EVENT = "site:open-contact";

export default function AboutPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const paragraphs = useMemo(
    () => SITE.aboutMarkdown.split("\n\n").map((paragraph) => paragraph.trim()).filter(Boolean),
    []
  );

  useEffect(() => {
    const onOpenContact = () => {
      setContactOpen(true);
    };

    window.addEventListener(CONTACT_EVENT, onOpenContact);
    return () => window.removeEventListener(CONTACT_EVENT, onOpenContact);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          ISAAC SEILER
        </Link>

        <nav>
          <Link href="/about">About</Link>
          <Link href="/playground">Playground</Link>
          <button type="button" onClick={() => setContactOpen(true)}>
            Contact
          </button>
        </nav>
      </header>

      <main className={styles.main} id="about-overview">
        <p className={styles.kicker}>About</p>
        <h1 className={styles.title}>Short bio and current focus.</h1>
        <div className={styles.copy}>
          {paragraphs.map((paragraph, index) => (
            <p key={paragraph} id={`about-bio-${String(index + 1).padStart(2, "0")}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </main>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
