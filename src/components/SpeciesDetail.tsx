import { useEffect, useRef, useState } from 'react';
import type { Butterfly } from '../types/models';
import { FEATURES_BY_SCI } from '../lib/idguide/features';
import styles from './SpeciesDetail.module.css';

interface Props {
  species: Butterfly;
  onClose: () => void;
  onLog?: (species: Butterfly) => void;
}

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const SIZE_LABEL: Record<string, string> = { small: 'Small', medium: 'Medium', large: 'Large' };
const pretty = (t: string): string => t.replace(/_/g, ' ');

export function SpeciesDetail({ species, onClose, onLog }: Props): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [lightbox, setLightbox] = useState(false);
  const features = FEATURES_BY_SCI.get(species.scientificName);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby="detail-title"
      onCancel={(e) => {
        e.preventDefault();
        if (lightbox) setLightbox(false);
        else onClose();
      }}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>

      {species.imageUrl ? (
        <button
          type="button"
          className={styles.hero}
          onClick={() => setLightbox(true)}
          aria-label="Enlarge photo"
        >
          <img className={styles.heroImage} src={species.imageUrl} alt={species.commonName} />
          <span className={styles.zoomHint} aria-hidden="true">
            ⤢
          </span>
        </button>
      ) : (
        <div className={styles.hero}>
          <span className={styles.placeholder} aria-hidden="true">
            🦋
          </span>
        </div>
      )}

      <div className={styles.header}>
        <h2 id="detail-title" className={styles.name}>
          {species.commonName}
        </h2>
        <p className={styles.scientific}>{species.scientificName}</p>
        <p className={styles.meta}>
          {species.family}
          {species.status ? ` · ${species.status}` : ''}
        </p>
      </div>

      {features ? (
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Flight period</dt>
            <dd>
              <ol className={styles.monthStrip} aria-label="Months seen on the wing">
                {MONTH_INITIALS.map((initial, i) => (
                  <li
                    key={i}
                    className={styles.month}
                    data-on={features.flightMonths.includes(i + 1)}
                  >
                    {initial}
                  </li>
                ))}
              </ol>
            </dd>
          </div>

          <div className={styles.fact}>
            <dt>Size</dt>
            <dd>
              {SIZE_LABEL[features.sizeClass]} · {features.wingspanMm[0]}–{features.wingspanMm[1]} mm
              wingspan
            </dd>
          </div>

          <div className={styles.fact}>
            <dt>Colours</dt>
            <dd className={styles.chips}>
              {features.colours.map((c) => (
                <span key={c} className={styles.chip}>
                  {c}
                </span>
              ))}
            </dd>
          </div>

          <div className={styles.fact}>
            <dt>Markings</dt>
            <dd className={styles.chips}>
              {features.markings.map((m) => (
                <span key={m} className={styles.chip}>
                  {pretty(m)}
                </span>
              ))}
            </dd>
          </div>

          <div className={styles.fact}>
            <dt>Habitat</dt>
            <dd className={styles.chips}>
              {features.habitats.map((h) => (
                <span key={h} className={styles.chip}>
                  {pretty(h)}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      ) : (
        <p className={styles.noFeatures}>No detailed feature data for this species yet.</p>
      )}

      <div className={styles.actions}>
        {onLog && (
          <button
            type="button"
            className={styles.logButton}
            onClick={() => {
              onLog(species);
              onClose();
            }}
          >
            Log this
          </button>
        )}
      </div>

      {lightbox && species.imageUrl && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-label={`${species.commonName} enlarged`}
          onClick={() => setLightbox(false)}
        >
          <img className={styles.lightboxImage} src={species.imageUrl} alt={species.commonName} />
          <button type="button" className={styles.lightboxClose} aria-label="Close photo">
            ✕
          </button>
        </div>
      )}
    </dialog>
  );
}
