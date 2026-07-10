import Fastify, { type FastifyInstance } from 'fastify';
import { enabledProviders } from './auth';
import { authRoutes } from './routes/auth';
import { butterflyRoutes } from './routes/butterflies';
import { sightingRoutes } from './routes/sightings';
import { accountRoutes } from './routes/account';

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
