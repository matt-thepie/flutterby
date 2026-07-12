/**
 * Identification guide — shared schema and controlled vocabularies.
 *
 * The whole system moves the reasoning to build time: an LLM (see the header
 * of features.ts / lexicon.ts) produced two static assets — a per-species
 * feature record and a synonym lexicon — against the fixed vocabularies below.
 * At runtime there is NO model inference: the user's text is gazetteer-matched
 * to these tokens, then every species is scored with a weighted linear sum.
 *
 * The critical invariant: the token a species is tagged with MUST be the token
 * the parser extracts from the user. These `as const` tuples are the single
 * source of truth for both sides, and the types below make misalignment a
 * compile error.
 */

export const COLOURS = [
  'orange',
  'brown',
  'black',
  'white',
  'cream',
  'yellow',
  'green',
  'blue',
  'purple',
  'red',
  'copper',
  'grey',
  'gold',
] as const;
export type Colour = (typeof COLOURS)[number];

export const SIZE_CLASSES = ['small', 'medium', 'large'] as const;
export type SizeClass = (typeof SIZE_CLASSES)[number];

export const HABITATS = [
  'garden',
  'grassland',
  'meadow',
  'woodland',
  'woodland_edge',
  'hedgerow',
  'heathland',
  'moorland',
  'chalk_downland',
  'coastal',
  'cliff',
  'marsh',
  'bog',
  'fen',
  'farmland',
  'wasteland',
  'mountain',
  'scrub',
] as const;
export type Habitat = (typeof HABITATS)[number];

export const MARKINGS = [
  'spots',
  'eyespots',
  'dark_border',
  'white_spots',
  'orange_border',
  'tails',
  'marbled',
  'veined',
  'comma_mark',
  'chequered',
  'iridescent',
  'ragged_edge',
  'streaked',
  'plain',
] as const;
export type Marking = (typeof MARKINGS)[number];

/** One species' features — the build-time asset, keyed by scientific name. */
export interface SpeciesFeatures {
  scientificName: string;
  /** Months of the main UK flight period, 1–12. Verify against phenology data. */
  flightMonths: number[];
  colours: Colour[];
  sizeClass: SizeClass;
  /** Wingspan range in mm [min, max]. */
  wingspanMm: [number, number];
  habitats: Habitat[];
  markings: Marking[];
}

/** A structured query, extracted from the user's free text by the parser. */
export interface IdQuery {
  months: number[];
  colours: Colour[];
  size: SizeClass | null;
  habitats: Habitat[];
  markings: Marking[];
}

export const EMPTY_QUERY: IdQuery = {
  months: [],
  colours: [],
  size: null,
  habitats: [],
  markings: [],
};
