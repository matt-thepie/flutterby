import L from 'leaflet';

// leaflet.markercluster is a UMD plugin that augments the global `L`. In a
// bundled ESM build there is no global, so expose it before the plugin loads
// (this module is imported *before* 'leaflet.markercluster').
if (typeof window !== 'undefined') {
  (window as unknown as { L: typeof L }).L = L;
}

export default L;
