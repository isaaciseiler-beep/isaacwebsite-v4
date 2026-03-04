"use client";

import { ProjectCarouselItem } from "@/lib/content";
import styles from "./ProjectsList.module.scss";

type ProjectsListProps = {
  projects: ProjectCarouselItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpenProject: (slug: string) => void;
};

export default function ProjectsList({ projects, selectedIndex, onSelect, onOpenProject }: ProjectsListProps) {
  return (
    <div className={styles.grid}>
      {projects.map((project, index) => (
        <article
          key={project.slug}
          className={styles.item}
          data-active={selectedIndex === index}
          onMouseEnter={() => onSelect(index)}
        >
          <button type="button" className={styles.mainButton} onClick={() => onSelect(index)}>
            <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.title}>{project.title}</span>
          </button>

          <div className={styles.meta}>
            <p>{project.source}</p>
            <button type="button" className={styles.openButton} onClick={() => onOpenProject(project.slug)}>
              open project
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
