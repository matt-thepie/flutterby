import type { FastifyInstance } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db.js';
import { places, reports } from '../../db/schema.js';
import { getUserId } from '../session.js';

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  // When a recorder signs in, claim this device's anonymous reports for their
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
        .update(reports)
        .set({ userId })
        .where(and(eq(reports.recorderId, recorderId), isNull(reports.userId)))
        .returning({ id: reports.id });

      // Remembered places travel with the account too.
      await db
        .update(places)
        .set({ userId })
        .where(and(eq(places.recorderId, recorderId), isNull(places.userId)));

      return { linked: linked.length };
    },
  );
}
