import type { FastifyInstance } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { butterflies, sightings } from '../../db/schema';

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

    const [row] = await db
      .insert(sightings)
      .values({
        speciesId: body.speciesId,
        count: body.count ?? 1,
        recorderId: body.recorderId,
        recorderName: body.recorderName ?? null,
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
        .where(eq(sightings.recorderId, recorderId))
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

      const deleted = await db
        .delete(sightings)
        .where(and(eq(sightings.id, id), eq(sightings.recorderId, recorderId)))
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
