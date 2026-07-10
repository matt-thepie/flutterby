export interface Butterfly {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  imageUrl: string | null;
  status: string | null;
  sortOrder: number;
}

export interface TopButterfly extends Butterfly {
  total: number;
  lastSeen: string;
}

/** A butterfly shown in the grid, optionally carrying the recorder's running total. */
export type GridSpecies = Butterfly & { total?: number };

export interface Sighting {
  id: string;
  speciesId: number;
  commonName: string;
  scientificName: string;
  count: number;
  gridRef: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  notes: string | null;
  observedAt: string;
}

/** The raw row returned by POST /api/sightings (no species join). */
export interface SightingRow {
  id: string;
  speciesId: number;
  count: number;
  gridRef: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  recorderId: string;
  recorderName: string | null;
  notes: string | null;
  observedAt: string;
}

export interface NewSightingInput {
  speciesId: number;
  count: number;
  recorderId: string;
  recorderName?: string | null;
  gridRef?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
  notes?: string | null;
}
