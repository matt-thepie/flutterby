import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from './app';

// One Fastify instance per warm serverless container; Vercel rewrites all
// /api/* requests here (see vercel.json) and Fastify routes them internally.
const app = buildApp();
const ready = app.ready();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await ready;
  app.server.emit('request', req, res);
}
