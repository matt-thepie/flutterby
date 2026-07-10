import type { FastifyInstance } from 'fastify';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { butterflies, sightings } from '../../db/schema.js';
import { getUserId } from '../session.js';

const speciesColumns = {
  id: butterflies.id,
  commonName: butterflies.commonName,
  scientificName: butterflies.scientificName,
  family: butterflies.family,
  imageUrl: butterflies.imageUrl,
  status: butterflies.status,
  sortOrder: butterflies.sortOrder,
};

export async function butterflyRoutes(app: FastifyInstance): Promise<void> {
  // The full reference list — used for search and the starter grid.
  app.get('/api/butterflies', async () => {
    return db
      .select(speciesColumns)
      .from(butterflies)
      .orderBy(butterflies.sortOrder, butterflies.commonName);
  });

  // A recorder's most-logged species, so the grid can adapt to their patch.
  app.get(
    '/api/butterflies/top',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['recorderId'],
          properties: {
            recorderId: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 60, default: 12 },
          },
        },
      },
    },
    async (req) => {
      const { recorderId, limit = 12 } = req.query as { recorderId: string; limit?: number };
      const userId = await getUserId(req);
      const total = sql<number>`sum(${sightings.count})`.mapWith(Number);

      const scope = userId
        ? eq(sightings.userId, userId)
        : eq(sightings.recorderId, recorderId);

      return db
        .select({
          ...speciesColumns,
          total,
          lastSeen: sql<string>`max(${sightings.observedAt})`,
        })
        .from(sightings)
        .innerJoin(butterflies, eq(sightings.speciesId, butterflies.id))
        .where(scope)
        .groupBy(butterflies.id)
        .orderBy(desc(total))
        .limit(limit);
    },
  );
}
