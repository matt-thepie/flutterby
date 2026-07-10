import type { Sighting } from '../types/models';
import styles from './RecentSightings.module.css';

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

interface Props {
  sightings: Sighting[];
  onDelete: (id: string) => void;
}

export function RecentSightings({ sightings, onDelete }: Props): React.ReactElement {
  if (sightings.length === 0) {
    return <p className={styles.empty}>No sightings yet — tap a butterfly above to log your first.</p>;
  }

  return (
    <ul className={styles.list}>
      {sightings.map((s) => {
        const when = new Date(s.observedAt);
        return (
          <li key={s.id} className={styles.item}>
            <span className={styles.count}>{s.count}×</span>
            <div className={styles.body}>
              <span className={styles.species}>{s.commonName}</span>
              <span className={styles.meta}>
                {s.gridRef ?? 'no grid ref'} · {dateFmt.format(when)} {timeFmt.format(when)}
              </span>
            </div>
            <button
              type="button"
              className={styles.remove}
              onClick={() => onDelete(s.id)}
              aria-label={`Remove ${s.count} ${s.commonName}`}
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
