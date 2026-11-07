import { SETS_TO_WIN, STAT_TYPES } from './constants';
import type { Match, Player, SetRecord, Side, StatCategory, StatEvent } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const other = (s: Side): Side => (s === 'us' ? 'them' : 'us');

/**
 * Rotation dans le sens des aiguilles d'une montre :
 * le joueur en 2 passe en 1 (au service), 1 → 6, 6 → 5, 5 → 4, 4 → 3, 3 → 2.
 * lineup[0] = poste 1 … lineup[5] = poste 6
 */
export const rotate = (lineup: string[]): string[] => [...lineup.slice(1), lineup[0]];

export const pointsToWin = (setIndex: number) => (setIndex === 4 ? 15 : 25);

/** Le set est-il terminé (25 pts / 15 au tie-break, 2 points d'écart) ? */
export const setOverWinner = (set: SetRecord): Side | null => {
  const target = pointsToWin(set.index);
  const { scoreUs: a, scoreThem: b } = set;
  if (a >= target && a - b >= 2) return 'us';
  if (b >= target && b - a >= 2) return 'them';
  return null;
};

export const setsWon = (match: Match) => {
  let us = 0;
  let them = 0;
  for (const s of match.sets) {
    if (!s.finished) continue;
    if (s.winner === 'us') us++;
    else if (s.winner === 'them') them++;
  }
  return { us, them };
};

export const matchWinnerFromSets = (match: Match): Side | null => {
  const w = setsWon(match);
  if (w.us >= SETS_TO_WIN) return 'us';
  if (w.them >= SETS_TO_WIN) return 'them';
  return null;
};

export const currentSet = (match: Match): SetRecord | undefined => {
  const last = match.sets[match.sets.length - 1];
  return last && !last.finished ? last : undefined;
};

/** Applique un point gagné par `winner` (score + rotation si reprise de service). */
export const applyPoint = (set: SetRecord, winner: Side, statId?: string): SetRecord => {
  const s: SetRecord = { ...set };
  if (winner === 'us') s.scoreUs += 1;
  else s.scoreThem += 1;
  if (winner === 'us' && s.serving === 'them') {
    // on reprend le service → on tourne
    s.lineup = rotate(s.lineup);
  }
  s.serving = winner;
  s.points = [
    ...s.points,
    { id: uid(), winner, scoreUs: s.scoreUs, scoreThem: s.scoreThem, statId, t: Date.now() },
  ];
  return s;
};

export const newSet = (index: number, lineup: string[], firstServe: Side): SetRecord => ({
  index,
  startingLineup: [...lineup],
  firstServe,
  lineup: [...lineup],
  serving: firstServe,
  scoreUs: 0,
  scoreThem: 0,
  points: [],
  stats: [],
  subs: [],
  timeouts: [],
  finished: false,
  startedAt: Date.now(),
});

export const serializeSet = (set: SetRecord) => JSON.stringify(set);

export const playerById = (players: Player[], id: string) => players.find((p) => p.id === id);

export const playerLabel = (p?: Player) => (p ? `#${p.number} ${p.name}` : '?');

/* ----------------------------- Statistiques ----------------------------- */

export interface PlayerStats {
  playerId: string;
  faute: number;
  erreur: number;
  reussite: number;
  /** points directement marqués (ace, attaque, contre gagnant) */
  pointsWon: number;
  byCode: Record<string, number>; // clé = `${category}:${code}`
}

export const emptyPlayerStats = (playerId: string): PlayerStats => ({
  playerId,
  faute: 0,
  erreur: 0,
  reussite: 0,
  pointsWon: 0,
  byCode: {},
});

export const aggregateStats = (stats: StatEvent[]) => {
  const map = new Map<string, PlayerStats>();
  for (const e of stats) {
    let ps = map.get(e.playerId);
    if (!ps) {
      ps = emptyPlayerStats(e.playerId);
      map.set(e.playerId, ps);
    }
    ps[e.category] += 1;
    const key = `${e.category}:${e.code}`;
    ps.byCode[key] = (ps.byCode[key] ?? 0) + 1;
    const type = STAT_TYPES[e.category].find((t) => t.code === e.code);
    if (type?.point === 'us') ps.pointsWon += 1;
  }
  return map;
};

export const totalsByCategory = (stats: StatEvent[]) => {
  const t: Record<StatCategory, number> = { faute: 0, erreur: 0, reussite: 0 };
  for (const e of stats) t[e.category] += 1;
  return t;
};

export const countByCode = (stats: StatEvent[], category: StatCategory) => {
  const res: Record<string, number> = {};
  for (const e of stats) if (e.category === category) res[e.code] = (res[e.code] ?? 0) + 1;
  return res;
};

/** Points gagnés sur nos actions vs sur erreurs adverses */
export const pointBreakdown = (sets: SetRecord[]) => {
  let usTotal = 0;
  let themTotal = 0;
  let usFromOurActions = 0;
  let themFromOurMistakes = 0;
  for (const s of sets) {
    usTotal += s.scoreUs;
    themTotal += s.scoreThem;
    for (const e of s.stats) {
      const type = STAT_TYPES[e.category].find((t) => t.code === e.code);
      if (type?.point === 'us') usFromOurActions++;
      if (type?.point === 'them') themFromOurMistakes++;
    }
  }
  return {
    usTotal,
    themTotal,
    usFromOurActions,
    usFromOppMistakes: Math.max(0, usTotal - usFromOurActions),
    themFromOurMistakes,
    themFromOppActions: Math.max(0, themTotal - themFromOurMistakes),
  };
};

/** Série en cours / plus longue série de points */
export const longestRun = (set: SetRecord) => {
  let best = { side: null as Side | null, len: 0 };
  let cur = { side: null as Side | null, len: 0 };
  for (const p of set.points) {
    if (p.winner === cur.side) cur.len++;
    else cur = { side: p.winner, len: 1 };
    if (cur.len > best.len) best = { ...cur };
  }
  return best;
};

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDuration = (ms: number) => {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
};
