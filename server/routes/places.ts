import type { FastifyInstance } from 'fastify';
import { and, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db.js';
import { places } from '../../db/schema.js';
import { getUserId } from '../session.js';

/** Metres between two WGS84 points (haversine). */
export function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function ownershipScope(recorderId: string, userId: string | null): SQL {
  return userId
    ? (or(eq(places.recorderId, recorderId), eq(places.userId, userId)) as SQL)
    : eq(places.recorderId, recorderId);
}

/** A remembered place within this distance is "probably where they are". */
const REMEMBERED_RADIUS_M = 1200;

interface Suggestion {
  name: string;
  source: 'remembered' | 'osm';
  distanceM?: number;
}

/**
 * Reverse-geocode via Nominatim (OpenStreetMap). Zoom 16 lands on
 * feature-scale names — coves, hills, hamlets — rather than whole parishes.
 * Attribution: suggestions are "© OpenStreetMap contributors" (shown in UI).
 */
async function osmBestGuess(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=16&accept-language=en-GB`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Flutterby/0.1 (butterfly recording app; matt.thepie@gmail.com)',
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      name?: string;
      address?: Record<string, string>;
    };

    if (data.name) return data.name;
    const address = data.address ?? {};
    for (const key of [
      'tourism',
      'natural',
      'leisure',
      'isolated_dwelling',
      'farm',
      'hamlet',
      'croft',
      'suburb',
      'village',
      'neighbourhood',
      'locality',
      'town',
    ]) {
      const value = address[key];
      if (value) return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Remember a confirmed place for this recorder: bump an existing place with
 * the same name (case-insensitive), otherwise create it. Called when a report
 * is saved with a place name and coordinates.
 */
export async function rememberPlace(args: {
  recorderId: string;
  userId: string | null;
  name: string;
  gridRef: string | null;
  latitude: number;
  longitude: number;
}): Promise<void> {
  const existing = await db
    .select({ id: places.id })
    .from(places)
    .where(and(ownershipScope(args.recorderId, args.userId), ilike(places.name, args.name)))
    .limit(1);

  const found = existing[0];
  if (found) {
    await db
      .update(places)
      .set({ useCount: sql`${places.useCount} + 1`, lastUsedAt: new Date() })
      .where(eq(places.id, found.id));
    return;
  }

  await db.insert(places).values({
    recorderId: args.recorderId,
    userId: args.userId,
    name: args.name,
    gridRef: args.gridRef,
    latitude: args.latitude,
    longitude: args.longitude,
  });
}

export async function placeRoutes(app: FastifyInstance): Promise<void> {
  // Best guess for "where am I?": the recorder's own nearby places first
  // (regular sites keep their agreed name), then OpenStreetMap.
  app.get(
    '/api/places/suggest',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['recorderId', 'lat', 'lon'],
          properties: {
            recorderId: { type: 'string' },
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
          },
        },
      },
    },
    async (req) => {
      const { recorderId, lat, lon } = req.query as {
        recorderId: string;
        lat: number;
        lon: number;
      };
      const userId = await getUserId(req);

      const own = await db
        .select()
        .from(places)
        .where(ownershipScope(recorderId, userId))
        .limit(200);

      const nearby = own
        .map((p) => ({ name: p.name, distanceM: Math.round(distanceM(lat, lon, p.latitude, p.longitude)) }))
        .filter((p) => p.distanceM <= REMEMBERED_RADIUS_M)
        .sort((a, b) => a.distanceM - b.distanceM);

      const nearest = nearby[0];
      if (nearest) {
        const suggestion: Suggestion = { ...nearest, source: 'remembered' };
        return { suggestion, nearby: nearby.slice(0, 4) };
      }

      const guess = await osmBestGuess(lat, lon);
      const suggestion: Suggestion | null = guess ? { name: guess, source: 'osm' } : null;
      return { suggestion, nearby: [] };
    },
  );
}
