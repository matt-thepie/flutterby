import type { FastifyInstance } from 'fastify';
import { and, desc, eq, inArray, or, type SQL } from 'drizzle-orm';
import { db } from '../db.js';
import { butterflies, reports, sightings } from '../../db/schema.js';
import { getUserId } from '../session.js';
import { rememberPlace } from './places.js';

interface SightingLine {
  speciesId: number;
  count: number;
  notes?: string | null;
  sex?: 'male' | 'female' | null;
}

interface ReportBody {
  recorderId: string;
  recorderName?: string | null;
  gridRef?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
  locationName?: string | null;
  notes?: string | null;
  observedAt?: string | null;
  sightings: SightingLine[];
}

const sightingLineSchema = {
  type: 'object',
  required: ['speciesId'],
  additionalProperties: false,
  properties: {
    speciesId: { type: 'integer' },
    count: { type: 'integer', minimum: 1, maximum: 100000, default: 1 },
    notes: { type: ['string', 'null'], maxLength: 1000 },
    sex: { type: ['string', 'null'], enum: ['male', 'female', null] },
  },
};

const reportBodySchema = {
  type: 'object',
  required: ['recorderId', 'sightings'],
  additionalProperties: false,
  properties: {
    recorderId: { type: 'string', minLength: 1, maxLength: 64 },
    recorderName: { type: ['string', 'null'], maxLength: 120 },
    gridRef: { type: ['string', 'null'], maxLength: 40 },
    latitude: { type: ['number', 'null'], minimum: -90, maximum: 90 },
    longitude: { type: ['number', 'null'], minimum: -180, maximum: 180 },
    accuracyM: { type: ['number', 'null'], minimum: 0 },
    locationName: { type: ['string', 'null'], maxLength: 200 },
    notes: { type: ['string', 'null'], maxLength: 1000 },
    observedAt: { type: ['string', 'null'] },
    sightings: { type: 'array', minItems: 1, maxItems: 200, items: sightingLineSchema },
  },
};

// Update: same fields, but everything optional and sightings may be omitted.
const reportPatchSchema = {
  ...reportBodySchema,
  required: ['recorderId'],
  properties: {
    ...reportBodySchema.properties,
    sightings: { type: 'array', minItems: 0, maxItems: 200, items: sightingLineSchema },
  },
};

/** All of a recorder's sighting lines grouped per report id. */
async function linesByReport(reportIds: string[]): Promise<Map<string, unknown[]>> {
  const grouped = new Map<string, unknown[]>();
  if (reportIds.length === 0) return grouped;

  const rows = await db
    .select({
      reportId: sightings.reportId,
      speciesId: sightings.speciesId,
      count: sightings.count,
      notes: sightings.notes,
      sex: sightings.sex,
      commonName: butterflies.commonName,
      scientificName: butterflies.scientificName,
      imageUrl: butterflies.imageUrl,
    })
    .from(sightings)
    .innerJoin(butterflies, eq(sightings.speciesId, butterflies.id))
    .where(inArray(sightings.reportId, reportIds))
    .orderBy(desc(sightings.count), butterflies.commonName);

  for (const row of rows) {
    const { reportId, ...line } = row;
    const bucket = grouped.get(reportId) ?? [];
    bucket.push(line);
    grouped.set(reportId, bucket);
  }
  return grouped;
}

