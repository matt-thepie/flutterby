import type { Sex } from '../types/models';
import styles from './SexControl.module.css';

interface Props {
  value: Sex | null;
  onChange: (sex: Sex | null) => void;
  speciesName: string;
}

/** Optional male/female toggle for a butterfly. Tap a selected one to clear it. */
export function SexControl({ value, onChange, speciesName }: Props): React.ReactElement {
  const toggle = (sex: Sex): void => onChange(value === sex ? null : sex);

  return (
    <div className={styles.control} role="group" aria-label={`Sex of ${speciesName}`}>
      <span className={styles.label}>Sex</span>
      <button
        type="button"
        className={styles.option}
        data-selected={value === 'male'}
        aria-pressed={value === 'male'}
        onClick={() => toggle('male')}
        title="Male"
      >
        ♂
      </button>
      <button
        type="button"
        className={styles.option}
        data-selected={value === 'female'}
        aria-pressed={value === 'female'}
        onClick={() => toggle('female')}
        title="Female"
      >
        ♀
      </button>
    </div>
  );
}
