import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { butterflies } from './schema';
import { BRITISH_BUTTERFLIES, type SpeciesSeed } from './butterflies';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL), { schema: { butterflies } });

const USER_AGENT = 'Flutterby/0.1 (https://github.com/matt-thepie/flutterby; butterfly recording app)';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Wikimedia only serves thumbnails at an allowed set of widths (see
// https://w.wiki/GHai) — anything else returns 400. 500px is on the list and
// crisp on retina at the card's rendered size.
const CARD_WIDTH = 500;

interface WikiSummary {
  thumbnail?: { source?: string };
  originalimage?: { source?: string; width?: number };
}

/**
 * Pick an image URL at a sensible size. Wikimedia 400s if you request a
 * thumbnail wider than the source, so only ask for CARD_WIDTH when the
 * original is at least that wide; otherwise use the original itself.
 */
function pickImage(data: WikiSummary): string | null {
  const thumb = data.thumbnail?.source;
  if (!thumb) return null;
  const originalWidth = data.originalimage?.width ?? 0;
  if (originalWidth >= CARD_WIDTH) return thumb.replace(/\/\d+px-/, `/${CARD_WIDTH}px-`);
  return data.originalimage?.source ?? thumb;
}

/** Fetch a representative image for a species from the Wikipedia REST summary. */
async function fetchImageUrl(species: SpeciesSeed): Promise<string | null> {
  const titles = [species.wikipediaTitle, species.commonName];

  for (const title of titles) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, accept: 'application/json' },
      });
      if (!res.ok) continue;
      const image = pickImage((await res.json()) as WikiSummary);
      if (image) return image;
    } catch (err) {
      console.warn(`  ! image lookup failed for "${title}":`, (err as Error).message);
    }
  }
  return null;
}

async function seed(): Promise<void> {
  console.log(`Seeding ${BRITISH_BUTTERFLIES.length} British butterflies…`);
  let withImage = 0;

  for (const species of BRITISH_BUTTERFLIES) {
    const imageUrl = await fetchImageUrl(species);
    if (imageUrl) withImage += 1;

    await db
      .insert(butterflies)
      .values({
        commonName: species.commonName,
        scientificName: species.scientificName,
        family: species.family,
        status: species.status,
        wikipediaTitle: species.wikipediaTitle,
        sortOrder: species.sortOrder,
        imageUrl,
      })
      .onConflictDoUpdate({
        target: butterflies.scientificName,
        set: {
          commonName: species.commonName,
          family: species.family,
          status: species.status,
          wikipediaTitle: species.wikipediaTitle,
          sortOrder: species.sortOrder,
          imageUrl,
        },
      });

    console.log(`  ✓ ${species.commonName}${imageUrl ? '' : '  (no image found)'}`);
    await sleep(120); // be polite to the Wikimedia API
  }

  console.log(`\nDone. ${BRITISH_BUTTERFLIES.length} species seeded, ${withImage} with images.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
