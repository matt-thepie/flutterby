import { useEffect, useRef } from 'react';
import styles from './LocationModal.module.css';

interface Props {
  onAllow: () => void;
  onDecline: () => void;
}

/**
 * Our own explanation shown BEFORE the browser's location permission prompt —
 * so the scary system dialog arrives with context, from a deliberate tap.
 */
export function LocationModal({ onAllow, onDecline }: Props): React.ReactElement {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-labelledby="loc-title"
      onCancel={(e) => {
        e.preventDefault();
        onDecline();
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        📍
      </span>
      <h2 id="loc-title" className={styles.title}>
        Stamp your sightings with a grid reference?
      </h2>
      <p className={styles.copy}>
        Flutterby can work out the Ordnance Survey grid reference for the exact spot you're
        standing on, so every report says <em>where</em> as well as <em>what</em>. Your location is
        only read while you're recording, and only the grid reference and coordinates you save
        leave the device.
      </p>
      <p className={styles.copy}>
        Your browser will ask to confirm — choose <strong>Allow</strong>.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.allow} onClick={onAllow}>
          Use my location
        </button>
        <button type="button" className={styles.decline} onClick={onDecline}>
          I'll type grid refs by hand
        </button>
      </div>
    </dialog>
  );
}
