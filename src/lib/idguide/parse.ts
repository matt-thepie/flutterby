import {
  type Colour,
  type Habitat,
  type IdQuery,
  type Marking,
  type SizeClass,
  EMPTY_QUERY,
} from './schema';
import {
  COLOUR_SYNONYMS,
  HABITAT_SYNONYMS,
  MARKING_SYNONYMS,
  MONTH_NAMES,
  SEASON_MONTHS,
  SIZE_SYNONYMS,
} from './lexicon';

type Feature = 'colour' | 'size' | 'habitat' | 'marking';

interface PhraseEntry {
  phrase: string;
  feature: Feature;
  token: string;
}

/** Flatten every synonym map into one phrase → (feature, token) index. */
function buildPhraseIndex(): PhraseEntry[] {
  const entries: PhraseEntry[] = [];
  const add = (feature: Feature, map: Record<string, string[]>): void => {
    for (const [token, synonyms] of Object.entries(map)) {
      for (const phrase of synonyms) entries.push({ phrase, feature, token });
    }
  };
  add('colour', COLOUR_SYNONYMS);
  add('size', SIZE_SYNONYMS);
  add('habitat', HABITAT_SYNONYMS);
  add('marking', MARKING_SYNONYMS);
  // Longest phrases first so "sky blue" wins over "blue", "chalk grassland"
  // over "chalk", etc.
  return entries.sort((a, b) => b.phrase.length - a.phrase.length);
}

const PHRASE_INDEX = buildPhraseIndex();

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Levenshtein distance, capped early — used only for single-word typo recovery. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
      curr[j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > max) return max + 1;
    prev = curr;
  }
  return prev[b.length]!;
}

const SINGLE_WORD_SYNONYMS: PhraseEntry[] = PHRASE_INDEX.filter((e) => !e.phrase.includes(' '));

export interface ParsedQuery {
  query: IdQuery;
  /** Human-readable echo of what was understood, for the UI. */
  understood: string[];
}

/**
 * Parse free text into a structured query by gazetteer-matching the lexicon.
 * Deterministic: same text always yields the same query. A light single-word
 * Levenshtein pass recovers obvious typos ("orannge", "grassand").
 */
export function parseDescription(text: string): ParsedQuery {
  const normalised = ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ')} `;

  const colours = new Set<Colour>();
  const habitats = new Set<Habitat>();
  const markings = new Set<Marking>();
  let size: SizeClass | null = null;
  const months = new Set<number>();

  const applyToken = (feature: Feature, token: string): void => {
    if (feature === 'colour') colours.add(token as Colour);
    else if (feature === 'habitat') habitats.add(token as Habitat);
    else if (feature === 'marking') markings.add(token as Marking);
    else if (feature === 'size' && !size) size = token as SizeClass;
  };

  // 1. Exact phrase matches (longest first).
  for (const { phrase, feature, token } of PHRASE_INDEX) {
    const re = new RegExp(`(?<![a-z])${escapeRegExp(phrase)}(?![a-z])`);
    if (re.test(normalised)) applyToken(feature, token);
  }

  // 2. Months — named and seasonal.
  for (const [phrase, monthList] of Object.entries(SEASON_MONTHS)) {
    if (new RegExp(`(?<![a-z])${escapeRegExp(phrase)}(?![a-z])`).test(normalised)) {
      monthList.forEach((m) => months.add(m));
    }
  }
  for (const [name, month] of Object.entries(MONTH_NAMES)) {
    if (new RegExp(`(?<![a-z])${name}(?![a-z])`).test(normalised)) months.add(month);
  }

  // 3. Typo recovery: single words not already matched, distance ≤ 1.
  const words = normalised.trim().split(' ').filter((w) => w.length >= 5);
  for (const word of words) {
    for (const { phrase, feature, token } of SINGLE_WORD_SYNONYMS) {
      if (phrase.length < 5) continue;
      if (editDistance(word, phrase, 1) <= 1) applyToken(feature, token);
    }
  }

  const query: IdQuery = {
    months: [...months].sort((a, b) => a - b),
    colours: [...colours],
    size,
    habitats: [...habitats],
    markings: [...markings],
  };

  return { query, understood: describeQuery(query) };
}

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const prettyToken = (t: string): string => t.replace(/_/g, ' ');

/** Short human echo of a parsed query for the "I understood…" line. */
export function describeQuery(query: IdQuery): string[] {
  const parts: string[] = [];
  if (query.months.length) parts.push(query.months.map((m) => MONTH_LABELS[m]).join('/'));
  if (query.colours.length) parts.push(query.colours.join(', '));
  if (query.size) parts.push(`${query.size} size`);
  if (query.habitats.length) parts.push(query.habitats.map(prettyToken).join(', '));
  if (query.markings.length) parts.push(query.markings.map(prettyToken).join(', '));
  return parts;
}

export function isEmptyQuery(query: IdQuery): boolean {
  return (
    query.months.length === 0 &&
    query.colours.length === 0 &&
    query.size === null &&
    query.habitats.length === 0 &&
    query.markings.length === 0
  );
}

export { EMPTY_QUERY };
