import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Butterfly, Sex } from '../types/models';
import type { ReportMeta } from '../components/ReportDetails';
import { toDateInput, toTimeInput } from '../lib/datetime';

export interface DraftLine {
  species: Butterfly;
  count: number;
  notes?: string;
  sex?: Sex | null;
}

export interface DraftReport {
  /** Species added so far, in the order they were first added. */
  lines: DraftLine[];
  meta: ReportMeta;
  /** When this visit's draft was started (first interaction). */
  startedAt: string | null;
  totalIndividuals: number;
  setMeta: (meta: ReportMeta) => void;
  add: (species: Butterfly, count: number) => void;
  setCount: (speciesId: number, count: number) => void;
  setNotes: (speciesId: number, notes: string) => void;
  setSex: (speciesId: number, sex: Sex | null) => void;
  remove: (speciesId: number) => void;
  clear: () => void;
}

const KEY = 'flutterby.draft';

interface StoredDraft {
  lines: DraftLine[];
  meta: ReportMeta;
  startedAt: string | null;
}

export function freshMeta(): ReportMeta {
  const now = new Date();
  return {
    date: toDateInput(now),
    time: toTimeInput(now),
    gridRef: '',
    locationName: '',
    recorderName: localStorage.getItem('flutterby.recorderName') ?? '',
  };
}

function load(): StoredDraft {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null') as StoredDraft | null;
    if (stored && Array.isArray(stored.lines)) {
      return { ...stored, meta: { ...freshMeta(), ...stored.meta } };
    }
  } catch {
    /* corrupted draft — start clean */
  }
  return { lines: [], meta: freshMeta(), startedAt: null };
}

/**
 * The in-progress visit: species tapped so far plus the visit details, before
 * the report is marked done. Persisted to localStorage on every change so a
 * closed tab, dead battery or lost signal doesn't lose the visit.
 */
export function useDraftReport(): DraftReport {
  const [draft, setDraft] = useState<StoredDraft>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(draft));
  }, [draft]);

  const touch = (d: StoredDraft): StoredDraft => ({
    ...d,
    startedAt: d.startedAt ?? new Date().toISOString(),
  });

  const setMeta = useCallback((meta: ReportMeta) => {
    setDraft((d) => touch({ ...d, meta }));
  }, []);

  const add = useCallback((species: Butterfly, count: number) => {
    setDraft((d) => {
      const existing = d.lines.find((l) => l.species.id === species.id);
      const lines = existing
        ? d.lines.map((l) => (l.species.id === species.id ? { ...l, count: l.count + count } : l))
        : [...d.lines, { species, count }];
      return touch({ ...d, lines });
    });
  }, []);

  const setCount = useCallback((speciesId: number, count: number) => {
    setDraft((d) => ({
      ...d,
      lines:
        count <= 0
          ? d.lines.filter((l) => l.species.id !== speciesId)
          : d.lines.map((l) => (l.species.id === speciesId ? { ...l, count } : l)),
    }));
  }, []);

  const setNotes = useCallback((speciesId: number, notes: string) => {
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((l) => (l.species.id === speciesId ? { ...l, notes } : l)),
    }));
  }, []);

  const setSex = useCallback((speciesId: number, sex: Sex | null) => {
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((l) => (l.species.id === speciesId ? { ...l, sex } : l)),
    }));
  }, []);

  const remove = useCallback((speciesId: number) => {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.species.id !== speciesId) }));
  }, []);

  const clear = useCallback(() => {
    setDraft({ lines: [], meta: freshMeta(), startedAt: null });
  }, []);

  const totalIndividuals = useMemo(
    () => draft.lines.reduce((sum, l) => sum + l.count, 0),
    [draft.lines],
  );

  return {
    lines: draft.lines,
    meta: draft.meta,
    startedAt: draft.startedAt,
    totalIndividuals,
    setMeta,
    add,
    setCount,
    setNotes,
    setSex,
    remove,
    clear,
  };
}
