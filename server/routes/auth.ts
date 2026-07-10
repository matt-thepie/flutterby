import type { FastifyInstance } from 'fastify';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../auth';

/**
 * Mounts Better Auth's own routes at /api/auth/*. Registered as a plugin so the
 * content-type parser tweak below is encapsulated: Better Auth reads the raw
 * request body itself, so we must stop Fastify from consuming it — but only for
 * these routes, not the JSON API elsewhere.
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.addContentTypeParser('application/json', (_req, _payload, done) => done(null, null));

  const handler = toNodeHandler(auth);
  app.all('/api/auth/*', async (request, reply) => {
    reply.hijack();
    await handler(request.raw, reply.raw);
  });
}
