import { useState } from 'react';
import { Empty, Header } from '../components/ui';
import { LEVELS, genderLabel } from '../constants';
import { go } from '../router';
import { createMatch, useData } from '../store';

export const NewMatch = ({ teamId }: { teamId?: string }) => {
  const { teams } = useData();
  const [step, setStep] = useState<1 | 2>(1);
  const [tid, setTid] = useState(teamId ?? teams[0]?.id ?? '');
  const team = teams.find((t) => t.id === tid);
  const [opponent, setOpponent] = useState('');
  const [opponentLevel, setOpponentLevel] = useState(team?.level ?? 'Départemental');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [present, setPresent] = useState<Set<string>>(() => new Set(team?.players.map((p) => p.id)));

  if (!teams.length)
    return (
      <div className="page">
        <Header title="Nouveau match" back="" />
        <main className="content">
          <Empty>Crée d'abord une équipe.</Empty>
          <button className="btn primary block" onClick={() => go('team/new')}>
            Créer une équipe
          </button>
        </main>
      </div>
    );

  const selectTeam = (id: string) => {
    setTid(id);
    const t = teams.find((x) => x.id === id);
    setPresent(new Set(t?.players.map((p) => p.id)));
    if (t) setOpponentLevel(t.level);
  };

  const toggle = (id: string) => {
    const n = new Set(present);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setPresent(n);
  };

  const start = () => {
    if (!team) return;
    const id = createMatch({
      team,
      opponent: opponent.trim() || 'Adversaire',
      opponentLevel,
      date,
      players: team.players.filter((p) => present.has(p.id)),
    });
    go(`match/${id}`, true);
  };

  const players = [...(team?.players ?? [])].sort((a, b) => a.number - b.number);

  return (
    <div className="page">
      <Header title="Nouveau match" back="" />
      <main className="content">
        <div className="steps">
          <span className={step === 1 ? 'active' : 'done'}>1. Match</span>
          <span className={step === 2 ? 'active' : ''}>2. Présents</span>
          <span>3. Positions</span>
        </div>

        {step === 1 && (
          <div className="card form">
            <label>
              Mon équipe
              <select value={tid} onChange={(e) => selectTeam(e.target.value)}>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.level} · {genderLabel(t.gender)})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Adversaire
              <input value={opponent} placeholder="Nom de l'équipe adverse" onChange={(e) => setOpponent(e.target.value)} />
            </label>
            <label>
              Niveau de l'adversaire
              <select value={opponentLevel} onChange={(e) => setOpponentLevel(e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <button className="btn primary block" disabled={!team} onClick={() => setStep(2)}>
              Suivant : joueurs présents ›
            </button>
          </div>
        )}

        {step === 2 && team && (
          <>
            <div className="section-head">
              <h3 className="section-title">
                Qui est là ? ({present.size}/{players.length})
              </h3>
              <button
                className="btn small"
                onClick={() =>
                  setPresent(present.size === players.length ? new Set() : new Set(players.map((p) => p.id)))
                }
              >
                {present.size === players.length ? 'Aucun' : 'Tous'}
              </button>
            </div>
            {players.length === 0 && <Empty>Cette équipe n'a pas encore de joueurs.</Empty>}
            <div className="player-list">
              {players.map((p) => (
                <button
                  key={p.id}
                  className={`player-row check ${present.has(p.id) ? 'on' : ''}`}
                  onClick={() => toggle(p.id)}
                >
                  <span className="checkbox">{present.has(p.id) ? '✓' : ''}</span>
                  <span className={`jersey sm ${p.poste === 'Libéro' ? 'libero' : ''}`}>{p.number}</span>
                  <span className="grow">{p.name}</span>
                  <span className="muted small">{p.poste}</span>
                </button>
              ))}
            </div>
            {present.size < 6 && <p className="c-faute small">Il faut au moins 6 joueurs présents.</p>}
            <div className="btn-row spaced">
              <button className="btn" onClick={() => setStep(1)}>
                ‹ Retour
              </button>
              <button className="btn primary grow" disabled={present.size < 6} onClick={start}>
                Suivant : positions ›
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
