import { useCallback, useEffect, useState } from 'react';
import { latLonToGridRef, type GridReference } from '../lib/osgrid';

export type GeoStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable' | 'error';
export type GeoPermission = 'unknown' | 'granted' | 'prompt' | 'denied';

export interface GeoState {
  status: GeoStatus;
  /** Browser permission state, introspected without triggering a prompt. */
  permission: GeoPermission;
  /** Whether a location watch has been requested this session. */
  started: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  gridRef: GridReference | null;
  error: string | null;
  /** Begin (or restart) watching — triggers the browser prompt if needed. */
  start: () => void;
}

type GeoSnapshot = Pick<
  GeoState,
  'status' | 'latitude' | 'longitude' | 'accuracyM' | 'gridRef' | 'error'
>;

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
 *
 * Deliberately does NOT request location on mount: the browser permission
 * prompt only appears once `start()` is called, so the app can show its own
 * explanatory prompt first. If permission was already granted on a previous
 * visit, the watch starts automatically (no prompt would be shown anyway).
 */
export function useGeolocation(): GeoState {
  const [snapshot, setSnapshot] = useState<GeoSnapshot>(INITIAL);
  const [permission, setPermission] = useState<GeoPermission>('unknown');
  const [started, setStarted] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Introspect the permission state without prompting (not supported
  // everywhere — older iOS Safari lands in 'unknown', which we treat as
  // 'prompt' for UI purposes).
  useEffect(() => {
    let status: PermissionStatus | undefined;
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((s) => {
        status = s;
        setPermission(s.state);
        if (s.state === 'granted') setStarted(true);
        s.onchange = () => setPermission(s.state);
      })
      .catch(() => {
        /* stays 'unknown' */
      });
    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!started) return;

    if (!('geolocation' in navigator)) {
      setSnapshot({ ...INITIAL, status: 'unavailable', error: 'This device has no location support.' });
      return;
    }

    setSnapshot((s) => ({ ...s, status: 'locating', error: null }));

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPermission('granted');
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
        if (err.code === err.PERMISSION_DENIED) setPermission('denied');
        setSnapshot((s) => ({
          ...s,
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          error: err.message,
        }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [started, nonce]);

  return { ...snapshot, permission, started, start };
}
