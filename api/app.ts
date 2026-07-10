import Fastify, { type FastifyInstance } from 'fastify';
import { butterflyRoutes } from './routes/butterflies';
import { sightingRoutes } from './routes/sightings';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
    // Vercel terminates TLS and sets the forwarded headers for us.
    trustProxy: true,
  });

  app.get('/api/health', async () => ({ ok: true }));

  app.register(butterflyRoutes);
  app.register(sightingRoutes);

  return app;
}
