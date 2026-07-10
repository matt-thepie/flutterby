import { createAuthClient } from 'better-auth/react';

// Same-origin: the auth routes live at /api/auth on this very host, so the
// client's default baseURL (the current origin) is exactly right.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
