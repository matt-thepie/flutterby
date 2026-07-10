import { useState } from 'react';
import styles from './LogControls.module.css';

interface Props {
  speciesName: string;
  onLog: (count: number) => void;
}

/** A count stepper plus a log button, shared by the grid cards and search results. */
export function LogControls({ speciesName, onLog }: Props): React.ReactElement {
  const [count, setCount] = useState(1);

  const commit = (): void => {
    onLog(count);
    setCount(1);
  };

  return (
    <div className={styles.controls}>
      <div className={styles.stepper} role="group" aria-label={`Count of ${speciesName}`}>
        <button
          type="button"
          className={styles.step}
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          disabled={count <= 1}
          aria-label="One fewer"
        >
          −
        </button>
        <output className={styles.count} aria-live="polite">
          {count}
        </output>
        <button
          type="button"
          className={styles.step}
          onClick={() => setCount((c) => Math.min(9999, c + 1))}
          aria-label="One more"
        >
          +
        </button>
      </div>
      <button type="button" className={styles.log} onClick={commit}>
        Log {count}
      </button>
    </div>
  );
}
