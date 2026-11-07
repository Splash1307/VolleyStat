import type { Gender, Poste, Side, StatCategory } from './types';

export const LEVELS = [
  'M11',
  'M13',
  'M15',
  'M18',
  'M21',
  'Loisir',
  'Départemental',
  'Régional',
  'Pré-National',
  'Nationale 3',
  'Nationale 2',
  'Nationale 1',
  'Élite',
  'Ligue B',
  'Ligue A',
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'F', label: 'Féminine' },
  { value: 'M', label: 'Masculine' },
  { value: 'X', label: 'Mixte' },
];

export const genderLabel = (g: Gender) => GENDERS.find((x) => x.value === g)?.label ?? g;

export const POSTES: Poste[] = ['', 'Passeur', 'Pointu', 'Réceptionneur-attaquant', 'Central', 'Libéro'];

export const posteShort = (p: Poste) =>
  ({
    '': '',
    Passeur: 'PASS',
    Pointu: 'PTU',
    'Réceptionneur-attaquant': 'R4',
    Central: 'CTR',
    Libéro: 'LIB',
  })[p];

export interface StatType {
  code: string;
  label: string;
  /** à qui revient le point quand l'action est enregistrée (null = pas de point) */
  point: Side | null;
}

export const CATEGORIES: { value: StatCategory; label: string; color: string; hint: string }[] = [
  { value: 'faute', label: 'Faute', color: 'var(--faute)', hint: 'Faute de règlement' },
  { value: 'erreur', label: 'Échec', color: 'var(--erreur)', hint: 'Erreur technique' },
  { value: 'reussite', label: 'Réussite', color: 'var(--reussite)', hint: 'Action réussie' },
];

export const STAT_TYPES: Record<StatCategory, StatType[]> = {
  faute: [
    { code: 'filet', label: 'Faute de filet', point: 'them' },
    { code: 'penetration', label: 'Pénétration (ligne centrale)', point: 'them' },
    { code: 'mordu_service', label: 'Mordu au service', point: 'them' },
    { code: 'mordu_3m', label: 'Mordu aux 3 m (attaque arrière)', point: 'them' },
    { code: 'double', label: 'Double touche', point: 'them' },
    { code: 'porte', label: 'Ballon porté / tenu', point: 'them' },
    { code: 'quatre', label: '4 touches', point: 'them' },
    { code: 'position', label: 'Faute de position / rotation', point: 'them' },
    { code: 'contre_arriere', label: "Contre d'un arrière", point: 'them' },
    { code: 'invasion', label: 'Passage au-dessus du filet', point: 'them' },
    { code: 'libero', label: 'Faute du libéro', point: 'them' },
    { code: 'delai_service', label: 'Délai de service (8 s)', point: 'them' },
    { code: 'autre', label: 'Autre faute', point: 'them' },
  ],
  erreur: [
    { code: 'service', label: 'Service raté (filet / dehors)', point: 'them' },
    { code: 'reception', label: 'Réception', point: 'them' },
    { code: 'attaque_out', label: 'Attaque dehors', point: 'them' },
    { code: 'attaque_filet', label: 'Attaque dans le filet', point: 'them' },
    { code: 'attaque_contree', label: 'Attaque contrée', point: 'them' },
    { code: 'passe', label: 'Passe', point: 'them' },
    { code: 'defense', label: 'Défense', point: 'them' },
    { code: 'bloc', label: 'Contre (ballon dehors)', point: 'them' },
    { code: 'relance', label: 'Relance / free ball', point: 'them' },
    { code: 'autre', label: 'Autre échec', point: 'them' },
  ],
  reussite: [
    { code: 'ace', label: 'Ace / service gagnant', point: 'us' },
    { code: 'attaque', label: 'Attaque gagnante', point: 'us' },
    { code: 'bloc', label: 'Contre gagnant', point: 'us' },
    { code: 'service_bon', label: 'Service difficile', point: null },
    { code: 'reception', label: 'Bonne réception', point: null },
    { code: 'passe', label: 'Bonne passe', point: null },
    { code: 'defense', label: 'Bonne défense', point: null },
    { code: 'bloc_touche', label: 'Contre touché / amorti', point: null },
  ],
};

export const statType = (category: StatCategory, code: string) =>
  STAT_TYPES[category].find((s) => s.code === code);

export const MAX_SUBS = 6;
export const MAX_TIMEOUTS = 2;
export const SETS_TO_WIN = 3;
