import { useState } from 'react';
import type { GridSpecies } from '../types/models';
import { LogControls } from './LogControls';
import styles from './ButterflyCard.module.css';

interface Props {
  species: GridSpecies;
  onLog: (count: number) => void;
}

export function ButterflyCard({ species, onLog }: Props): React.ReactElement {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(species.imageUrl) && !imageFailed;

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {showImage ? (
          <img
            className={styles.image}
            src={species.imageUrl ?? ''}
            alt={species.commonName}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className={styles.placeholder} aria-hidden="true">
            🦋
          </span>
        )}
        {typeof species.total === 'number' && species.total > 0 && (
          <span className={styles.badge}>{species.total} logged</span>
        )}
      </div>
      <h3 className={styles.name}>{species.commonName}</h3>
      <p className={styles.scientific}>{species.scientificName}</p>
      <LogControls speciesName={species.commonName} onLog={onLog} />
    </article>
  );
}
