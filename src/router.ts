import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'teams' }
  | { name: 'team'; id: string }
  | { name: 'newMatch'; teamId?: string }
  | { name: 'match'; id: string }
  | { name: 'history' }
  | { name: 'detail'; id: string };

export const parseHash = (hash: string): Route => {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'teams':
      return { name: 'teams' };
    case 'team':
      return { name: 'team', id: parts[1] ?? 'new' };
    case 'new-match':
      return { name: 'newMatch', teamId: parts[1] };
    case 'match':
      return parts[1] ? { name: 'match', id: parts[1] } : { name: 'home' };
    case 'history':
      return { name: 'history' };
    case 'detail':
      return parts[1] ? { name: 'detail', id: parts[1] } : { name: 'history' };
    default:
      return { name: 'home' };
  }
};

export const go = (path: string, replace = false) => {
  const h = '#/' + path.replace(/^\//, '');
  if (replace) history.replaceState(null, '', h);
  else location.hash = h;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
};

export const useRoute = () => {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
};
