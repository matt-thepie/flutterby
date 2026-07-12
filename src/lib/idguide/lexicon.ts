import type { Colour, Habitat, Marking, SizeClass } from './schema';

/**
 * BUILD-TIME ASSET — the extraction lexicon.
 *
 * Maps the words a lay observer actually uses onto the controlled-vocabulary
 * tokens in schema.ts ("tawny" → orange, "downland" → chalk_downland). The
 * runtime parser (parse.ts) is a gazetteer over these phrases — no model.
 *
 * Every value on the left MUST be a schema token; TypeScript enforces it.
 * Add synonyms freely; keep phrases lowercase.
 */

export const COLOUR_SYNONYMS: Record<Colour, string[]> = {
  orange: ['orange', 'tawny', 'ginger', 'rusty', 'rust', 'amber', 'fulvous'],
  brown: ['brown', 'tan', 'bronze', 'dun', 'chocolate', 'chestnut'],
  black: ['black', 'dark', 'sooty', 'blackish'],
  white: ['white', 'whitish'],
  cream: ['cream', 'creamy', 'buff', 'ivory', 'off-white'],
  yellow: ['yellow', 'lemon', 'sulphur', 'primrose'],
  green: ['green', 'greenish', 'olive'],
  blue: ['blue', 'azure', 'sky blue', 'sky-blue', 'cobalt'],
  purple: ['purple', 'violet', 'mauve', 'lilac'],
  red: ['red', 'scarlet', 'crimson'],
  copper: ['copper', 'coppery'],
  grey: ['grey', 'gray', 'silver', 'silvery', 'greyish'],
  gold: ['gold', 'golden'],
};

export const SIZE_SYNONYMS: Record<SizeClass, string[]> = {
  small: ['small', 'tiny', 'little', 'dainty', 'diminutive'],
  medium: ['medium', 'medium sized', 'medium-sized', 'mid sized', 'moderate', 'average'],
  large: ['large', 'big', 'huge', 'giant', 'massive'],
};

export const HABITAT_SYNONYMS: Record<Habitat, string[]> = {
  garden: ['garden', 'gardens', 'backyard', 'buddleia', 'flower bed', 'park'],
  grassland: ['grassland', 'grass', 'grassy', 'field', 'verge', 'lawn'],
  meadow: ['meadow', 'meadows', 'hay meadow'],
  woodland: ['wood', 'woods', 'woodland', 'forest', 'trees', 'copse'],
  woodland_edge: ['woodland edge', 'wood edge', 'ride', 'clearing', 'glade'],
  hedgerow: ['hedge', 'hedgerow', 'hedges', 'hedgerows'],
  heathland: ['heath', 'heathland', 'heather'],
  moorland: ['moor', 'moorland', 'moors'],
  chalk_downland: ['chalk', 'downland', 'downs', 'chalk grassland', 'chalk downland', 'limestone'],
  coastal: ['coast', 'coastal', 'seaside', 'dunes', 'sand dunes', 'shore'],
  cliff: ['cliff', 'cliffs', 'cliff top', 'clifftop', 'cliff-top'],
  marsh: ['marsh', 'marshland', 'marshy', 'wetland'],
  bog: ['bog', 'boggy', 'mire', 'peat bog'],
  fen: ['fen', 'fenland', 'fens'],
  farmland: ['farm', 'farmland', 'arable', 'crops', 'allotment', 'cabbage'],
  wasteland: ['wasteland', 'brownfield', 'waste ground', 'disturbed ground', 'roadside', 'railway'],
  mountain: ['mountain', 'mountains', 'upland', 'fell', 'summit'],
  scrub: ['scrub', 'scrubby', 'bushes', 'thicket', 'blackthorn'],
};

export const MARKING_SYNONYMS: Record<Marking, string[]> = {
  spots: ['spot', 'spots', 'spotted', 'dots', 'dotted', 'speckled'],
  eyespots: ['eyespot', 'eyespots', 'eye spot', 'eye spots', 'eyes', 'ocelli', 'eye-like', 'eye markings'],
  dark_border: ['dark border', 'black border', 'dark edge', 'black margin', 'dark margin', 'black tips', 'dark tips'],
  white_spots: ['white spots', 'silver spots', 'white dots', 'silver spotted', 'silver spots'],
  orange_border: ['orange border', 'orange band', 'orange spots', 'orange lunules', 'orange margin', 'red band'],
  tails: ['tail', 'tails', 'tailed', 'streamers', 'hindwing tails'],
  marbled: ['marbled', 'mottled', 'marbling', 'blotchy'],
  veined: ['veined', 'veins', 'veiny', 'lined veins'],
  comma_mark: ['comma', 'comma mark', 'c mark', 'c-shaped', 'white comma'],
  chequered: ['chequered', 'checkered', 'checked', 'checkerboard', 'chequerboard', 'lattice'],
  iridescent: ['iridescent', 'shimmering', 'sheen', 'shiny', 'metallic', 'purple sheen', 'glossy'],
  ragged_edge: ['ragged', 'jagged', 'scalloped', 'ragged edge', 'notched', 'angular', 'irregular edge'],
  streaked: ['streak', 'streaked', 'streaks', 'white streak', 'w mark', 'w-shaped', 'thin line'],
  plain: ['plain', 'unmarked', 'no markings', 'uniform', 'featureless'],
};

/** Named months → number. */
export const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

/** Seasonal / relative phrases → the months they cover. */
export const SEASON_MONTHS: Record<string, number[]> = {
  spring: [3, 4, 5],
  'early spring': [3, 4],
  'late spring': [5, 6],
  summer: [6, 7, 8],
  midsummer: [6, 7, 8],
  'mid summer': [6, 7, 8],
  'high summer': [7, 8],
  'early summer': [6, 7],
  'late summer': [8, 9],
  autumn: [9, 10, 11],
  fall: [9, 10, 11],
  'early autumn': [9, 10],
  'late autumn': [10, 11],
  winter: [12, 1, 2],
};
