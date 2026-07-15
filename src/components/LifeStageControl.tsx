import type { LifeStage } from '../types/models';
import styles from './LifeStageControl.module.css';

interface Props {
  value: LifeStage | null;
  onChange: (stage: LifeStage | null) => void;
  speciesName: string;
}

// Friendly labels for the parents; the export maps larva→Larva, pupa→Pupa.
const OPTIONS: Array<{ stage: LifeStage; label: string }> = [
  { stage: 'adult', label: 'Adult' },
  { stage: 'egg', label: 'Egg' },
  { stage: 'larva', label: 'Caterpillar' },
  { stage: 'pupa', label: 'Chrysalis' },
];

/** Life-stage picker. Adult is the default (null is treated as adult). */
export function LifeStageControl({ value, onChange, speciesName }: Props): React.ReactElement {
  const current = value ?? 'adult';

  return (
    <div className={styles.control} role="group" aria-label={`Life stage of ${speciesName}`}>
      <span className={styles.label}>Stage</span>
      <div className={styles.options}>
        {OPTIONS.map(({ stage, label }) => (
          <button
            key={stage}
            type="button"
            className={styles.option}
            data-selected={current === stage}
            aria-pressed={current === stage}
            // Adult is the implicit default, so store it as null to keep rows clean.
            onClick={() => onChange(stage === 'adult' ? null : stage)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
