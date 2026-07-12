import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { GeoState } from './useGeolocation';

export interface PlaceSuggestion {
  name: string;
  source: 'remembered' | 'osm';
  distanceM?: number;
}

/** Re-fetch once the recorder has moved this far from the last suggestion. */
const REFETCH_DISTANCE_M = 400;

function roughDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Equirectangular approximation — plenty for a "have we moved?" check.
  const dLat = (lat2 - lat1) * 111320;
  const dLon = (lon2 - lon1) * 111320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/**
 * Best guess at a canonical place name for where the recorder is standing:
 * their own remembered places first (server-side), then OpenStreetMap.
 * Refreshes only when they've moved meaningfully — not on every GPS tick.
 */
export function usePlaceSuggestion(geo: GeoState, recorderId: string): PlaceSuggestion | null {
  const [suggestion, setSuggestion] = useState<PlaceSuggestion | null>(null);
  const lastFetch = useRef<{ lat: number; lon: number } | null>(null);
  const inFlight = useRef(false);

  const { latitude, longitude, status } = geo;

  useEffect(() => {
    if (status !== 'ready' || latitude == null || longitude == null || inFlight.current) return;

    const last = lastFetch.current;
    if (last && roughDistanceM(last.lat, last.lon, latitude, longitude) < REFETCH_DISTANCE_M) {
      return;
    }

    inFlight.current = true;
    lastFetch.current = { lat: latitude, lon: longitude };
    api
      .suggestPlace(recorderId, latitude, longitude)
      .then((result) => setSuggestion(result.suggestion))
      .catch(() => {
        /* offline or geocoder down — manual entry still works */
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [status, latitude, longitude, recorderId]);

  return suggestion;
}
