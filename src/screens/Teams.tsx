import { useState } from 'react';
import { Empty, Header, Modal } from '../components/ui';
import { GENDERS, LEVELS, POSTES, genderLabel } from '../constants';
import { uid } from '../logic';
import { go } from '../router';
import { deleteTeam, saveTeam, useData } from '../store';
import type { Gender, Player, Poste, Team } from '../types';

export const Teams = () => {
  const { teams } = useData();
  return (
    <div className="page">
      <Header
        title="Mes équipes"
        back=""
        right={
          <button className="btn small primary" onClick={() => go('team/new')}>
            ＋ Équipe
          </button>
        }
      />
      <main className="content">
        {teams.length === 0 && <Empty>Aucune équipe. Crée ta première équipe pour commencer.</Empty>}
        {teams.map((t) => (
          <button key={t.id} className="card row" onClick={() => go(`team/${t.id}`)}>
            <b>{t.name}</b>
            <span className="muted">
              {t.level} · {genderLabel(t.gender)} · {t.players.length} joueur(s)
            </span>
          </button>
        ))}
      </main>
    </div>
  );
};

export const TeamEdit = ({ id }: { id: string }) => {
  const { teams } = useData();
  const existing = teams.find((t) => t.id === id);
  const [team, setTeam] = useState<Team>(
    () =>
      existing ?? {
        id: uid(),
        name: '',
        level: 'Départemental',
        gender: 'F',
        players: [],
        createdAt: Date.now(),
      },
  );
  const [editing, setEditing] = useState<Player | null>(null);
  const isNew = !existing;

  const save = (t: Team) => {
    setTeam(t);
    if (!isNew) saveTeam(t);
  };

  const create = () => {
    if (!team.name.trim()) return alert("Donne un nom à l'équipe");
    saveTeam({ ...team, name: team.name.trim() });
    go(`team/${team.id}`, true);
  };

  const sorted = [...team.players].sort((a, b) => a.number - b.number);

  return (
    <div className="page">
      <Header title={isNew ? 'Nouvelle équipe' : team.name || 'Équipe'} back={isNew ? '' : 'teams'} />
      <main className="content">
        <div className="card form">
          <label>
            Nom de l'équipe
            <input
              value={team.name}
              placeholder="Ex : VC Lyon M18"
              onChange={(e) => setTeam({ ...team, name: e.target.value })}
              onBlur={() => !isNew && team.name.trim() && saveTeam({ ...team, name: team.name.trim() })}
            />
          </label>
          <label>
            Niveau
            <select value={team.level} onChange={(e) => save({ ...team, level: e.target.value })}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <div className="field">
            <span>Catégorie</span>
            <div className="segmented">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  className={team.gender === g.value ? 'active' : ''}
                  onClick={() => save({ ...team, gender: g.value as Gender })}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          {isNew && (
            <button className="btn primary block" onClick={create}>
              Créer l'équipe
            </button>
          )}
        </div>

        {!isNew && (
          <>
            <div className="section-head">
              <h3 className="section-title">Joueurs ({team.players.length})</h3>
              <button
                className="btn small primary"
                onClick={() => setEditing({ id: uid(), name: '', number: nextNumber(team.players), poste: '' })}
              >
                ＋ Joueur
              </button>
            </div>
            {sorted.length === 0 && <Empty>Ajoute les joueurs de ton équipe avec leur numéro de maillot.</Empty>}
            <div className="player-list">
              {sorted.map((p) => (
                <button key={p.id} className="player-row" onClick={() => setEditing(p)}>
                  <span className={`jersey sm ${p.poste === 'Libéro' ? 'libero' : ''}`}>{p.number}</span>
                  <span className="grow">{p.name}</span>
                  <span className="muted small">{p.poste}</span>
                </button>
              ))}
            </div>

            <div className="btn-row spaced">
              <button className="btn primary" onClick={() => go(`new-match/${team.id}`)} disabled={team.players.length < 6}>
                Créer un match avec cette équipe
              </button>
            </div>
            <button
              className="btn danger ghost block"
              onClick={() => {
                if (confirm(`Supprimer l'équipe « ${team.name} » ? (les matchs déjà joués sont conservés)`)) {
                  deleteTeam(team.id);
                  go('teams', true);
                }
              }}
            >
              Supprimer l'équipe
            </button>
          </>
        )}
      </main>

      {editing && (
        <PlayerModal
          player={editing}
          others={team.players.filter((p) => p.id !== editing.id)}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            const exists = team.players.some((x) => x.id === p.id);
            save({ ...team, players: exists ? team.players.map((x) => (x.id === p.id ? p : x)) : [...team.players, p] });
            setEditing(null);
          }}
          onDelete={
            team.players.some((x) => x.id === editing.id)
              ? () => {
                  save({ ...team, players: team.players.filter((x) => x.id !== editing.id) });
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

const nextNumber = (players: Player[]) => {
  const used = new Set(players.map((p) => p.number));
  let n = 1;
  while (used.has(n)) n++;
  return n;
};

const PlayerModal = ({
  player,
  others,
  onClose,
  onSave,
  onDelete,
}: {
  player: Player;
  others: Player[];
  onClose: () => void;
  onSave: (p: Player) => void;
  onDelete?: () => void;
}) => {
  const [p, setP] = useState(player);
  const [num, setNum] = useState(String(player.number));
  const n = parseInt(num, 10);
  const dup = others.some((o) => o.number === n);
  const valid = p.name.trim() && Number.isFinite(n) && n >= 0 && n <= 99 && !dup;
  return (
    <Modal
      title={onDelete ? 'Modifier le joueur' : 'Nouveau joueur'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="btn danger ghost" onClick={() => confirm('Supprimer ce joueur ?') && onDelete()}>
              Supprimer
            </button>
          )}
          <button
            className="btn primary grow"
            disabled={!valid}
            onClick={() => onSave({ ...p, name: p.name.trim(), number: n })}
          >
            Enregistrer
          </button>
        </>
      }
    >
      <div className="form">
        <label>
          Nom / prénom
          <input autoFocus value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </label>
        <label>
          Numéro de maillot
          <input
            inputMode="numeric"
            value={num}
            onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, 2))}
          />
          {dup && <small className="c-faute">Numéro déjà utilisé</small>}
        </label>
        <label>
          Poste (optionnel)
          <select value={p.poste} onChange={(e) => setP({ ...p, poste: e.target.value as Poste })}>
            {POSTES.map((x) => (
              <option key={x} value={x}>
                {x || '—'}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
};
