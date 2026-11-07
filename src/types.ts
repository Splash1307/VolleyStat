export type Gender = 'F' | 'M' | 'X';
export type Side = 'us' | 'them';
export type StatCategory = 'faute' | 'erreur' | 'reussite';
export type Poste = '' | 'Passeur' | 'Pointu' | 'Réceptionneur-attaquant' | 'Central' | 'Libéro';

export interface Player {
  id: string;
  name: string;
  number: number;
  poste: Poste;
}

export interface Team {
  id: string;
  name: string;
  level: string;
  gender: Gender;
  players: Player[];
  createdAt: number;
}

export interface PointEvent {
  id: string;
  winner: Side;
  scoreUs: number;
  scoreThem: number;
  /** stat à l'origine du point (si point automatique) */
  statId?: string;
  t: number;
}

export interface StatEvent {
  id: string;
  playerId: string;
  category: StatCategory;
  code: string;
  /** score au moment de l'action (avant point éventuel) */
  scoreUs: number;
  scoreThem: number;
  t: number;
}

export interface SubEvent {
  id: string;
  playerOut: string;
  playerIn: string;
  /** position 1..6 */
  position: number;
  libero: boolean;
  scoreUs: number;
  scoreThem: number;
  t: number;
}

export interface TimeoutEvent {
  id: string;
  side: Side;
  scoreUs: number;
  scoreThem: number;
  t: number;
}

export type ActionKind = 'point' | 'stat' | 'sub' | 'timeout' | 'manual';

export interface UndoEntry {
  kind: ActionKind;
  label: string;
  winner?: Side;
  /** état du set (sans pile d'annulation) avant l'action */
  before: string;
}

export interface SetRecord {
  index: number;
  /** index 0 = poste 1, … index 5 = poste 6 */
  startingLineup: string[];
  firstServe: Side;
  lineup: string[];
  serving: Side;
  scoreUs: number;
  scoreThem: number;
  points: PointEvent[];
  stats: StatEvent[];
  subs: SubEvent[];
  timeouts: TimeoutEvent[];
  finished: boolean;
  winner?: Side;
  startedAt: number;
  endedAt?: number;
}

export type MatchStatus = 'setup' | 'live' | 'finished';

export interface Match {
  id: string;
  teamId: string;
  teamName: string;
  teamLevel: string;
  teamGender: Gender;
  opponent: string;
  opponentLevel: string;
  date: string;
  /** copie des joueurs présents (l'historique reste juste même si l'équipe change) */
  players: Player[];
  sets: SetRecord[];
  status: MatchStatus;
  winner?: Side;
  undo: UndoEntry[];
  createdAt: number;
  finishedAt?: number;
}

export interface Settings {
  autoPoint: boolean;
}

export interface AppData {
  teams: Team[];
  matches: Match[];
  settings: Settings;
}
