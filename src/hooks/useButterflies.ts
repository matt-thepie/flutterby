import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Butterfly, TopButterfly } from '../types/models';

export interface ButterflyData {
  species: Butterfly[];
  top: TopButterfly[];
  loading: boolean;
  error: string | null;
  refreshTop: () => void;
}

export function useButterflies(recorderId: string): ButterflyData {
  const [species, setSpecies] = useState<Butterfly[]>([]);
  const [top, setTop] = useState<TopButterfly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getButterflies()
      .then((data) => active && setSpecies(data))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const refreshTop = useCallback(() => {
    api
      .getTopButterflies(recorderId)
      .then(setTop)
      .catch(() => {
        /* the starter grid is a fine fallback; ignore */
      });
  }, [recorderId]);

  useEffect(() => refreshTop(), [refreshTop]);

  return { species, top, loading, error, refreshTop };
}
