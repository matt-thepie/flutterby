import type { Butterfly, GridSpecies } from '../types/models';
import { ButterflyCard } from './ButterflyCard';
import styles from './ButterflyGrid.module.css';

interface Props {
  species: GridSpecies[];
  onLog: (species: Butterfly, count: number) => void;
}

export function ButterflyGrid({ species, onLog }: Props): React.ReactElement {
  return (
    <ul className={styles.grid}>
      {species.map((s) => (
        <li key={s.id} className={styles.cell}>
          <ButterflyCard species={s} onLog={(count) => onLog(s, count)} />
        </li>
      ))}
    </ul>
  );
}
