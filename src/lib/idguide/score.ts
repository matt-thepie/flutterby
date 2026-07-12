import type { IdQuery, SizeClass, SpeciesFeatures } from './schema';
import { SPECIES_FEATURES } from './features';

/**
 * Feature weights. Flight period and colour are the most discriminating cues
 * and the ones lay observers report most reliably, so they lead.
 */
const WEIGHTS = {
  months: 3,
  colours: 3,
  habitats: 2,
  size: 1.5,
  markings: 1.5,
} as const;

const SIZE_ORDER: SizeClass[] = ['small', 'medium', 'large'];

/** Month match: exact 1, adjacent month 0.5 — score, don't filter. */
function monthMatch(queryMonths: number[], flightMonths: number[]): number {
  let best = 0;
  for (const q of queryMonths) {
    if (flightMonths.includes(q)) return 1;
    if (flightMonths.includes(q - 1) || flightMonths.includes(q + 1)) best = Math.max(best, 0.5);
  }
  return best;
}

function sizeMatch(query: SizeClass, species: SizeClass): number {
  const d = Math.abs(SIZE_ORDER.indexOf(query) - SIZE_ORDER.indexOf(species));
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
}

/** Fraction of the query's tokens present in the species' set. */
function overlap<T>(queryTokens: T[], speciesTokens: T[]): { score: number; matched: T[] } {
  const matched = queryTokens.filter((t) => speciesTokens.includes(t));
  return { score: queryTokens.length ? matched.length / queryTokens.length : 0, matched };
}

export interface FeatureEvidence {
  feature: 'months' | 'colours' | 'size' | 'habitats' | 'markings';
  matched: boolean;
  /** What the user asked for on this feature (labels), for display. */
  asked: string[];
  /** Which of those matched the species. */
  detail: string[];
}

export interface ScoredMatch {
  scientificName: string;
  /** 0–100, normalised by the features the user actually gave. */
  score: number;
  evidence: FeatureEvidence[];
}

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pretty = (t: string): string => t.replace(/_/g, ' ');

function scoreSpecies(query: IdQuery, species: SpeciesFeatures): ScoredMatch {
  let weighted = 0;
  let totalWeight = 0;
  const evidence: FeatureEvidence[] = [];

  if (query.months.length) {
    const m = monthMatch(query.months, species.flightMonths);
    weighted += WEIGHTS.months * m;
    totalWeight += WEIGHTS.months;
    evidence.push({
      feature: 'months',
      matched: m > 0,
      asked: query.months.map((q) => MONTH_LABELS[q]!),
      detail: query.months.filter((q) => species.flightMonths.includes(q)).map((q) => MONTH_LABELS[q]!),
    });
  }

  if (query.colours.length) {
    const { score, matched } = overlap(query.colours, species.colours);
    weighted += WEIGHTS.colours * score;
    totalWeight += WEIGHTS.colours;
    evidence.push({ feature: 'colours', matched: matched.length > 0, asked: query.colours, detail: matched });
  }

  if (query.size) {
    const m = sizeMatch(query.size, species.sizeClass);
    weighted += WEIGHTS.size * m;
    totalWeight += WEIGHTS.size;
    evidence.push({ feature: 'size', matched: m === 1, asked: [query.size], detail: m > 0 ? [species.sizeClass] : [] });
  }

  if (query.habitats.length) {
    const { score, matched } = overlap(query.habitats, species.habitats);
    weighted += WEIGHTS.habitats * score;
    totalWeight += WEIGHTS.habitats;
    evidence.push({ feature: 'habitats', matched: matched.length > 0, asked: query.habitats.map(pretty), detail: matched.map(pretty) });
  }

  if (query.markings.length) {
    const { score, matched } = overlap(query.markings, species.markings);
    weighted += WEIGHTS.markings * score;
    totalWeight += WEIGHTS.markings;
    evidence.push({ feature: 'markings', matched: matched.length > 0, asked: query.markings.map(pretty), detail: matched.map(pretty) });
  }

  const score = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0;
  return { scientificName: species.scientificName, score, evidence };
}

/**
 * Score every species against the query and return the best matches.
 * Pure and deterministic — no model, no network.
 */
export function scoreSpeciesList(query: IdQuery, limit = 8): ScoredMatch[] {
  return SPECIES_FEATURES.map((s) => scoreSpecies(query, s))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
