import {
  pgTable,
  serial,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Reference list of British butterfly species. Seeded from db/butterflies.ts
 * (see db/seed.ts), with images pulled from Wikimedia via the Wikipedia REST API.
 */
export const butterflies = pgTable('butterflies', {
  id: serial('id').primaryKey(),
  commonName: text('common_name').notNull(),
  scientificName: text('scientific_name').notNull().unique(),
  family: text('family').notNull(),
  /** Wikipedia article title used to fetch the image at seed time. */
  wikipediaTitle: text('wikipedia_title'),
  imageUrl: text('image_url'),
  /** e.g. "resident", "regular migrant", "rare migrant". */
  status: text('status'),
  /** Lower sorts first — garden-common species lead the starter grid. */
  sortOrder: integer('sort_order').notNull().default(1000),
});

/**
 * A single field observation: a species, a count, and where/when it was seen.
 * Location is stored three ways — the human-friendly OS grid ref plus the raw
 * lat/lon and GPS accuracy — so nothing is lost and precision can be re-derived.
 */
export const sightings = pgTable(
  'sightings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    speciesId: integer('species_id')
      .notNull()
      .references(() => butterflies.id),
    count: integer('count').notNull().default(1),

    gridRef: text('grid_ref'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    accuracyM: doublePrecision('accuracy_m'),

    /** Anonymous per-device id (localStorage). Groups a recorder's own history. */
    recorderId: uuid('recorder_id').notNull(),
    recorderName: text('recorder_name'),

    notes: text('notes'),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sightings_recorder_idx').on(t.recorderId),
    index('sightings_species_idx').on(t.speciesId),
    index('sightings_observed_idx').on(t.observedAt),
  ],
);

export type Butterfly = typeof butterflies.$inferSelect;
export type NewSighting = typeof sightings.$inferInsert;
export type Sighting = typeof sightings.$inferSelect;
