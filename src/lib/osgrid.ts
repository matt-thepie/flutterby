/**
 * Convert a WGS84 latitude/longitude (as returned by the browser Geolocation
 * API) into an Ordnance Survey National Grid reference, e.g. "TG 51409 13177".
 *
 * The maths is the standard Ordnance Survey approach documented in
 * "A guide to coordinate systems in Great Britain":
 *   1. WGS84 lat/lon           -> geocentric Cartesian (x,y,z)
 *   2. Helmert 7-parameter transform WGS84 -> OSGB36
 *   3. Cartesian -> lat/lon on the Airy 1830 ellipsoid
 *   4. Transverse Mercator projection -> eastings/northings
 *   5. Eastings/northings       -> grid-letter + numeric reference
 *
 * Implemented directly (rather than pulling in a dependency) so the one bit of
 * genuinely fiddly geodesy in this app is transparent and easy to test.
 */

const toRad = (deg: number): number => (deg * Math.PI) / 180;

interface Ellipsoid {
  a: number; // semi-major axis (m)
  b: number; // semi-minor axis (m)
}

const WGS84: Ellipsoid = { a: 6378137, b: 6356752.314245 };
const AIRY1830: Ellipsoid = { a: 6377563.396, b: 6356256.909 };

/** Helmert transform WGS84 -> OSGB36 (OS published parameters). */
const HELMERT = {
  tx: -446.448, // m
  ty: 125.157,
  tz: -542.06,
  s: 20.4894, // scale, ppm
  rx: -0.1502, // rotation, arc-seconds
  ry: -0.247,
  rz: -0.8421,
};

interface Cartesian {
  x: number;
  y: number;
  z: number;
}

function latLonToCartesian(lat: number, lon: number, ellipsoid: Ellipsoid): Cartesian {
  const phi = toRad(lat);
  const lambda = toRad(lon);
  const { a, b } = ellipsoid;
  const eSq = (a * a - b * b) / (a * a);

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const nu = a / Math.sqrt(1 - eSq * sinPhi * sinPhi);

  return {
    x: nu * cosPhi * Math.cos(lambda),
    y: nu * cosPhi * Math.sin(lambda),
    z: (1 - eSq) * nu * sinPhi,
  };
}

function applyHelmert(p: Cartesian): Cartesian {
  const s = HELMERT.s / 1e6 + 1; // ppm -> scale factor
  const rx = toRad(HELMERT.rx / 3600); // arc-seconds -> radians
  const ry = toRad(HELMERT.ry / 3600);
  const rz = toRad(HELMERT.rz / 3600);

  return {
    x: HELMERT.tx + p.x * s - p.y * rz + p.z * ry,
    y: HELMERT.ty + p.x * rz + p.y * s - p.z * rx,
    z: HELMERT.tz - p.x * ry + p.y * rx + p.z * s,
  };
}

function cartesianToLatLon(p: Cartesian, ellipsoid: Ellipsoid): { lat: number; lon: number } {
  const { a, b } = ellipsoid;
  const eSq = (a * a - b * b) / (a * a);
  const { x, y, z } = p;

  const pDist = Math.sqrt(x * x + y * y);
  let phi = Math.atan2(z, pDist * (1 - eSq));
  let phiPrev = 2 * Math.PI;

  // Iterate to convergence (a handful of passes is ample at these scales).
  let iterations = 0;
  while (Math.abs(phi - phiPrev) > 1e-12 && iterations < 20) {
    const sinPhi = Math.sin(phi);
    const nu = a / Math.sqrt(1 - eSq * sinPhi * sinPhi);
    phiPrev = phi;
    phi = Math.atan2(z + eSq * nu * sinPhi, pDist);
    iterations += 1;
  }

  return { lat: phi, lon: Math.atan2(y, x) };
}

