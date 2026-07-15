import type { FastifyInstance } from 'fastify';
import { asc, eq, or, type SQL } from 'drizzle-orm';
import { db } from '../db.js';
import { butterflies, reports, sightings } from '../../db/schema.js';
import { getUserId } from '../session.js';
import { compactGridRef } from '../../src/lib/osgrid.js';

/**
 * County-recorder export. One row per butterfly per date per location (the
 * report's species lines flattened out), matching the columns other recording
 * apps produce — see the sample Dad supplied. Grid references are space-free
 * and 10-figure where GPS coordinates exist.
 */

const HEADERS = [
  'Common Name',
  'Taxon',
  'Location',
  'Grid Reference',
  'Recorder',
  'Date',
  'Number',
  'Life Stage',
  'Sex',
  'Comment',
  'Record type',
  'Import reference',
] as const;

/** Quote a CSV field if it contains a comma, quote or newline (RFC 4180). */
function csvField(value: string | number | null): string {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function ownershipScope(recorderId: string, userId: string | null): SQL {
  return userId
    ? (or(eq(reports.recorderId, recorderId), eq(reports.userId, userId)) as SQL)
    : eq(reports.recorderId, recorderId);
}

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

      const rows = await db
        .select({
          commonName: butterflies.commonName,
          scientificName: butterflies.scientificName,
          locationName: reports.locationName,
          gridRef: reports.gridRef,
          latitude: reports.latitude,
          longitude: reports.longitude,
          recorderName: reports.recorderName,
          observedAt: reports.observedAt,
          notes: reports.notes,
          count: sightings.count,
        })
        .from(sightings)
        .innerJoin(reports, eq(sightings.reportId, reports.id))
        .innerJoin(butterflies, eq(sightings.speciesId, butterflies.id))
        .where(ownershipScope(recorderId, userId))
        .orderBy(asc(reports.observedAt), asc(butterflies.commonName));

      const lines = [HEADERS.join(',')];
      for (const r of rows) {
        const gridReference =
          r.latitude != null && r.longitude != null
            ? (compactGridRef(r.latitude, r.longitude, 10) ?? '')
            : (r.gridRef ?? '').replace(/\s+/g, '');

        lines.push(
          [
            r.commonName,
            r.scientificName,
            r.locationName ?? '',
            gridReference,
            r.recorderName?.trim() || 'Anonymous',
            dateFmt.format(new Date(r.observedAt)),
            r.count,
            'Adult', // this app records adults on the wing
            '', // Sex — not captured
            r.notes ?? '',
            '', // Record type — set by the recorder's system on import
            '', // Import reference — assigned by the destination system
          ]
            .map(csvField)
            .join(','),
        );
      }

      reply
        .header('content-type', 'text/csv; charset=utf-8')
        .header('content-disposition', 'attachment; filename="flutterby-records.csv"');
      // Excel/Windows-friendly: BOM + CRLF line endings.
      return `﻿${lines.join('\r\n')}\r\n`;
    },
  );
}
