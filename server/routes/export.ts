import type { FastifyInstance } from 'fastify';
import { eq, or, type SQL } from 'drizzle-orm';
import { reports } from '../../db/schema.js';
import { getUserId } from '../session.js';
import { buildCsv, fetchRecords } from '../export-data.js';

function ownershipScope(recorderId: string, userId: string | null): SQL {
  return userId
    ? (or(eq(reports.recorderId, recorderId), eq(reports.userId, userId)) as SQL)
    : eq(reports.recorderId, recorderId);
}

/**
 * Per-recorder CSV export in the county-recorder format — one row per butterfly
 * per date per location. (Admins get an all-records CSV/Excel via /api/admin.)
 */
export async function exportRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/export.csv',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['recorderId'],
          properties: { recorderId: { type: 'string' } },
        },
      },
    },
    async (req, reply) => {
      const { recorderId } = req.query as { recorderId: string };
      const userId = await getUserId(req);
      const rows = await fetchRecords(ownershipScope(recorderId, userId));

      reply
        .header('content-type', 'text/csv; charset=utf-8')
        .header('content-disposition', 'attachment; filename="flutterby-records.csv"');
      return buildCsv(rows);
    },
  );
}
