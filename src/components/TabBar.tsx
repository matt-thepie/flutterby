import styles from './TabBar.module.css';

export type Tab = 'log' | 'reports' | 'identify';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  reportCount: number;
}

export function TabBar({ active, onChange, reportCount }: Props): React.ReactElement {
  return (
    <nav className={styles.tabs} aria-label="Sections">
      <button
        type="button"
        className={styles.tab}
        aria-current={active === 'log' ? 'page' : undefined}
        onClick={() => onChange('log')}
      >
        Log
      </button>
      <button
        type="button"
        className={styles.tab}
        aria-current={active === 'reports' ? 'page' : undefined}
        onClick={() => onChange('reports')}
      >
        Reports
        {reportCount > 0 && <span className={styles.count}>{reportCount}</span>}
      </button>
      <button
        type="button"
        className={styles.tab}
        aria-current={active === 'identify' ? 'page' : undefined}
        onClick={() => onChange('identify')}
      >
        Identify
      </button>
    </nav>
  );
}
