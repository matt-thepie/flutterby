import { useCallback, useEffect, useState } from 'react';
import { latLonToGridRef, type GridReference } from '../lib/osgrid';

export type GeoStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable' | 'error';

export interface GeoState {
  status: GeoStatus;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  gridRef: GridReference | null;
  error: string | null;
  refresh: () => void;
}

type GeoSnapshot = Omit<GeoState, 'refresh'>;

const INITIAL: GeoSnapshot = {
  status: 'idle',
  latitude: null,
  longitude: null,
  accuracyM: null,
  gridRef: null,
  error: null,
};

/**
 * Watches the device location and derives a live OS grid reference.
 * `refresh` restarts the watch — useful after granting permission or moving on.
 */
export function useGeolocation(): GeoState {
  const [snapshot, setSnapshot] = useState<GeoSnapshot>(INITIAL);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setSnapshot({ ...INITIAL, status: 'unavailable', error: 'This device has no location support.' });
      return;
    }

    setSnapshot((s) => ({ ...s, status: 'locating', error: null }));

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setSnapshot({
          status: 'ready',
          latitude,
          longitude,
          accuracyM: accuracy,
          gridRef: latLonToGridRef(latitude, longitude, accuracy),
          error: null,
        });
      },
      (err) => {
        setSnapshot((s) => ({
          ...s,
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          error: err.message,
        }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [nonce]);

  return { ...snapshot, refresh };
}
