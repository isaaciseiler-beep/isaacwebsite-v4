"use client";

import styles from "./FilterOverlay.module.scss";

type FilterOverlayProps = {
  open: boolean;
  locations: string[];
  selected: string[];
  onToggle: (location: string) => void;
  onClose: () => void;
  onClear: () => void;
};

export default function FilterOverlay({ open, locations, selected, onToggle, onClose, onClear }: FilterOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.top}>
          <p>locations</p>
          <button type="button" onClick={onClose}>
            close
          </button>
        </div>

        <div className={styles.options}>
          {locations.map((location) => {
            const checked = selected.includes(location);
            return (
              <label key={location} className={styles.option}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(location)} />
                <span>{location}</span>
              </label>
            );
          })}
        </div>

        <button type="button" className={styles.clear} onClick={onClear}>
          clear filters
        </button>
      </div>
    </div>
  );
}
