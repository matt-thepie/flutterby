import type { FastifyRequest } from 'fastify';
import { auth } from './auth.js';

/** Convert Fastify's plain header bag into a Fetch Headers object for Better Auth. */
export function toHeaders(req: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.append(key, String(value));
  }
  return headers;
}

/** The signed-in user's id for this request, or null if anonymous. */
export async function getUserId(req: FastifyRequest): Promise<string | null> {
  const result = await auth.api.getSession({ headers: toHeaders(req) });
  return result?.user.id ?? null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** The signed-in user (id, email, name) for this request, or null if anonymous. */
export async function getUser(req: FastifyRequest): Promise<SessionUser | null> {
  const result = await auth.api.getSession({ headers: toHeaders(req) });
  if (!result?.user) return null;
  return { id: result.user.id, email: result.user.email, name: result.user.name };
}
