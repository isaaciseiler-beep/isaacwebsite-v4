"use client";

import Image from "next/image";
import Modal from "./Modal";
import { ProjectCarouselItem } from "@/lib/content";
import styles from "./ProjectPopup.module.scss";

type ProjectPopupProps = {
  project: ProjectCarouselItem | null;
  onClose: () => void;
};

export default function ProjectPopup({ project, onClose }: ProjectPopupProps) {
  return (
    <Modal open={Boolean(project)} onClose={onClose}>
      {project ? (
        <article className={styles.wrap}>
          <div className={styles.imageWrap}>
            <Image src={project.insideImage} alt={project.title} fill sizes="(max-width: 1000px) 92vw, 920px" className={styles.image} />
          </div>

          <p className={styles.source}>{project.source}</p>
          <h2 className={styles.title}>{project.title}</h2>

          {project.modalContent.paragraphs.map((paragraph) => (
            <p key={paragraph} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}

          {project.modalContent.sectionTitles.length > 0 ? (
            <div className={styles.sections}>
              {project.modalContent.sectionTitles.map((title) => (
                <h3 key={title}>{title}</h3>
              ))}
            </div>
          ) : null}

          {project.modalContent.bullets.length > 0 ? (
            <ul className={styles.bullets}>
              {project.modalContent.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          {project.modalContent.links.length > 0 ? (
            <div className={styles.links}>
              {project.modalContent.links.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </article>
      ) : null}
    </Modal>
  );
}
