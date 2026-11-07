import { useSyncExternalStore } from 'react';
import { statType } from './constants';
import {
  applyPoint,
  matchWinnerFromSets,
  newSet,
  serializeSet,
  setOverWinner,
  uid,
} from './logic';
import type {
  ActionKind,
  AppData,
  Match,
  Player,
  SetRecord,
  Settings,
  Side,
  StatCategory,
  Team,
} from './types';

const KEY = 'volleystat:v1';
const MAX_UNDO = 40;

const empty: AppData = { teams: [], matches: [], settings: { autoPoint: true } };

const load = (): AppData => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      teams: parsed.teams ?? [],
      matches: parsed.matches ?? [],
      settings: { ...empty.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return empty;
  }
};

let state: AppData = load();
const listeners = new Set<() => void>();

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Sauvegarde impossible', e);
  }
};

const set = (next: AppData) => {
  state = next;
  persist();
  listeners.forEach((l) => l());
};

export const useData = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );

export const getData = () => state;

/* -------------------------------- Équipes ------------------------------- */

export const saveTeam = (team: Team) => {
  const exists = state.teams.some((t) => t.id === team.id);
  set({
    ...state,
    teams: exists ? state.teams.map((t) => (t.id === team.id ? team : t)) : [...state.teams, team],
  });
};

export const deleteTeam = (id: string) => set({ ...state, teams: state.teams.filter((t) => t.id !== id) });

export const updateSettings = (s: Partial<Settings>) => set({ ...state, settings: { ...state.settings, ...s } });

/* -------------------------------- Matchs -------------------------------- */

export const createMatch = (input: {
  team: Team;
  opponent: string;
  opponentLevel: string;
  date: string;
  players: Player[];
}): string => {
  const m: Match = {
    id: uid(),
    teamId: input.team.id,
    teamName: input.team.name,
    teamLevel: input.team.level,
    teamGender: input.team.gender,
    opponent: input.opponent,
    opponentLevel: input.opponentLevel,
    date: input.date,
    players: input.players.map((p) => ({ ...p })),
    sets: [],
    status: 'setup',
    undo: [],
    createdAt: Date.now(),
  };
  set({ ...state, matches: [...state.matches, m] });
  return m.id;
};

export const deleteMatch = (id: string) => set({ ...state, matches: state.matches.filter((m) => m.id !== id) });

const updateMatch = (id: string, fn: (m: Match) => Match) =>
  set({ ...state, matches: state.matches.map((m) => (m.id === id ? fn(m) : m)) });

export const updateMatchPlayers = (id: string, players: Player[]) =>
  updateMatch(id, (m) => ({ ...m, players }));

export const startSet = (matchId: string, lineup: string[], firstServe: Side) =>
  updateMatch(matchId, (m) => ({
    ...m,
    status: 'live',
    undo: [],
    sets: [...m.sets.filter((s) => s.finished), newSet(m.sets.filter((s) => s.finished).length, lineup, firstServe)],
  }));

/** Applique une modification sur le set en cours, en mémorisant l'état précédent pour l'annulation. */
const setAction = (
  matchId: string,
  kind: ActionKind,
  label: string,
  winner: Side | undefined,
  fn: (s: SetRecord) => SetRecord,
) =>
  updateMatch(matchId, (m) => {
    const idx = m.sets.length - 1;
    const cur = m.sets[idx];
    if (!cur || cur.finished) return m;
    const next = fn(cur);
    const undo = [...m.undo, { kind, label, winner, before: serializeSet(cur) }].slice(-MAX_UNDO);
    return { ...m, undo, sets: m.sets.map((s, i) => (i === idx ? next : s)) };
  });

export const addPoint = (matchId: string, side: Side) =>
  setAction(matchId, 'point', side === 'us' ? 'Point pour nous' : 'Point adverse', side, (s) =>
    setOverWinner(s) ? s : applyPoint(s, side),
  );

export const undo = (matchId: string) =>
  updateMatch(matchId, (m) => {
    const last = m.undo[m.undo.length - 1];
    const idx = m.sets.length - 1;
    if (!last || idx < 0 || m.sets[idx].finished) return m;
    const restored = JSON.parse(last.before) as SetRecord;
    return { ...m, undo: m.undo.slice(0, -1), sets: m.sets.map((s, i) => (i === idx ? restored : s)) };
  });

/**
 * Bouton « − » : si la dernière action est un point de cette équipe, on l'annule
 * (score + rotation + stat associée). Sinon simple correction du score.
 */
