import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db.js';
import { butterflies, reports, sightings } from '../../db/schema.js';
import { getUser, type SessionUser } from '../session.js';
import { buildCsv, buildXlsx, fetchRecords } from '../export-data.js';

/**
 * Admin allowlist. Defaults to the family recorders; override with
 * ADMIN_EMAILS (comma-separated) in the environment.
 */
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ?? 'jerrypdennis@gmail.com,matt.thepie@gmail.com'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email: string | undefined): boolean {
  return email != null && ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Resolve the request's user if they're an allowlisted admin, else send 401/403. */
async function requireAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<SessionUser | null> {
  const user = await getUser(req);
  if (!user) {
    reply.code(401).send({ error: 'Sign in required' });
    return null;
  }
  if (!isAdminEmail(user.email)) {
    reply.code(403).send({ error: 'Not authorised' });
    return null;
  }
  return user;
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Lets the client decide whether to show the Records link / page.
  app.get('/api/admin/session', async (req) => {
    const user = await getUser(req);
    return { isAdmin: isAdminEmail(user?.email), email: user?.email ?? null };
  });

  // Every report in the system, newest first, with its species lines — the
  // data behind the map and the location detail panels.
  app.get('/api/admin/records', async (req, reply) => {
    if (!(await requireAdmin(req, reply))) return;

    const reportRows = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.observedAt))
      .limit(5000);

    const ids = reportRows.map((r) => r.id);
    const lines = ids.length
      ? await db
          .select({
            reportId: sightings.reportId,
            speciesId: sightings.speciesId,
            count: sightings.count,
            notes: sightings.notes,
            commonName: butterflies.commonName,
            scientificName: butterflies.scientificName,
            imageUrl: butterflies.imageUrl,
          })
          .from(sightings)
          .innerJoin(butterflies, eq(sightings.speciesId, butterflies.id))
          .where(inArray(sightings.reportId, ids))
      : [];

    const byReport = new Map<string, typeof lines>();
    for (const line of lines) {
      const bucket = byReport.get(line.reportId) ?? [];
      bucket.push(line);
      byReport.set(line.reportId, bucket);
    }

    return reportRows.map((r) => ({
      ...r,
      sightings: (byReport.get(r.id) ?? []).map(({ reportId: _r, ...rest }) => rest),
    }));
  });

  app.get('/api/admin/export.csv', async (req, reply) => {
    if (!(await requireAdmin(req, reply))) return;
    const rows = await fetchRecords();
    reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', 'attachment; filename="flutterby-records.csv"');
    return buildCsv(rows);
  });

  app.get('/api/admin/export.xlsx', async (req, reply) => {
    if (!(await requireAdmin(req, reply))) return;
    const rows = await fetchRecords();
    const buffer = await buildXlsx(rows);
    reply
      .header(
        'content-type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      .header('content-disposition', 'attachment; filename="flutterby-records.xlsx"');
    return reply.send(buffer);
  });
}
