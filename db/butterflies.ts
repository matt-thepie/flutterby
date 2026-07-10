/**
 * The British butterfly list used to seed the reference table.
 *
 * `wikipediaTitle` is the article the seed script queries for an image
 * (falling back to the common name if the scientific-name article has none).
 * `sortOrder` controls the starter grid — garden-common, widespread species
 * are given low values so they surface first before a recorder has any history.
 */
export interface SpeciesSeed {
  commonName: string;
  scientificName: string;
  family: string;
  status: 'resident' | 'regular migrant' | 'rare migrant';
  wikipediaTitle: string;
  sortOrder: number;
}

export const BRITISH_BUTTERFLIES: SpeciesSeed[] = [
  // --- Common & widespread: the starter grid ---------------------------------
  { commonName: 'Red Admiral', scientificName: 'Vanessa atalanta', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Vanessa atalanta', sortOrder: 10 },
  { commonName: 'Painted Lady', scientificName: 'Vanessa cardui', family: 'Nymphalidae', status: 'regular migrant', wikipediaTitle: 'Vanessa cardui', sortOrder: 20 },
  { commonName: 'Small Tortoiseshell', scientificName: 'Aglais urticae', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Aglais urticae', sortOrder: 30 },
  { commonName: 'Peacock', scientificName: 'Aglais io', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Aglais io', sortOrder: 40 },
  { commonName: 'Comma', scientificName: 'Polygonia c-album', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Polygonia c-album', sortOrder: 50 },
  { commonName: 'Brimstone', scientificName: 'Gonepteryx rhamni', family: 'Pieridae', status: 'resident', wikipediaTitle: 'Gonepteryx rhamni', sortOrder: 60 },
  { commonName: 'Large White', scientificName: 'Pieris brassicae', family: 'Pieridae', status: 'resident', wikipediaTitle: 'Pieris brassicae', sortOrder: 70 },
  { commonName: 'Small White', scientificName: 'Pieris rapae', family: 'Pieridae', status: 'resident', wikipediaTitle: 'Pieris rapae', sortOrder: 80 },
  { commonName: 'Green-veined White', scientificName: 'Pieris napi', family: 'Pieridae', status: 'resident', wikipediaTitle: 'Pieris napi', sortOrder: 90 },
  { commonName: 'Orange-tip', scientificName: 'Anthocharis cardamines', family: 'Pieridae', status: 'resident', wikipediaTitle: 'Anthocharis cardamines', sortOrder: 100 },
  { commonName: 'Holly Blue', scientificName: 'Celastrina argiolus', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Celastrina argiolus', sortOrder: 110 },
  { commonName: 'Common Blue', scientificName: 'Polyommatus icarus', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Polyommatus icarus', sortOrder: 120 },
  { commonName: 'Small Copper', scientificName: 'Lycaena phlaeas', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Lycaena phlaeas', sortOrder: 130 },
  { commonName: 'Speckled Wood', scientificName: 'Pararge aegeria', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Pararge aegeria', sortOrder: 140 },
  { commonName: 'Gatekeeper', scientificName: 'Pyronia tithonus', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Pyronia tithonus', sortOrder: 150 },
  { commonName: 'Meadow Brown', scientificName: 'Maniola jurtina', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Maniola jurtina', sortOrder: 160 },
  { commonName: 'Ringlet', scientificName: 'Aphantopus hyperantus', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Aphantopus hyperantus', sortOrder: 170 },
  { commonName: 'Small Heath', scientificName: 'Coenonympha pamphilus', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Coenonympha pamphilus', sortOrder: 180 },
  { commonName: 'Large Skipper', scientificName: 'Ochlodes sylvanus', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Ochlodes sylvanus', sortOrder: 190 },
  { commonName: 'Small Skipper', scientificName: 'Thymelicus sylvestris', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Thymelicus sylvestris', sortOrder: 200 },
  { commonName: 'Marbled White', scientificName: 'Melanargia galathea', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Melanargia galathea', sortOrder: 210 },
  { commonName: 'Clouded Yellow', scientificName: 'Colias croceus', family: 'Pieridae', status: 'regular migrant', wikipediaTitle: 'Colias croceus', sortOrder: 220 },

  // --- Skippers --------------------------------------------------------------
  { commonName: 'Essex Skipper', scientificName: 'Thymelicus lineola', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Thymelicus lineola', sortOrder: 500 },
  { commonName: 'Lulworth Skipper', scientificName: 'Thymelicus acteon', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Thymelicus acteon', sortOrder: 500 },
  { commonName: 'Silver-spotted Skipper', scientificName: 'Hesperia comma', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Hesperia comma', sortOrder: 500 },
  { commonName: 'Dingy Skipper', scientificName: 'Erynnis tages', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Erynnis tages', sortOrder: 500 },
  { commonName: 'Grizzled Skipper', scientificName: 'Pyrgus malvae', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Pyrgus malvae', sortOrder: 500 },
  { commonName: 'Chequered Skipper', scientificName: 'Carterocephalus palaemon', family: 'Hesperiidae', status: 'resident', wikipediaTitle: 'Carterocephalus palaemon', sortOrder: 500 },

  // --- Swallowtail -----------------------------------------------------------
  { commonName: 'Swallowtail', scientificName: 'Papilio machaon', family: 'Papilionidae', status: 'resident', wikipediaTitle: 'Papilio machaon', sortOrder: 500 },

  // --- Whites & yellows ------------------------------------------------------
  { commonName: 'Wood White', scientificName: 'Leptidea sinapis', family: 'Pieridae', status: 'resident', wikipediaTitle: 'Leptidea sinapis', sortOrder: 500 },
  { commonName: 'Cryptic Wood White', scientificName: 'Leptidea juvernica', family: 'Pieridae', status: 'resident', wikipediaTitle: 'Leptidea juvernica', sortOrder: 500 },
  { commonName: 'Pale Clouded Yellow', scientificName: 'Colias hyale', family: 'Pieridae', status: 'rare migrant', wikipediaTitle: 'Colias hyale', sortOrder: 500 },

  // --- Hairstreaks, coppers & blues -----------------------------------------
  { commonName: 'Green Hairstreak', scientificName: 'Callophrys rubi', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Callophrys rubi', sortOrder: 500 },
  { commonName: 'Brown Hairstreak', scientificName: 'Thecla betulae', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Thecla betulae', sortOrder: 500 },
  { commonName: 'Purple Hairstreak', scientificName: 'Favonius quercus', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Favonius quercus', sortOrder: 500 },
  { commonName: 'White-letter Hairstreak', scientificName: 'Satyrium w-album', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Satyrium w-album', sortOrder: 500 },
  { commonName: 'Black Hairstreak', scientificName: 'Satyrium pruni', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Satyrium pruni', sortOrder: 500 },
  { commonName: 'Small Blue', scientificName: 'Cupido minimus', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Cupido minimus', sortOrder: 500 },
  { commonName: 'Silver-studded Blue', scientificName: 'Plebejus argus', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Plebejus argus', sortOrder: 500 },
  { commonName: 'Brown Argus', scientificName: 'Aricia agestis', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Aricia agestis', sortOrder: 500 },
  { commonName: 'Northern Brown Argus', scientificName: 'Aricia artaxerxes', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Aricia artaxerxes', sortOrder: 500 },
  { commonName: 'Chalk Hill Blue', scientificName: 'Polyommatus coridon', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Polyommatus coridon', sortOrder: 500 },
  { commonName: 'Adonis Blue', scientificName: 'Polyommatus bellargus', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Polyommatus bellargus', sortOrder: 500 },
  { commonName: 'Large Blue', scientificName: 'Phengaris arion', family: 'Lycaenidae', status: 'resident', wikipediaTitle: 'Phengaris arion', sortOrder: 500 },
  { commonName: 'Long-tailed Blue', scientificName: 'Lampides boeticus', family: 'Lycaenidae', status: 'rare migrant', wikipediaTitle: 'Lampides boeticus', sortOrder: 500 },

  // --- Duke of Burgundy ------------------------------------------------------
  { commonName: 'Duke of Burgundy', scientificName: 'Hamearis lucina', family: 'Riodinidae', status: 'resident', wikipediaTitle: 'Hamearis lucina', sortOrder: 500 },

  // --- Admirals, emperor, fritillaries --------------------------------------
  { commonName: 'White Admiral', scientificName: 'Limenitis camilla', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Limenitis camilla', sortOrder: 500 },
  { commonName: 'Purple Emperor', scientificName: 'Apatura iris', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Apatura iris', sortOrder: 500 },
  { commonName: 'Silver-washed Fritillary', scientificName: 'Argynnis paphia', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Argynnis paphia', sortOrder: 500 },
  { commonName: 'High Brown Fritillary', scientificName: 'Fabriciana adippe', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Fabriciana adippe', sortOrder: 500 },
  { commonName: 'Dark Green Fritillary', scientificName: 'Speyeria aglaja', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Speyeria aglaja', sortOrder: 500 },
  { commonName: 'Pearl-bordered Fritillary', scientificName: 'Boloria euphrosyne', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Boloria euphrosyne', sortOrder: 500 },
  { commonName: 'Small Pearl-bordered Fritillary', scientificName: 'Boloria selene', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Boloria selene', sortOrder: 500 },
  { commonName: 'Marsh Fritillary', scientificName: 'Euphydryas aurinia', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Euphydryas aurinia', sortOrder: 500 },
  { commonName: 'Glanville Fritillary', scientificName: 'Melitaea cinxia', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Melitaea cinxia', sortOrder: 500 },
  { commonName: 'Heath Fritillary', scientificName: 'Melitaea athalia', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Melitaea athalia', sortOrder: 500 },
  { commonName: 'Queen of Spain Fritillary', scientificName: 'Issoria lathonia', family: 'Nymphalidae', status: 'rare migrant', wikipediaTitle: 'Issoria lathonia', sortOrder: 500 },
  { commonName: 'Camberwell Beauty', scientificName: 'Nymphalis antiopa', family: 'Nymphalidae', status: 'rare migrant', wikipediaTitle: 'Nymphalis antiopa', sortOrder: 500 },
  { commonName: 'Monarch', scientificName: 'Danaus plexippus', family: 'Nymphalidae', status: 'rare migrant', wikipediaTitle: 'Danaus plexippus', sortOrder: 500 },

  // --- Browns (upland & coastal) --------------------------------------------
  { commonName: 'Wall', scientificName: 'Lasiommata megera', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Lasiommata megera', sortOrder: 500 },
  { commonName: 'Mountain Ringlet', scientificName: 'Erebia epiphron', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Erebia epiphron', sortOrder: 500 },
  { commonName: 'Scotch Argus', scientificName: 'Erebia aethiops', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Erebia aethiops', sortOrder: 500 },
  { commonName: 'Grayling', scientificName: 'Hipparchia semele', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Hipparchia semele', sortOrder: 500 },
  { commonName: 'Large Heath', scientificName: 'Coenonympha tullia', family: 'Nymphalidae', status: 'resident', wikipediaTitle: 'Coenonympha tullia', sortOrder: 500 },
];
