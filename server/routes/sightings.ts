import type { FastifyInstance } from 'fastify';
import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '../db';
import { butterflies, sightings } from '../../db/schema';
import { getUserId } from '../session';

interface SightingBody {
  speciesId: number;
  count?: number;
  recorderId: string;
  recorderName?: string | null;
  gridRef?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
  notes?: string | null;
  observedAt?: string | null;
}

const sightingBodySchema = {
  type: 'object',
  required: ['speciesId', 'recorderId'],
  additionalProperties: false,
  properties: {
    speciesId: { type: 'integer' },
    count: { type: 'integer', minimum: 1, maximum: 100000, default: 1 },
    recorderId: { type: 'string', minLength: 1, maxLength: 64 },
    recorderName: { type: ['string', 'null'], maxLength: 120 },
    gridRef: { type: ['string', 'null'], maxLength: 40 },
    latitude: { type: ['number', 'null'], minimum: -90, maximum: 90 },
    longitude: { type: ['number', 'null'], minimum: -180, maximum: 180 },
    accuracyM: { type: ['number', 'null'], minimum: 0 },
    notes: { type: ['string', 'null'], maxLength: 1000 },
    observedAt: { type: ['string', 'null'] },
  },
};

export async function sightingRoutes(app: FastifyInstance): Promise<void> {
  // Record a sighting.
  app.post('/api/sightings', { schema: { body: sightingBodySchema } }, async (req, reply) => {
    const body = req.body as SightingBody;
    const userId = await getUserId(req);

    const [row] = await db
      .insert(sightings)
      .values({
        speciesId: body.speciesId,
        count: body.count ?? 1,
        recorderId: body.recorderId,
        recorderName: body.recorderName ?? null,
        userId,
        gridRef: body.gridRef ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        accuracyM: body.accuracyM ?? null,
        notes: body.notes ?? null,
        observedAt: body.observedAt ? new Date(body.observedAt) : undefined,
      })
      .returning();

    reply.code(201);
    return row;
  });

  // A recorder's recent sightings, most recent first, with the species name joined in.
  app.get(
    '/api/sightings',
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

      // Signed in → the account's sightings across devices; otherwise this device's.
      const scope = userId
        ? eq(sightings.userId, userId)
        : eq(sightings.recorderId, recorderId);

      return db
        .select({
          id: sightings.id,
          speciesId: sightings.speciesId,
          commonName: butterflies.commonName,
          scientificName: butterflies.scientificName,
          count: sightings.count,
          gridRef: sightings.gridRef,
          latitude: sightings.latitude,
          longitude: sightings.longitude,
          accuracyM: sightings.accuracyM,
          notes: sightings.notes,
          observedAt: sightings.observedAt,
        })
        .from(sightings)
        .innerJoin(butterflies, eq(sightings.speciesId, butterflies.id))
        .where(scope)
        .orderBy(desc(sightings.observedAt))
        .limit(limit);
    },
  );

  // Undo — a recorder can only delete their own sighting.
  app.delete(
    '/api/sightings/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
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

      // A recorder may delete a sighting made on this device, or any sighting
      // belonging to their signed-in account.
      const owns = userId
        ? or(eq(sightings.recorderId, recorderId), eq(sightings.userId, userId))
        : eq(sightings.recorderId, recorderId);

      const deleted = await db
        .delete(sightings)
        .where(and(eq(sightings.id, id), owns))
        .returning({ id: sightings.id });

      if (deleted.length === 0) {
        reply.code(404);
        return { error: 'Sighting not found' };
      }

      reply.code(204);
      return null;
    },
  );
}
