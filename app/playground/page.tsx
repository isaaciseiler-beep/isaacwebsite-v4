"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ContactModal from "@/components/ContactModal";
import PlaygroundAlbumCanvas from "@/components/PlaygroundAlbumCanvas";
import { PHOTOS } from "@/lib/content";
import styles from "./page.module.scss";

const CONTACT_EVENT = "site:open-contact";

function PlaygroundPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [contactOpen, setContactOpen] = useState(false);
  const photoFromParams = searchParams.get("photo");

  useEffect(() => {
    const onOpenContact = () => {
      setContactOpen(true);
    };

    window.addEventListener(CONTACT_EVENT, onOpenContact);
    return () => window.removeEventListener(CONTACT_EVENT, onOpenContact);
  }, []);

  useEffect(() => {
    if (searchParams.get("contact") !== "open") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setContactOpen(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [searchParams]);

  const syncPhotoQuery = useCallback(
    (photoId: string | null) => {
      const current = searchParams.get("photo");
      if ((current ?? null) === photoId) {
        return;
      }

      const next = new URLSearchParams(searchParams.toString());

      if (photoId) {
        next.set("photo", photoId);
      } else {
        next.delete("photo");
      }

      const nextQuery = next.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

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

      <PlaygroundAlbumCanvas photos={PHOTOS} initialPhotoId={photoFromParams} onActivePhotoChange={syncPhotoQuery} />

      <span id="contact" className="srOnly" aria-hidden="true" />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={null}>
      <PlaygroundPageContent />
    </Suspense>
  );
}
