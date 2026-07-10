import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as authSchema from '../db/auth-schema';

/**
 * Only wire up the social providers whose credentials are actually present, so
 * the app runs fine with none configured (login just won't be offered).
 * Google and Facebook OAuth apps are free; "Sign in with Apple" needs a paid
 * Apple Developer account, so its slot only activates once those creds exist.
 */
type SocialProviders = NonNullable<Parameters<typeof betterAuth>[0]['socialProviders']>;

function buildSocialProviders(): SocialProviders {
  const providers: SocialProviders = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    };
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    };
  }

  return providers;
}

const socialProviders = buildSocialProviders();

export const auth = betterAuth({
  // Better Auth also reads BETTER_AUTH_URL / BETTER_AUTH_SECRET from the env.
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  socialProviders,
  session: {
    // Sightings are cheap to sync; a long session keeps field use frictionless.
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
});

/** The social providers that are configured — surfaced to the client for the UI. */
export const enabledProviders = Object.keys(socialProviders) as Array<keyof SocialProviders>;