export const removePoint = (matchId: string, side: Side) => {
  const m = state.matches.find((x) => x.id === matchId);
  if (!m) return;
  const last = m.undo[m.undo.length - 1];
  if (last && (last.kind === 'point' || last.kind === 'stat') && last.winner === side) {
    undo(matchId);
    return;
  }
  setAction(matchId, 'manual', 'Correction du score', undefined, (s) => {
    if (side === 'us' && s.scoreUs > 0) return { ...s, scoreUs: s.scoreUs - 1 };
    if (side === 'them' && s.scoreThem > 0) return { ...s, scoreThem: s.scoreThem - 1 };
    return s;
  });
};

export const addStat = (matchId: string, playerId: string, category: StatCategory, code: string) => {
  const type = statType(category, code);
  const auto = state.settings.autoPoint && type?.point ? type.point : undefined;
  setAction(matchId, 'stat', type?.label ?? code, auto, (s) => {
    const stat = {
      id: uid(),
      playerId,
      category,
      code,
      scoreUs: s.scoreUs,
      scoreThem: s.scoreThem,
      t: Date.now(),
    };
    const withStat = { ...s, stats: [...s.stats, stat] };
    return auto && !setOverWinner(s) ? applyPoint(withStat, auto, stat.id) : withStat;
  });
};

export const substitute = (matchId: string, position: number, playerIn: string, libero: boolean) =>
  setAction(matchId, 'sub', libero ? 'Remplacement libéro' : 'Changement', undefined, (s) => {
    const playerOut = s.lineup[position - 1];
    const lineup = [...s.lineup];
    lineup[position - 1] = playerIn;
    return {
      ...s,
      lineup,
      subs: [
        ...s.subs,
        {
          id: uid(),
          playerOut,
          playerIn,
          position,
          libero,
          scoreUs: s.scoreUs,
          scoreThem: s.scoreThem,
          t: Date.now(),
        },
      ],
    };
  });

export const addTimeout = (matchId: string, side: Side) =>
  setAction(matchId, 'timeout', side === 'us' ? 'Temps mort' : 'Temps mort adverse', undefined, (s) => ({
    ...s,
    timeouts: [...s.timeouts, { id: uid(), side, scoreUs: s.scoreUs, scoreThem: s.scoreThem, t: Date.now() }],
  }));

/** Valide la fin du set en cours. Retourne true si le match est terminé. */
export const validateSet = (matchId: string): boolean => {
  let finished = false;
  updateMatch(matchId, (m) => {
    const idx = m.sets.length - 1;
    const cur = m.sets[idx];
    if (!cur || cur.finished) return m;
    const winner = setOverWinner(cur);
    if (!winner) return m;
    const sets = m.sets.map((s, i) => (i === idx ? { ...s, finished: true, winner, endedAt: Date.now() } : s));
    const next = { ...m, sets, undo: [] };
    const mw = matchWinnerFromSets(next);
    if (mw) {
      finished = true;
      return { ...next, status: 'finished', winner: mw, finishedAt: Date.now() };
    }
    return { ...next, status: 'setup' };
  });
  return finished;
};

/** Arrêt du match avant la fin (abandon, match amical…) */
export const endMatchNow = (matchId: string) =>
  updateMatch(matchId, (m) => {
    // un set en cours non terminé est conservé comme set incomplet
    const sets = m.sets.map((s) => (s.finished ? s : { ...s, finished: true, winner: setOverWinner(s) ?? undefined, endedAt: Date.now() }));
    const won = sets.filter((s) => s.winner === 'us').length;
    const lost = sets.filter((s) => s.winner === 'them').length;
    return {
      ...m,
      sets: sets.filter((s) => s.points.length > 0 || s.stats.length > 0 || s.winner),
      status: 'finished',
      undo: [],
      winner: won > lost ? 'us' : lost > won ? 'them' : undefined,
      finishedAt: Date.now(),
    };
  });

/* ------------------------------ Sauvegarde ------------------------------ */

export const exportData = () => JSON.stringify(state, null, 2);

export const importData = (raw: string) => {
  const parsed = JSON.parse(raw) as AppData;
  if (!Array.isArray(parsed.teams) || !Array.isArray(parsed.matches)) throw new Error('Fichier invalide');
  set({ teams: parsed.teams, matches: parsed.matches, settings: { ...empty.settings, ...(parsed.settings ?? {}) } });
};
