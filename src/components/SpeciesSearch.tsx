import { useId, useMemo, useState } from 'react';
import type { Butterfly } from '../types/models';
import { LogControls } from './LogControls';
import styles from './SpeciesSearch.module.css';

interface Props {
  species: Butterfly[];
  onLog: (species: Butterfly, count: number) => void;
}

export function SpeciesSearch({ species, onLog }: Props): React.ReactElement {
  const [query, setQuery] = useState('');
  const inputId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return species
      .filter(
        (s) =>
          s.commonName.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [query, species]);

  return (
    <div className={styles.search}>
      <label htmlFor={inputId} className={styles.label}>
        Find any British butterfly
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="search"
        inputMode="search"
        placeholder="Search by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />

      {query.trim() && (
        <ul className={styles.results}>
          {results.length === 0 ? (
            <li className={styles.empty}>No matches</li>
          ) : (
            results.map((s) => (
              <li key={s.id} className={styles.result}>
                <div className={styles.info}>
                  <span className={styles.resultName}>{s.commonName}</span>
                  <span className={styles.resultScientific}>{s.scientificName}</span>
                </div>
                <LogControls
                  speciesName={s.commonName}
                  onLog={(count) => {
                    onLog(s, count);
                    setQuery('');
                  }}
                />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
