"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedItem, PROJECTS, getFeedItems } from "@/lib/content";
import BackgroundCrossfade from "@/components/BackgroundCrossfade";
import ContactModal from "@/components/ContactModal";
import FeedCarousel from "@/components/FeedCarousel";
import ProjectsList from "@/components/ProjectsList";
import SitePanelShell from "@/components/SitePanelShell";
import styles from "./page.module.scss";

type Mode = "feed" | "projects";
const CONTACT_EVENT = "site:open-contact";

const toImageFromFeedItem = (item: FeedItem | undefined): string => {
  if (!item) {
    return PROJECTS[0]?.heroSrc ?? "/assets/photos/photo-01.jpg";
  }

  return item.type === "linkedin" ? item.coverSrc : item.src;
};

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedItems = useMemo(() => getFeedItems(), []);

  const [mode, setMode] = useState<Mode>("feed");
  const [feedIndex, setFeedIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const activeBackground = mode === "feed" ? toImageFromFeedItem(feedItems[feedIndex]) : PROJECTS[projectIndex].heroSrc;

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

  useEffect(() => {
    const feedId = searchParams.get("feed");
    if (!feedId) {
      return;
    }

    const indexFromQuery = feedItems.findIndex((item) => item.id === feedId);
    if (indexFromQuery < 0) {
      return;
    }

    const selectedItem = feedItems[indexFromQuery];
    const label = selectedItem.type === "linkedin" ? selectedItem.title : selectedItem.location;
    const frame = window.requestAnimationFrame(() => {
      setMode("feed");
      setFeedIndex(indexFromQuery);
      setAnnouncement(`Opened feed item ${label}`);
      document.getElementById(`feed-${feedId}`)?.scrollIntoView({ block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [feedItems, searchParams]);

  useEffect(() => {
    if (!announcement) {
      return;
    }

    const timeout = window.setTimeout(() => setAnnouncement(""), 1200);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) {
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
  }, [feedItems.length, mode, projectIndex, router]);

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
              onOpenPhoto={(photo) => router.push(`/playground?photo=${encodeURIComponent(photo.id)}`)}
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

      <span id="contact" className="srOnly" aria-hidden="true" />
      <p className="srOnly" aria-live="polite">
        {announcement}
      </p>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
