import ExcelJS from 'exceljs';
import { asc, eq, type SQL } from 'drizzle-orm';
import { db } from './db.js';
import { butterflies, reports, sightings } from '../db/schema.js';
import { compactGridRef } from '../src/lib/osgrid.js';

/**
 * A single export record — one butterfly per date per location, matching the
 * columns the county recorder's system expects (see the sample Dad supplied).
 * Shared by the per-recorder CSV export and the admin CSV / Excel exports.
 */
export interface ExportRow {
  commonName: string;
  taxon: string;
  location: string;
  gridReference: string;
  recorder: string;
  date: Date;
  number: number;
  lifeStage: string;
  sex: string;
  comment: string;
  recordType: string;
  importReference: string;
}

export const EXPORT_HEADERS = [
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

/** Flatten reports → sightings into export rows. Pass a scope, or omit for all. */
export async function fetchRecords(scope?: SQL): Promise<ExportRow[]> {
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
      notes: sightings.notes,
      sex: sightings.sex,
      count: sightings.count,
    })
    .from(sightings)
    .innerJoin(reports, eq(sightings.reportId, reports.id))
    .innerJoin(butterflies, eq(sightings.speciesId, butterflies.id))
    .where(scope)
    .orderBy(asc(reports.observedAt), asc(butterflies.commonName));

  return rows.map((r) => ({
    commonName: r.commonName,
    taxon: r.scientificName,
    location: r.locationName ?? '',
    gridReference:
      r.latitude != null && r.longitude != null
        ? (compactGridRef(r.latitude, r.longitude, 10) ?? '')
        : (r.gridRef ?? '').replace(/\s+/g, ''),
    recorder: r.recorderName?.trim() || 'Anonymous',
    date: new Date(r.observedAt),
    number: r.count,
    lifeStage: 'Adult', // this app records adults on the wing
    sex: r.sex === 'male' ? 'Male' : r.sex === 'female' ? 'Female' : '',
    comment: r.notes ?? '',
    recordType: '',
    importReference: '',
  }));
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function csvField(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** RFC-4180 CSV with a UTF-8 BOM + CRLF so Excel opens it cleanly. */
export function buildCsv(rows: ExportRow[]): string {
  const lines = [EXPORT_HEADERS.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.commonName,
        r.taxon,
        r.location,
        r.gridReference,
        r.recorder,
        dateFmt.format(r.date),
        r.number,
        r.lifeStage,
        r.sex,
        r.comment,
        r.recordType,
        r.importReference,
      ]
        .map(csvField)
        .join(','),
    );
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** A real .xlsx workbook — friendlier than CSV for a non-technical recorder. */
export async function buildXlsx(rows: ExportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Flutterby';
  const ws = wb.addWorksheet('Records', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'Common Name', key: 'commonName', width: 22 },
    { header: 'Taxon', key: 'taxon', width: 22 },
    { header: 'Location', key: 'location', width: 28 },
    { header: 'Grid Reference', key: 'gridReference', width: 16 },
    { header: 'Recorder', key: 'recorder', width: 20 },
    { header: 'Date', key: 'date', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Number', key: 'number', width: 9 },
    { header: 'Life Stage', key: 'lifeStage', width: 11 },
    { header: 'Sex', key: 'sex', width: 7 },
    { header: 'Comment', key: 'comment', width: 40 },
    { header: 'Record type', key: 'recordType', width: 12 },
    { header: 'Import reference', key: 'importReference', width: 16 },
  ];

  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow(r);
  ws.autoFilter = { from: 'A1', to: 'L1' };

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
