import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env (see README).');
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
