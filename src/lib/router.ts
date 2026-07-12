import { useCallback, useEffect, useState } from 'react';

export type Tab = 'log' | 'reports' | 'identify';

export interface Route {
  tab: Tab;
  /** Species slug when a detail panel is open, e.g. /identify/small-copper. */
  speciesSlug: string | null;
}

/** "Queen of Spain Fritillary" → "queen-of-spain-fritillary". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Path → route. Unknown paths fall back to the Log tab. */
export function parsePath(pathname: string): Route {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');
  const head = parts[0] ?? '';

  if (head === 'reports') return { tab: 'reports', speciesSlug: null };
  if (head === 'identify') {
    return { tab: 'identify', speciesSlug: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  return { tab: 'log', speciesSlug: null };
}

/** Route → canonical path. */
export function routeToPath(tab: Tab, speciesSlug?: string | null): string {
  if (tab === 'identify' && speciesSlug) return `/identify/${speciesSlug}`;
  return `/${tab}`;
}

interface NavigateOptions {
  replace?: boolean;
}

export interface Router {
  route: Route;
  navigate: (path: string, options?: NavigateOptions) => void;
}

/**
 * Minimal History-API router. pushState for navigations (so the browser/Android
 * back button works), replaceState where a new history entry would be noise.
 * Listens to popstate to stay in sync with back/forward.
 */
export function useRouter(): Router {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname));

  useEffect(() => {
    const onPop = (): void => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path: string, options?: NavigateOptions) => {
    if (path === window.location.pathname) return;
    if (options?.replace) window.history.replaceState(null, '', path);
    else window.history.pushState(null, '', path);
    setRoute(parsePath(path));
  }, []);

  return { route, navigate };
}
