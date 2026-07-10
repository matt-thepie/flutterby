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
import { user } from './auth-schema.js';

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
 * A recording visit: one place and time, holding any number of species
 * sightings. Location is stored three ways — the human-friendly OS grid ref
 * plus the raw lat/lon and GPS accuracy — so nothing is lost and precision can
 * be re-derived.
 */
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Anonymous per-device id (localStorage). Groups a recorder's own history. */
    recorderId: uuid('recorder_id').notNull(),
    recorderName: text('recorder_name'),
    /**
     * Set once a recorder signs in (optional — login is only needed for
     * multi-device sync). Anonymous reports have this null; signing in claims
     * them (see POST /api/link) and future reports carry the account id.
     */
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),

    gridRef: text('grid_ref'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    accuracyM: doublePrecision('accuracy_m'),
    /** Free-text place name, e.g. "Home garden" or "Butser Hill". */
    locationName: text('location_name'),

    notes: text('notes'),
    /** When the visit happened (editable day + time in the UI). */
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reports_recorder_idx').on(t.recorderId),
    index('reports_user_idx').on(t.userId),
    index('reports_observed_idx').on(t.observedAt),
  ],
);

/** One species line within a report: which butterfly, and how many. */
export const sightings = pgTable(
  'sightings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    speciesId: integer('species_id')
      .notNull()
      .references(() => butterflies.id),
    count: integer('count').notNull().default(1),
  },
  (t) => [
    index('sightings_report_idx').on(t.reportId),
    index('sightings_species_idx').on(t.speciesId),
  ],
);

export type Butterfly = typeof butterflies.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Sighting = typeof sightings.$inferSelect;
