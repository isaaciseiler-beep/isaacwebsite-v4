"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project } from "@/lib/content";
import { getProjectBlockAnchor, getProjectSummaryAnchor } from "@/lib/search/index";
import ContactModal from "./ContactModal";
import styles from "./CaseStudy.module.scss";

type CaseStudyProps = {
  project: Project;
  previousSlug: string;
  nextSlug: string;
};

const CONTACT_EVENT = "site:open-contact";

export default function CaseStudy({ project, previousSlug, nextSlug }: CaseStudyProps) {
  const router = useRouter();
  const [scrollPercent, setScrollPercent] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.round((window.scrollY / max) * 100);
      setScrollPercent(Math.min(100, Math.max(0, progress)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (navigatingRef.current) {
        return;
      }

      const atTop = window.scrollY <= 1;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;

      if (event.deltaY < -7 && atTop) {
        navigatingRef.current = true;
        router.push(`/case-study/${previousSlug}`);
        window.setTimeout(() => {
          navigatingRef.current = false;
        }, 800);
      }

      if (event.deltaY > 7 && atBottom) {
        navigatingRef.current = true;
        router.push(`/case-study/${nextSlug}`);
        window.setTimeout(() => {
          navigatingRef.current = false;
        }, 800);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [nextSlug, previousSlug, router]);

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

      <main className={styles.main}>
        <section className={styles.hero} id={getProjectSummaryAnchor(project.slug)}>
          <h1>{project.title}</h1>
          <p>{project.intro}</p>
          <ul>
            {project.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </section>

        <section className={styles.stream}>
          {project.blocks.map((block, index) => {
            const blockAnchor = getProjectBlockAnchor(project.slug, index);

            if (block.type === "image") {
              return (
                <div className={styles.single} key={`${project.slug}-image-${index}`} id={blockAnchor}>
                  <Image
                    src={block.src}
                    alt={block.alt ?? project.title}
                    width={1600}
                    height={1000}
                    sizes="(max-width: 1200px) 92vw, 1100px"
                  />
                </div>
              );
            }

            if (block.type === "double") {
              return (
                <div className={styles.double} key={`${project.slug}-double-${index}`} id={blockAnchor}>
                  <Image
                    src={block.left.src}
                    alt={block.left.alt ?? project.title}
                    width={900}
                    height={900}
                    sizes="(max-width: 1200px) 92vw, 520px"
                  />
                  <Image
                    src={block.right.src}
                    alt={block.right.alt ?? project.title}
                    width={900}
                    height={900}
                    sizes="(max-width: 1200px) 92vw, 520px"
                  />
                </div>
              );
            }

            return (
              <blockquote className={styles.quote} key={`${project.slug}-quote-${index}`} id={blockAnchor}>
                <p>“{block.text}”</p>
                {block.attribution ? <cite>{block.attribution}</cite> : null}
              </blockquote>
            );
          })}
        </section>

        {project.links?.length ? (
          <section className={styles.links}>
            {project.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </section>
        ) : null}
      </main>

      <div className={styles.percent}>{scrollPercent} %</div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
