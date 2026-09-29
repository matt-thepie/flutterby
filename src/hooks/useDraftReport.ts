import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Butterfly, LifeStage, Sex, SightingPosition } from '../types/models';
import type { ReportMeta } from '../components/ReportDetails';
import { toDateInput, toTimeInput } from '../lib/datetime';
import { latLonToGridRef } from '../lib/osgrid';

export interface DraftLine {
  /** Local id — the same species can be logged at several spots. */
  id: string;
  species: Butterfly;
  count: number;
  notes?: string;
  sex?: Sex | null;
  lifeStage?: LifeStage | null;
  /** Where it was seen: the GPS fix when it was added. Null = no fix. */
  position: SightingPosition | null;
}

export interface DraftReport {
  /** Sightings added so far, in the order they were logged. */
  lines: DraftLine[];
  meta: ReportMeta;
  /** When this visit's draft was started (first interaction). */
  startedAt: string | null;
  totalIndividuals: number;
  speciesCount: number;
  setMeta: (meta: ReportMeta) => void;
  add: (species: Butterfly, count: number, position: SightingPosition | null) => void;
  setCount: (lineId: string, count: number) => void;
  setNotes: (lineId: string, notes: string) => void;
  setSex: (lineId: string, sex: Sex | null) => void;
  setLifeStage: (lineId: string, lifeStage: LifeStage | null) => void;
  setPosition: (lineId: string, position: SightingPosition | null) => void;
  remove: (lineId: string) => void;
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
      return {
        ...stored,
        // Drafts saved before per-sighting positions have neither field.
        lines: stored.lines.map((l) => ({
          ...l,
          id: l.id ?? crypto.randomUUID(),
          position: l.position ?? null,
        })),
        meta: { ...freshMeta(), ...stored.meta },
      };
    }
  } catch {
    /* corrupted draft — start clean */
  }
  return { lines: [], meta: freshMeta(), startedAt: null };
}

/** Compared at 10 m at finest: GPS jitter would split a 1 m ref between taps. */
function placeKey(p: SightingPosition): string | null {
  return p.latitude != null && p.longitude != null
    ? (latLonToGridRef(p.latitude, p.longitude, p.accuracyM, 4)?.text ?? p.gridRef)
    : p.gridRef;
}

/** Same spot = same grid square (10 m with a good fix), or both without a fix. */
function samePlace(a: SightingPosition | null, b: SightingPosition | null): boolean {
  if (!a || !b) return a === b;
  const key = placeKey(a);
  return key != null && key === placeKey(b);
}

/**
 * The in-progress visit: butterflies tapped so far, each with the position it
 * was logged at, plus the visit details, before the report is marked done.
 * Persisted to localStorage on every change so a closed tab, dead battery or
 * lost signal doesn't lose the visit.
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

  const patchLine = useCallback((lineId: string, patch: Partial<DraftLine>) => {
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    }));
  }, []);

  const add = useCallback(
    (species: Butterfly, count: number, position: SightingPosition | null) => {
      setDraft((d) => {
        // Another of the same species on the same spot tops up that sighting;
        // anywhere else it's a new sighting with its own position.
        const existing = d.lines.find(
          (l) => l.species.id === species.id && samePlace(l.position, position),
        );
        const lines = existing
          ? d.lines.map((l) => (l === existing ? { ...l, count: l.count + count } : l))
          : [...d.lines, { id: crypto.randomUUID(), species, count, position }];
        return touch({ ...d, lines });
      });
    },
    [],
  );

  const setCount = useCallback((lineId: string, count: number) => {
    setDraft((d) => ({
      ...d,
      lines:
        count <= 0
          ? d.lines.filter((l) => l.id !== lineId)
          : d.lines.map((l) => (l.id === lineId ? { ...l, count } : l)),
    }));
  }, []);

  const setNotes = useCallback(
    (lineId: string, notes: string) => patchLine(lineId, { notes }),
    [patchLine],
  );

  const setSex = useCallback(
    (lineId: string, sex: Sex | null) => patchLine(lineId, { sex }),
    [patchLine],
  );

  const setLifeStage = useCallback(
    (lineId: string, lifeStage: LifeStage | null) => patchLine(lineId, { lifeStage }),
    [patchLine],
  );

  const setPosition = useCallback(
    (lineId: string, position: SightingPosition | null) => patchLine(lineId, { position }),
    [patchLine],
  );

  const remove = useCallback((lineId: string) => {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== lineId) }));
  }, []);

  const clear = useCallback(() => {
    setDraft({ lines: [], meta: freshMeta(), startedAt: null });
  }, []);

  const totalIndividuals = useMemo(
    () => draft.lines.reduce((sum, l) => sum + l.count, 0),
    [draft.lines],
  );
  const speciesCount = useMemo(
    () => new Set(draft.lines.map((l) => l.species.id)).size,
    [draft.lines],
  );

  return {
    lines: draft.lines,
    meta: draft.meta,
    startedAt: draft.startedAt,
    totalIndividuals,
    speciesCount,
    setMeta,
    add,
    setCount,
    setNotes,
    setSex,
    setLifeStage,
    setPosition,
    remove,
    clear,
  };
}
