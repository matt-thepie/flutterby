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

export type Sex = 'male' | 'female';
export type LifeStage = 'egg' | 'larva' | 'pupa' | 'adult';

/** One species line within a report. */
export interface SightingLine {
  speciesId: number;
  count: number;
  notes: string | null;
  sex: Sex | null;
  lifeStage: LifeStage | null;
  commonName: string;
  scientificName: string;
  imageUrl: string | null;
}

/** A recording visit: one place & time plus the species seen there. */
export interface Report {
  id: string;
  recorderId: string;
  recorderName: string | null;
  gridRef: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  locationName: string | null;
  notes: string | null;
  observedAt: string;
  createdAt: string;
  sightings: SightingLine[];
}

/** The raw row returned by POST /api/reports (no sightings join). */
export type ReportRow = Omit<Report, 'sightings'>;

export interface NewReportInput {
  recorderId: string;
  recorderName?: string | null;
  gridRef?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
  locationName?: string | null;
  notes?: string | null;
  observedAt?: string | null;
  sightings: Array<{
    speciesId: number;
    count: number;
    notes?: string | null;
    sex?: Sex | null;
    lifeStage?: LifeStage | null;
  }>;
}

export type ReportPatch = Partial<Omit<NewReportInput, 'recorderId'>> & { recorderId: string };
