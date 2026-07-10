/**
 * One-off migration: restructure flat `sightings` into `reports` (visit) +
 * `sightings` (species lines). Each legacy sighting becomes a single-species
 * report carrying its original location and timestamp. Idempotent-ish: bails
 * if `reports` already exists. Kept in the repo as a record of the change.
 *
 * Run with: npx tsx --env-file=.env db/migrate-to-reports.ts
 */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const existing = await sql.query(
  `select 1 from information_schema.tables where table_name = 'reports'`,
);
if (existing.length > 0) {
  console.log('reports table already exists — nothing to do.');
  process.exit(0);
}

// neon-http has no multi-statement transactions via .query; use a single
// batched transaction instead.
await sql.transaction((tx) => [
  tx`CREATE TABLE "reports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "recorder_id" uuid NOT NULL,
    "recorder_name" text,
    "user_id" text,
    "grid_ref" text,
    "latitude" double precision,
    "longitude" double precision,
    "accuracy_m" double precision,
    "location_name" text,
    "notes" text,
    "observed_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "legacy_sighting_id" uuid
  )`,
  tx`ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_user_id_fk"
     FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null`,
  tx`CREATE INDEX "reports_recorder_idx" ON "reports" ("recorder_id")`,
  tx`CREATE INDEX "reports_user_idx" ON "reports" ("user_id")`,
  tx`CREATE INDEX "reports_observed_idx" ON "reports" ("observed_at")`,

  tx`INSERT INTO "reports"
      (recorder_id, recorder_name, user_id, grid_ref, latitude, longitude,
       accuracy_m, notes, observed_at, legacy_sighting_id)
     SELECT recorder_id, recorder_name, user_id, grid_ref, latitude, longitude,
       accuracy_m, notes, observed_at, id
     FROM "sightings"`,

  tx`CREATE TABLE "sightings_new" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "report_id" uuid NOT NULL,
    "species_id" integer NOT NULL,
    "count" integer DEFAULT 1 NOT NULL
  )`,
  tx`INSERT INTO "sightings_new" (report_id, species_id, count)
     SELECT r.id, s.species_id, s.count
     FROM "sightings" s JOIN "reports" r ON r.legacy_sighting_id = s.id`,

  tx`ALTER TABLE "reports" DROP COLUMN "legacy_sighting_id"`,
  tx`DROP TABLE "sightings"`,
  tx`ALTER TABLE "sightings_new" RENAME TO "sightings"`,
  tx`ALTER TABLE "sightings" ADD CONSTRAINT "sightings_report_id_reports_id_fk"
     FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE cascade`,
  tx`ALTER TABLE "sightings" ADD CONSTRAINT "sightings_species_id_butterflies_id_fk"
     FOREIGN KEY ("species_id") REFERENCES "butterflies"("id")`,
  tx`CREATE INDEX "sightings_report_idx" ON "sightings" ("report_id")`,
  tx`CREATE INDEX "sightings_species_idx" ON "sightings" ("species_id")`,
]);

const reports = await sql.query('select count(*)::int as n from reports');
const lines = await sql.query('select count(*)::int as n from sightings');
console.log(`Done. ${reports[0]?.n} reports, ${lines[0]?.n} sighting lines.`);
