"use client";

import Modal from "./Modal";
import { SITE } from "@/lib/content";
import styles from "./ContactModal.module.scss";

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const contactFormEmbedUrl = SITE.contactFormEmbedUrl;

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Contact</p>
          <h2>Get in touch</h2>
        </header>

        <div className={styles.row}>
          <span>Email</span>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>

        <div className={styles.links}>
          <a href={SITE.linkedinUrl} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href={SITE.githubUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={SITE.resumePdfPath} target="_blank" rel="noreferrer">
            Resume
          </a>
        </div>

        {contactFormEmbedUrl ? (
          <div className={styles.embedWrap}>
            <iframe title="Contact form" src={contactFormEmbedUrl} loading="lazy" className={styles.embed} />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
