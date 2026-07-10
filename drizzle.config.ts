import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // drizzle-kit loads .env automatically; DATABASE_URL is required for
    // `npm run db:push` and `npm run db:studio`.
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
