import { useCallback, useEffect, useState } from 'react';

export type Tab = 'log' | 'reports' | 'identify';
/** Top-level views: the tabbed app, or the admin-gated records page. */
export type View = Tab | 'records';

export interface Route {
  view: View;
  /** The active tab (defaults to 'log' when the view is the records page). */
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

  if (head === 'records') return { view: 'records', tab: 'log', speciesSlug: null };
  if (head === 'reports') return { view: 'reports', tab: 'reports', speciesSlug: null };
  if (head === 'identify') {
    return {
      view: 'identify',
      tab: 'identify',
      speciesSlug: parts[1] ? decodeURIComponent(parts[1]) : null,
    };
  }
  return { view: 'log', tab: 'log', speciesSlug: null };
}

/** Route → canonical path. */
export function routeToPath(view: View, speciesSlug?: string | null): string {
  if (view === 'identify' && speciesSlug) return `/identify/${speciesSlug}`;
  return `/${view}`;
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
