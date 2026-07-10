import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Sighting } from '../types/models';

export interface SightingData {
  recents: Sighting[];
  refresh: () => void;
  addLocal: (sighting: Sighting) => void;
  removeLocal: (id: string) => void;
}

export function useSightings(recorderId: string): SightingData {
  const [recents, setRecents] = useState<Sighting[]>([]);

  const refresh = useCallback(() => {
    api
      .getRecentSightings(recorderId)
      .then(setRecents)
      .catch(() => {
        /* transient; the list will refill on the next successful fetch */
      });
  }, [recorderId]);

  useEffect(() => refresh(), [refresh]);

  const addLocal = useCallback((sighting: Sighting) => {
    setRecents((current) => [sighting, ...current]);
  }, []);

  const removeLocal = useCallback((id: string) => {
    setRecents((current) => current.filter((s) => s.id !== id));
  }, []);

  return { recents, refresh, addLocal, removeLocal };
}
