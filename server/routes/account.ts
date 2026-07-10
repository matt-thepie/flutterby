import type { FastifyInstance } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db.js';
import { sightings } from '../../db/schema.js';
import { getUserId } from '../session.js';

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  // When a recorder signs in, claim this device's anonymous sightings for their
  // account so nothing captured before signing in is lost.
  app.post(
    '/api/link',
    {
      schema: {
        body: {
          type: 'object',
          required: ['recorderId'],
          additionalProperties: false,
          properties: { recorderId: { type: 'string', minLength: 1, maxLength: 64 } },
        },
      },
    },
    async (req, reply) => {
      const userId = await getUserId(req);
      if (!userId) {
        reply.code(401);
        return { error: 'Not signed in' };
      }

      const { recorderId } = req.body as { recorderId: string };
      const linked = await db
        .update(sightings)
        .set({ userId })
        .where(and(eq(sightings.recorderId, recorderId), isNull(sightings.userId)))
        .returning({ id: sightings.id });

      return { linked: linked.length };
    },
  );
}
