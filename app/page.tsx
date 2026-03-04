"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FeedItem, Photo, PROJECTS, getFeedItems } from "@/lib/content";
import BackgroundCrossfade from "@/components/BackgroundCrossfade";
import ContactModal from "@/components/ContactModal";
import FeedCarousel from "@/components/FeedCarousel";
import Modal from "@/components/Modal";
import ProjectsList from "@/components/ProjectsList";
import SitePanelShell from "@/components/SitePanelShell";
import styles from "./page.module.scss";

type Mode = "feed" | "projects";

const toImageFromFeedItem = (item: FeedItem | undefined): string => {
  if (!item) {
    return PROJECTS[0]?.heroSrc ?? "/assets/photos/photo-01.jpg";
  }

  return item.type === "linkedin" ? item.coverSrc : item.src;
};

export default function HomePage() {
  const router = useRouter();
  const feedItems = useMemo(() => getFeedItems(), []);
  const photoItems = useMemo(() => feedItems.filter((item): item is Photo & { type: "photo" } => item.type === "photo"), [feedItems]);

  const [mode, setMode] = useState<Mode>("feed");
  const [feedIndex, setFeedIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);

  const activeBackground = mode === "feed" ? toImageFromFeedItem(feedItems[feedIndex]) : PROJECTS[projectIndex].heroSrc;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) {
        return;
      }

      if (event.key === "Escape" && lightboxPhotoId) {
        setLightboxPhotoId(null);
        return;
      }

      if (mode === "feed") {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setFeedIndex((previous) => (previous - 1 + feedItems.length) % feedItems.length);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setFeedIndex((previous) => (previous + 1) % feedItems.length);
        }
      }

      if (mode === "projects") {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setProjectIndex((previous) => (previous - 1 + PROJECTS.length) % PROJECTS.length);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setProjectIndex((previous) => (previous + 1) % PROJECTS.length);
        }
        if (event.key === "Enter") {
          event.preventDefault();
          router.push(`/case-study/${PROJECTS[projectIndex].slug}`);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [feedItems.length, lightboxPhotoId, mode, projectIndex, router]);

  const activePhoto = photoItems.find((photo) => photo.id === lightboxPhotoId) ?? null;

  const stepPhoto = (direction: 1 | -1) => {
    if (!activePhoto || photoItems.length <= 1) {
      return;
    }

    const currentIndex = photoItems.findIndex((photo) => photo.id === activePhoto.id);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = (currentIndex + direction + photoItems.length) % photoItems.length;
    setLightboxPhotoId(photoItems[nextIndex].id);
  };

  return (
    <>
      <BackgroundCrossfade imageSrc={activeBackground} />

      <SitePanelShell mode={mode} onModeChange={setMode} onOpenContact={() => setContactOpen(true)}>
        {mode === "feed" ? (
          <div className={styles.feedPane}>
            <FeedCarousel
              items={feedItems}
              index={feedIndex}
              onIndexChange={setFeedIndex}
              onOpenPhoto={(photo) => setLightboxPhotoId(photo.id)}
            />

            <div className={styles.feedMeta}>
              <div className={styles.dots}>
                {Array.from({ length: 3 }).map((_, dotIndex) => (
                  <span key={dotIndex} data-active={feedIndex % 3 === dotIndex} />
                ))}
              </div>

              <p>
                {String(feedIndex + 1).padStart(2, "0")} / {String(feedItems.length).padStart(2, "0")}
              </p>
            </div>
          </div>
        ) : (
          <ProjectsList
            projects={PROJECTS}
            selectedIndex={projectIndex}
            onSelect={setProjectIndex}
            onOpenProject={(slug) => router.push(`/case-study/${slug}`)}
          />
        )}
      </SitePanelShell>

      <Modal open={Boolean(activePhoto)} onClose={() => setLightboxPhotoId(null)}>
        {activePhoto ? (
          <div className={styles.lightbox}>
            <div className={styles.lightboxImageWrap}>
              <Image src={activePhoto.src} alt={activePhoto.alt} fill sizes="(max-width: 1200px) 92vw, 1000px" />
            </div>
            <p>
              {activePhoto.location} • {activePhoto.album}
              {activePhoto.takenDate ? ` • ${new Date(activePhoto.takenDate).toLocaleDateString()}` : ""}
            </p>
            <div className={styles.lightboxActions}>
              <button type="button" onClick={() => stepPhoto(-1)}>
                prev
              </button>
              <button type="button" onClick={() => stepPhoto(1)}>
                next
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
