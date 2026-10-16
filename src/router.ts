/** Minimal hash router: #/path/segments?query — deep links work on GitHub Pages. */
import { useEffect, useState } from 'react';

export interface Route {
  path: string;
  parts: string[];
  query: URLSearchParams;
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '') || '/';
  const [p, q = ''] = h.split('?');
  const path = p.startsWith('/') ? p : `/${p}`;
  return { path, parts: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function href(path: string, query?: Record<string, string | number | undefined>): string {
  const q = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '') as [string, string][]).toString() : '';
  return `#${path}${q ? `?${q}` : ''}`;
}

export function navigate(path: string, query?: Record<string, string | number | undefined>, replace = false): void {
  const h = href(path, query);
  if (replace) window.location.replace(h);
  else window.location.hash = h.slice(1);
}

/** Absolute shareable URL for a hash route. */
export function shareUrl(path: string): string {
  return `${window.location.origin}${window.location.pathname}#${path}`;
}
