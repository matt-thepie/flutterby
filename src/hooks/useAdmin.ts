import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/**
 * Whether the current session may see the admin records page. Cosmetic gating
 * only — the server independently enforces the allowlist on every /api/admin
 * route. Re-checks whenever the signed-in user changes.
 */
export function useAdmin(userId: string | null): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    api
      .getAdminSession()
      .then((s) => active && setIsAdmin(s.isAdmin))
      .catch(() => active && setIsAdmin(false));
    return () => {
      active = false;
    };
  }, [userId]);

  return isAdmin;
}