/** Airy 1830 lat/lon (radians) -> National Grid eastings/northings (m). */
function latLonToEastingNorthing(phi: number, lambda: number): { e: number; n: number } {
  const { a, b } = AIRY1830;
  const F0 = 0.9996012717; // national grid scale factor on central meridian
  const phi0 = toRad(49);
  const lambda0 = toRad(-2);
  const N0 = -100000;
  const E0 = 400000;
  const eSq = (a * a - b * b) / (a * a);
  const n = (a - b) / (a + b);
  const n2 = n * n;
  const n3 = n * n * n;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const nu = (a * F0) / Math.sqrt(1 - eSq * sinPhi * sinPhi);
  const rho = (a * F0 * (1 - eSq)) / Math.pow(1 - eSq * sinPhi * sinPhi, 1.5);
  const eta2 = nu / rho - 1;

  const Ma = (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (phi - phi0);
  const Mb = (3 * n + 3 * n2 + (21 / 8) * n3) * Math.sin(phi - phi0) * Math.cos(phi + phi0);
  const Mc = ((15 / 8) * n2 + (15 / 8) * n3) * Math.sin(2 * (phi - phi0)) * Math.cos(2 * (phi + phi0));
  const Md = (35 / 24) * n3 * Math.sin(3 * (phi - phi0)) * Math.cos(3 * (phi + phi0));
  const M = b * F0 * (Ma - Mb + Mc - Md);

  const cos3Phi = cosPhi * cosPhi * cosPhi;
  const cos5Phi = cos3Phi * cosPhi * cosPhi;
  const tan2Phi = tanPhi * tanPhi;
  const tan4Phi = tan2Phi * tan2Phi;

  const I = M + N0;
  const II = (nu / 2) * sinPhi * cosPhi;
  const III = (nu / 24) * sinPhi * cos3Phi * (5 - tan2Phi + 9 * eta2);
  const IIIA = (nu / 720) * sinPhi * cos5Phi * (61 - 58 * tan2Phi + tan4Phi);
  const IV = nu * cosPhi;
  const V = (nu / 6) * cos3Phi * (nu / rho - tan2Phi);
  const VI = (nu / 120) * cos5Phi * (5 - 18 * tan2Phi + tan4Phi + 14 * eta2 - 58 * tan2Phi * eta2);

  const dLambda = lambda - lambda0;
  const dLambda2 = dLambda * dLambda;

  const northing = I + II * dLambda2 + III * dLambda2 * dLambda2 + IIIA * dLambda2 * dLambda2 * dLambda2;
  const easting = E0 + IV * dLambda + V * dLambda2 * dLambda + VI * dLambda2 * dLambda2 * dLambda;

  return { e: easting, n: northing };
}

export interface GridReference {
  /** Formatted reference, e.g. "TG 5140 1317". */
  text: string;
  /** Two-letter 100km square, e.g. "TG". */
  square: string;
  easting: number;
  northing: number;
  /** Number of digits used per axis (adapts to GPS accuracy). */
  digits: number;
}

/**
 * Eastings/northings -> grid-lettered reference.
 * `digits` is the number of digits per axis: 5 -> 1m, 4 -> 10m, 3 -> 100m,
 * 2 -> 1km, 1 -> 10km.
 */
function toGridReference(e: number, n: number, digits: number): GridReference | null {
  // Outside the National Grid (e.g. Channel Islands, or bad GPS) -> no ref.
  if (e < 0 || e >= 700000 || n < 0 || n >= 1300000) return null;

  const e100k = Math.floor(e / 100000);
  const n100k = Math.floor(n / 100000);

  // First letter (500km square), then second letter (100km square within it).
  let l1 = (19 - n100k) - ((19 - n100k) % 5) + Math.floor((e100k + 10) / 5);
  let l2 = ((19 - n100k) * 5) % 25 + (e100k % 5);

  // The grid skips the letter 'I'.
  if (l1 > 7) l1 += 1;
  if (l2 > 7) l2 += 1;

  const square = String.fromCharCode('A'.charCodeAt(0) + l1) + String.fromCharCode('A'.charCodeAt(0) + l2);

  const divisor = Math.pow(10, 5 - digits);
  const eStr = String(Math.floor((e % 100000) / divisor)).padStart(digits, '0');
  const nStr = String(Math.floor((n % 100000) / divisor)).padStart(digits, '0');

  return {
    text: `${square} ${eStr} ${nStr}`,
    square,
    easting: Math.round(e),
    northing: Math.round(n),
    digits,
  };
}

/** Choose grid precision to roughly match GPS accuracy (metres). */
function digitsForAccuracy(accuracyM: number | null | undefined): number {
  if (accuracyM == null || !Number.isFinite(accuracyM)) return 4; // 10m default
  if (accuracyM <= 10) return 5; // 1m
  if (accuracyM <= 100) return 4; // 10m
  if (accuracyM <= 1000) return 3; // 100m
  return 2; // 1km
}

/**
 * Full pipeline: WGS84 lat/lon (+ optional GPS accuracy) -> OS grid reference.
 * Returns null for coordinates outside Great Britain's National Grid.
 */
export function latLonToGridRef(
  lat: number,
  lon: number,
  accuracyM?: number | null,
): GridReference | null {
  const { e, n } = latLonToEN(lat, lon);
  return toGridReference(e, n, digitsForAccuracy(accuracyM));
}

/** WGS84 lat/lon -> National Grid eastings/northings (via OSGB36 datum shift). */
function latLonToEN(lat: number, lon: number): { e: number; n: number } {
  const wgsCartesian = latLonToCartesian(lat, lon, WGS84);
  const osgbCartesian = applyHelmert(wgsCartesian);
  const { lat: phi, lon: lambda } = cartesianToLatLon(osgbCartesian, AIRY1830);
  return latLonToEastingNorthing(phi, lambda);
}

/**
 * Compact, space-free grid reference at a fixed precision, e.g.
 * "SW1234567890" (10-figure / 1 m). Used for the county-recorder export, which
 * wants no spaces and full precision. `figures` is the total digit count
 * (10 = 5 per axis), clamped to even 2..10. Returns null outside GB.
 */
export function compactGridRef(lat: number, lon: number, figures = 10): string | null {
  const digits = Math.min(5, Math.max(1, Math.round(figures / 2)));
  const { e, n } = latLonToEN(lat, lon);
  const ref = toGridReference(e, n, digits);
  return ref ? ref.text.replace(/\s+/g, '') : null;
}
