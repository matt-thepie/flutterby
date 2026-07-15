import { useEffect, useRef } from 'react';
import L from '../lib/leaflet'; // sets window.L before the cluster plugin loads
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
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

function pinIcon(selected: boolean): L.DivIcon {
  const color = selected ? ACCENT : PRIMARY;
  const size = selected ? 20 : 16;
  return L.divIcon({
    className: 'fb-pin',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function RecordsMap({ locations, selectedKey, onSelect }: Props): React.ReactElement {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Create the map + cluster group once.
  useEffect(() => {
    if (!elRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([54.5, -3.2], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 45,
      showCoverageOnHover: false,
    });
    map.addLayer(cluster);

    mapRef.current = map;
    clusterRef.current = cluster;

    // The container often gets its real size after mount (flex/grid layout,
    // fonts). Re-measure whenever it changes so tiles and markers fill it.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(elRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  // Re-draw markers when the locations change, and fit the view to them.
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    cluster.clearLayers();
    markersRef.current.clear();

    for (const loc of locations) {
      const marker = L.marker([loc.lat, loc.lon], { icon: pinIcon(loc.key === selectedKey) })
        .bindTooltip(`${loc.label} — ${loc.individuals}`, { direction: 'top' })
        .on('click', () => onSelectRef.current(loc.key));
      cluster.addLayer(marker);
      markersRef.current.set(loc.key, marker);
    }

    if (locations.length > 0) {
      map.fitBounds(cluster.getBounds(), { padding: [40, 40], maxZoom: 14 });
    }
    // selectedKey intentionally excluded — selection styling is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // Restyle the selected marker and expand its cluster so it's visible.
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    for (const [key, marker] of markersRef.current) {
      marker.setIcon(pinIcon(key === selectedKey));
    }
    if (selectedKey) {
      const marker = markersRef.current.get(selectedKey);
      if (marker) cluster.zoomToShowLayer(marker, () => marker.setIcon(pinIcon(true)));
    }
  }, [selectedKey]);

  return <div ref={elRef} className={styles.map} role="application" aria-label="Map of records" />;
}
