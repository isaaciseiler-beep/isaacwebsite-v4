"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FeedItem, LINKEDIN_POSTS, PROJECT_CAROUSEL_ITEMS } from "@/lib/content";
import ContactModal from "@/components/ContactModal";
import FeedCarousel from "@/components/FeedCarousel";
import ProjectPopup from "@/components/ProjectPopup";
import ProjectsList from "@/components/ProjectsList";
import SitePanelShell from "@/components/SitePanelShell";
import styles from "./page.module.scss";

type Mode = "feed" | "projects";
const CONTACT_EVENT = "site:open-contact";

function HomePageContent() {
  const searchParams = useSearchParams();
  const feedItems = useMemo<FeedItem[]>(() => LINKEDIN_POSTS.map((item) => ({ ...item, type: "linkedin" as const })), []);

  const [mode, setMode] = useState<Mode>("feed");
  const [feedIndex, setFeedIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

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
          setProjectIndex((previous) => (previous - 1 + PROJECT_CAROUSEL_ITEMS.length) % PROJECT_CAROUSEL_ITEMS.length);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setProjectIndex((previous) => (previous + 1) % PROJECT_CAROUSEL_ITEMS.length);
        }
        if (event.key === "Enter") {
          event.preventDefault();
          setActiveProjectSlug(PROJECT_CAROUSEL_ITEMS[projectIndex].slug);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [feedItems.length, mode, projectIndex]);

  const activeProject = PROJECT_CAROUSEL_ITEMS.find((project) => project.slug === activeProjectSlug) ?? null;

  return (
    <>
      <SitePanelShell mode={mode} onModeChange={setMode} onOpenContact={() => setContactOpen(true)}>
        {mode === "feed" ? (
          <div className={styles.feedPane}>
            <FeedCarousel
              items={feedItems}
              index={feedIndex}
              onIndexChange={setFeedIndex}
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
            projects={PROJECT_CAROUSEL_ITEMS}
            selectedIndex={projectIndex}
            onSelect={setProjectIndex}
            onOpenProject={(slug) => setActiveProjectSlug(slug)}
          />
        )}
      </SitePanelShell>

      <span id="contact" className="srOnly" aria-hidden="true" />
      <p className="srOnly" aria-live="polite">
        {announcement}
      </p>
      <ProjectPopup project={activeProject} onClose={() => setActiveProjectSlug(null)} />
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
