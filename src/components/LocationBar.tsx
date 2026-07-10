import type { GeoState } from '../hooks/useGeolocation';
import styles from './LocationBar.module.css';

interface Props {
  geo: GeoState;
}

function headline(geo: GeoState): string {
  if (geo.gridRef) return geo.gridRef.text;
  switch (geo.status) {
    case 'locating':
      return 'Locating…';
    case 'denied':
      return 'Location blocked';
    case 'unavailable':
      return 'No location';
    case 'error':
      return 'Location error';
    default:
      return '—';
  }
}

function detail(geo: GeoState): string {
  if (geo.status === 'denied') return 'Allow location access to capture a grid reference.';
  if (geo.status === 'error' && geo.error) return geo.error;
  if (geo.latitude != null && geo.longitude != null) {
    const acc = geo.accuracyM != null ? ` · ±${Math.round(geo.accuracyM)} m` : '';
    return `${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}${acc}`;
  }
  if (geo.status === 'locating') return 'Reading GPS…';
  return 'Waiting for a fix';
}

export function LocationBar({ geo }: Props): React.ReactElement {
  const outsideGrid = geo.status === 'ready' && !geo.gridRef;

  return (
    <section className={styles.bar} aria-label="Your location">
      <div className={styles.main}>
        <span className={styles.label}>Grid reference</span>
        <strong className={styles.gridref} data-locating={geo.status === 'locating'}>
          {headline(geo)}
        </strong>
        <span className={styles.detail}>
          {outsideGrid ? 'Outside the British National Grid' : detail(geo)}
        </span>
      </div>
      <button
        type="button"
        className={styles.refresh}
        onClick={geo.refresh}
        aria-label="Update location"
        title="Update location"
      >
        ⟳
      </button>
    </section>
  );
}
