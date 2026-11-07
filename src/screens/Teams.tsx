import { useEffect, useRef, useState } from 'react';
import { Empty, Header, Modal } from '../components/ui';
import { GENDERS, LEVELS, POSTES, genderLabel } from '../constants';
import { uid } from '../logic';
import { ask, notify } from '../dialog';
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
  if (!existing) return <TeamCreate />;
  return <TeamView team={existing} />;
};

const blankTeam = (): Team => ({
  id: uid(),
  name: '',
  level: 'Départemental',
  gender: 'F',
  players: [],
  createdAt: Date.now(),
});

/** Champs nom / niveau / catégorie (création et modification) */
const TeamInfoFields = ({ team, onChange }: { team: Team; onChange: (t: Team) => void }) => (
  <>
    <label>
      Nom de l'équipe
      <input
        id="team-name"
        value={team.name}
        placeholder="Ex : VC Lyon M18"
        enterKeyHint="done"
        onChange={(e) => onChange({ ...team, name: e.target.value })}
      />
    </label>
    <label>
      Niveau
      <select id="team-level" value={team.level} onChange={(e) => onChange({ ...team, level: e.target.value })}>
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
            type="button"
            key={g.value}
            className={team.gender === g.value ? 'active' : ''}
            onClick={() => onChange({ ...team, gender: g.value as Gender })}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  </>
);

const TeamCreate = () => {
  const [team, setTeam] = useState<Team>(blankTeam);
  const create = () => {
    if (!team.name.trim()) return notify("Donne un nom à l'équipe.");
    saveTeam({ ...team, name: team.name.trim() });
    go(`team/${team.id}`, true);
  };
  return (
    <div className="page">
      <Header title="Nouvelle équipe" back="teams" />
      <main className="content">
        <form
          className="card form"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <TeamInfoFields team={team} onChange={setTeam} />
          <button type="submit" className="btn primary block">
            Créer l'équipe
          </button>
        </form>
      </main>
    </div>
  );
};

const TeamView = ({ team }: { team: Team }) => {
  const [editing, setEditing] = useState<Player | null>(null);
  const [editTeam, setEditTeam] = useState(false);
  const sorted = [...team.players].sort((a, b) => a.number - b.number);
  const newPlayer = (): Player => ({ id: uid(), name: '', number: -1, poste: '' });

  return (
    <div className="page">
      <Header
        title="Équipe"
        back="teams"
        right={
          <button className="btn small" onClick={() => setEditTeam(true)}>
            ✎ Modifier
          </button>
        }
      />
      <main className="content">
        <div className="team-hero">
          <span className="team-badge">{initials(team.name)}</span>
          <div className="team-hero-text">
            <b>{team.name}</b>
            <div className="tags">
              <span className="tag">{team.level}</span>
              <span className="tag">{genderLabel(team.gender)}</span>
              <span className="tag">
                {team.players.length} joueur{team.players.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="section-head">
          <h3 className="section-title">Effectif</h3>
          <button className="btn small primary" onClick={() => setEditing(newPlayer())}>
            ＋ Joueur
          </button>
        </div>

        {sorted.length === 0 ? (
          <button className="empty empty-btn" onClick={() => setEditing(newPlayer())}>
            Aucun joueur pour l'instant.
            <br />
            <b className="link">＋ Ajouter le premier joueur</b>
          </button>
        ) : (
          <div className="roster">
            {sorted.map((p) => (
              <button key={p.id} className="roster-row" onClick={() => setEditing(p)}>
                <span className={`jersey ${p.poste === 'Libéro' ? 'libero' : ''}`}>{p.number}</span>
                <span className="roster-name">{p.name}</span>
                {p.poste && <span className="tag">{p.poste}</span>}
                <span className="chev">›</span>
              </button>
            ))}
          </div>
        )}
        {sorted.length > 0 && sorted.length < 6 && (
          <p className="muted small center">Il faut au moins 6 joueurs pour lancer un match.</p>
        )}
      </main>

      {editing && (
        <PlayerModal
          player={editing}
          others={team.players.filter((p) => p.id !== editing.id)}
          onClose={() => setEditing(null)}
          onSave={(p, another) => {
            const exists = team.players.some((x) => x.id === p.id);
            saveTeam({
              ...team,
              players: exists ? team.players.map((x) => (x.id === p.id ? p : x)) : [...team.players, p],
            });
            setEditing(another ? newPlayer() : null);
          }}
          onDelete={
            team.players.some((x) => x.id === editing.id)
              ? () => {
                  saveTeam({ ...team, players: team.players.filter((x) => x.id !== editing.id) });
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      {editTeam && <TeamEditModal team={team} onClose={() => setEditTeam(false)} />}
    </div>
  );
};

const TeamEditModal = ({ team, onClose }: { team: Team; onClose: () => void }) => {
  const [t, setT] = useState(team);
  const valid = !!t.name.trim();
  const submit = () => {
    if (!valid) return;
    saveTeam({ ...t, name: t.name.trim() });
    onClose();
  };
  return (
    <Modal
      title="Modifier l'équipe"
      onClose={onClose}
      top
      footer={
        <button className="btn primary grow" disabled={!valid} onClick={submit}>
          Enregistrer
        </button>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <TeamInfoFields team={t} onChange={setT} />
        <button type="submit" hidden />
      </form>
      <button
        className="btn danger ghost block"
        onClick={async () => {
          if (
            await ask(`Supprimer l'équipe « ${team.name} » ? Les matchs déjà joués sont conservés.`, {
              ok: 'Supprimer',
              danger: true,
            })
          ) {
            deleteTeam(team.id);
            go('teams', true);
          }
        }}
      >
        Supprimer l'équipe
      </button>
    </Modal>
  );
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

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
  onSave: (p: Player, another?: boolean) => void;
  onDelete?: () => void;
}) => {
  const [p, setP] = useState(player);
  const [num, setNum] = useState(player.number >= 0 ? String(player.number) : '');
  const nameRef = useRef<HTMLInputElement>(null);
  // « Enregistrer + suivant » : on vide le formulaire sans refermer la fenêtre
  useEffect(() => {
    setP(player);
    setNum(player.number >= 0 ? String(player.number) : '');
    nameRef.current?.focus();
  }, [player]);
  const n = parseInt(num, 10);
  const dup = others.some((o) => o.number === n);
  const valid = !!p.name.trim() && Number.isFinite(n) && n >= 0 && n <= 99 && !dup;
  const isNew = !onDelete;
  const submit = (another?: boolean) => valid && onSave({ ...p, name: p.name.trim(), number: n }, another);
  return (
    <Modal
      title={onDelete ? 'Modifier le joueur' : 'Nouveau joueur'}
      onClose={onClose}
      top
      footer={
        <>
          {onDelete && (
            <button className="btn danger ghost" onClick={async () => (await ask('Supprimer ce joueur ?', { ok: 'Supprimer', danger: true })) && onDelete()}>
              Supprimer
            </button>
          )}
          {isNew && (
            <button className="btn grow" disabled={!valid} onClick={() => submit(true)}>
              Enregistrer + suivant
            </button>
          )}
          <button className="btn primary grow" disabled={!valid} onClick={() => submit()}>
            Enregistrer
          </button>
        </>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(isNew);
        }}
      >
        <label>
          Nom / prénom
          <input ref={nameRef} autoFocus enterKeyHint="next" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </label>
        <label>
          Numéro de maillot
          <input
            inputMode="numeric"
            enterKeyHint="done"
            placeholder="Ex : 7"
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
        <button type="submit" hidden />
      </form>
    </Modal>
  );
};
