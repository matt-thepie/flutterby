import Fastify, { type FastifyInstance } from 'fastify';
import { enabledProviders } from './auth.js';
import { authRoutes } from './routes/auth.js';
import { butterflyRoutes } from './routes/butterflies.js';
import { sightingRoutes } from './routes/sightings.js';
import { accountRoutes } from './routes/account.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
    // Vercel terminates TLS and sets the forwarded headers for us.
    trustProxy: true,
  });

  app.get('/api/health', async () => ({ ok: true }));

  // Tells the client which social sign-in buttons to show (only configured ones).
  app.get('/api/config', async () => ({ providers: enabledProviders }));

  app.register(authRoutes);
  app.register(butterflyRoutes);
  app.register(sightingRoutes);
  app.register(accountRoutes);

  return app;
}