/** Scope: the signed-in account's reports, or this device's anonymous ones. */
function ownershipScope(recorderId: string, userId: string | null): SQL {
  return userId
    ? (or(eq(reports.recorderId, recorderId), eq(reports.userId, userId)) as SQL)
    : eq(reports.recorderId, recorderId);
}

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  // Create a report with its sighting lines.
  app.post('/api/reports', { schema: { body: reportBodySchema } }, async (req, reply) => {
    const body = req.body as ReportBody;
    const userId = await getUserId(req);

    const [report] = await db
      .insert(reports)
      .values({
        recorderId: body.recorderId,
        recorderName: body.recorderName ?? null,
        userId,
        gridRef: body.gridRef ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        accuracyM: body.accuracyM ?? null,
        locationName: body.locationName ?? null,
        notes: body.notes ?? null,
        observedAt: body.observedAt ? new Date(body.observedAt) : undefined,
      })
      .returning();

    if (!report) {
      reply.code(500);
      return { error: 'Insert failed' };
    }

    await db.insert(sightings).values(
      body.sightings.map((line) => ({
        reportId: report.id,
        speciesId: line.speciesId,
        count: line.count ?? 1,
        notes: line.notes ?? null,
        sex: line.sex ?? null,
      })),
    );

    // A confirmed place name becomes (or refreshes) a remembered place, so
    // the same spot gets the same canonical name next visit.
    if (report.locationName && report.latitude != null && report.longitude != null) {
      await rememberPlace({
        recorderId: report.recorderId,
        userId,
        name: report.locationName,
        gridRef: report.gridRef,
        latitude: report.latitude,
        longitude: report.longitude,
      }).catch((err) => req.log.warn(err, 'rememberPlace failed'));
    }

    reply.code(201);
    return report;
  });

  // The recorder's reports, newest visit first, with species lines attached.
  app.get(
    '/api/reports',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['recorderId'],
          properties: {
            recorderId: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
          },
        },
      },
    },
    async (req) => {
      const { recorderId, limit = 50 } = req.query as { recorderId: string; limit?: number };
      const userId = await getUserId(req);

      const rows = await db
        .select()
        .from(reports)
        .where(ownershipScope(recorderId, userId))
        .orderBy(desc(reports.observedAt))
        .limit(limit);

      const lines = await linesByReport(rows.map((r) => r.id));
      return rows.map((r) => ({ ...r, sightings: lines.get(r.id) ?? [] }));
    },
  );

  // Edit a report: any field, and optionally replace its sighting lines.
  app.patch(
    '/api/reports/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        body: reportPatchSchema,
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as Partial<ReportBody> & { recorderId: string };
      const userId = await getUserId(req);

      const [updated] = await db
        .update(reports)
        .set({
          ...(body.gridRef !== undefined && { gridRef: body.gridRef }),
          ...(body.latitude !== undefined && { latitude: body.latitude }),
          ...(body.longitude !== undefined && { longitude: body.longitude }),
          ...(body.accuracyM !== undefined && { accuracyM: body.accuracyM }),
          ...(body.locationName !== undefined && { locationName: body.locationName }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(body.recorderName !== undefined && { recorderName: body.recorderName }),
          ...(body.observedAt && { observedAt: new Date(body.observedAt) }),
        })
        .where(and(eq(reports.id, id), ownershipScope(body.recorderId, userId)))
        .returning();

      if (!updated) {
        reply.code(404);
        return { error: 'Report not found' };
      }

      if (body.sightings) {
        await db.delete(sightings).where(eq(sightings.reportId, id));
        if (body.sightings.length > 0) {
          await db.insert(sightings).values(
            body.sightings.map((line) => ({
              reportId: id,
              speciesId: line.speciesId,
              count: line.count ?? 1,
              notes: line.notes ?? null,
              sex: line.sex ?? null,
            })),
          );
        }
      }

      if (body.locationName && updated.latitude != null && updated.longitude != null) {
        await rememberPlace({
          recorderId: updated.recorderId,
          userId,
          name: body.locationName,
          gridRef: updated.gridRef,
          latitude: updated.latitude,
          longitude: updated.longitude,
        }).catch((err) => req.log.warn(err, 'rememberPlace failed'));
      }

      return updated;
    },
  );

  // Delete a whole report (sighting lines cascade).
  app.delete(
    '/api/reports/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        querystring: {
          type: 'object',
          required: ['recorderId'],
          properties: { recorderId: { type: 'string' } },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { recorderId } = req.query as { recorderId: string };
      const userId = await getUserId(req);

      const deleted = await db
        .delete(reports)
        .where(and(eq(reports.id, id), ownershipScope(recorderId, userId)))
        .returning({ id: reports.id });

      if (deleted.length === 0) {
        reply.code(404);
        return { error: 'Report not found' };
      }

      reply.code(204);
      return null;
    },
  );
}
