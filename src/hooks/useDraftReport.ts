import { useCallback, useMemo, useState } from 'react';
import type { Butterfly } from '../types/models';

export interface DraftLine {
  species: Butterfly;
  count: number;
}

export interface DraftReport {
  /** Species added so far, in the order they were first added. */
  lines: DraftLine[];
  totalIndividuals: number;
  add: (species: Butterfly, count: number) => void;
  setCount: (speciesId: number, count: number) => void;
  remove: (speciesId: number) => void;
  clear: () => void;
}

/**
 * The in-progress visit: species tapped so far, before the report is saved.
 * Adding a species already on the list bumps its count rather than duplicating.
 */
export function useDraftReport(): DraftReport {
  const [lines, setLines] = useState<DraftLine[]>([]);

  const add = useCallback((species: Butterfly, count: number) => {
    setLines((current) => {
      const existing = current.find((l) => l.species.id === species.id);
      if (existing) {
        return current.map((l) =>
          l.species.id === species.id ? { ...l, count: l.count + count } : l,
        );
      }
      return [...current, { species, count }];
    });
  }, []);

  const setCount = useCallback((speciesId: number, count: number) => {
    setLines((current) =>
      count <= 0
        ? current.filter((l) => l.species.id !== speciesId)
        : current.map((l) => (l.species.id === speciesId ? { ...l, count } : l)),
    );
  }, []);

  const remove = useCallback((speciesId: number) => {
    setLines((current) => current.filter((l) => l.species.id !== speciesId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totalIndividuals = useMemo(() => lines.reduce((sum, l) => sum + l.count, 0), [lines]);

  return { lines, totalIndividuals, add, setCount, remove, clear };
}
