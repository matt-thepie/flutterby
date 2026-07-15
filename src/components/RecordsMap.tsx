import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './RecordsMap.module.css';

export interface MapLocation {
  key: string;
  label: string;
  lat: number;
  lon: number;
  individuals: number;
}

interface Props {
  locations: MapLocation[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

const ACCENT = '#d9822b';
const PRIMARY = '#2f6f4f';

export function RecordsMap({ locations, selectedKey, onSelect }: Props): React.ReactElement {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Create the map once.
  useEffect(() => {
    if (!elRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([54.5, -3.2], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    // The container is often sized after mount; nudge Leaflet to re-measure.
    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-draw markers when the locations change, and fit the view to them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const loc of locations) {
      const marker = L.circleMarker([loc.lat, loc.lon], {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: PRIMARY,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindTooltip(`${loc.label} — ${loc.individuals}`, { direction: 'top' })
        .on('click', () => onSelectRef.current(loc.key));
      markersRef.current.set(loc.key, marker);
    }

    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [locations]);

  // Highlight the selected marker and pan to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [key, marker] of markersRef.current) {
      const selected = key === selectedKey;
      marker.setStyle({ fillColor: selected ? ACCENT : PRIMARY, radius: selected ? 11 : 8 });
      if (selected) {
        marker.bringToFront();
        map.panTo(marker.getLatLng());
      }
    }
  }, [selectedKey]);

  return <div ref={elRef} className={styles.map} role="application" aria-label="Map of records" />;
}
