import { useState } from 'react';
import { Court } from '../components/Court';
import { Header, Modal } from '../components/ui';
import { other, setsWon } from '../logic';
import { getData, startSet, updateMatchPlayers } from '../store';
import type { Match, Side } from '../types';

export const SetSetup = ({ match }: { match: Match }) => {
  const finished = match.sets.filter((s) => s.finished);
  const setIndex = finished.length;
  const prev = finished[finished.length - 1];
  const presentIds = new Set(match.players.map((p) => p.id));

  const [lineup, setLineup] = useState<(string | undefined)[]>(() =>
    prev ? prev.startingLineup.map((id) => (presentIds.has(id) ? id : undefined)) : Array(6).fill(undefined),
  );
  // Sets 2 à 4 : alternance du premier service. Tie-break : nouveau tirage au sort.
  const [serve, setServe] = useState<Side>(() => (prev && setIndex < 4 ? other(prev.firstServe) : 'us'));
  const [picking, setPicking] = useState<number | null>(null);
  const [showAbsent, setShowAbsent] = useState(false);

  const w = setsWon(match);
  const complete = lineup.every(Boolean);
  const players = [...match.players].sort((a, b) => a.number - b.number);
  const team = getData().teams.find((t) => t.id === match.teamId);
  const absents = (team?.players ?? []).filter((p) => !presentIds.has(p.id));

  const assign = (pos: number, id: string | undefined) => {
    const next = [...lineup];
    // si le joueur était déjà placé ailleurs, on échange
    const from = id ? next.indexOf(id) : -1;
    if (from >= 0) next[from] = next[pos - 1];
    next[pos - 1] = id;
    setLineup(next);
    // passe automatiquement à la prochaine position vide
    const nextEmpty = [1, 2, 3, 4, 5, 6].find((p) => !next[p - 1]);
    setPicking(nextEmpty ?? null);
  };

  return (
    <div className="page">
      <Header
        title={`Set ${setIndex + 1}${setIndex === 4 ? ' (tie-break)' : ''}`}
        back=""
        right={
          <span className="muted small">
            Sets {w.us}-{w.them}
          </span>
        }
      />
      <main className="content">
        <p className="muted small center">
          {match.teamName} vs {match.opponent} — touche une position pour placer un joueur.
        </p>
        <Court
          lineup={lineup}
          players={match.players}
          serving={serve === 'us'}
          onPlayer={(pos) => setPicking(pos)}
          selectedPosition={picking}
        />

        <div className="card form">
          <div className="field">
            <span>{setIndex === 4 ? 'Tirage au sort : qui sert en premier ?' : 'Premier service'}</span>
            <div className="segmented">
              <button className={serve === 'us' ? 'active' : ''} onClick={() => setServe('us')}>
                🏐 {match.teamName}
              </button>
              <button className={serve === 'them' ? 'active' : ''} onClick={() => setServe('them')}>
                🏐 {match.opponent}
              </button>
            </div>
          </div>
        </div>

        <div className="btn-row spaced">
          <button className="btn" onClick={() => setLineup(Array(6).fill(undefined))}>
            Vider
          </button>
          <button
            className="btn primary grow"
            disabled={!complete}
            onClick={() => startSet(match.id, lineup as string[], serve)}
          >
            {complete ? `Démarrer le set ${setIndex + 1} ›` : `Place encore ${lineup.filter((x) => !x).length} joueur(s)`}
          </button>
        </div>

        {absents.length > 0 && (
          <button className="btn ghost block small" onClick={() => setShowAbsent(true)}>
            Un joueur est arrivé en retard ? Ajouter aux présents
          </button>
        )}
      </main>

      {picking !== null && (
        <Modal title={`Poste ${picking}`} onClose={() => setPicking(null)}>
          <div className="player-list">
            {players.map((p) => {
              const at = lineup.indexOf(p.id);
              return (
                <button
                  key={p.id}
                  className={`player-row ${at === picking - 1 ? 'on' : ''}`}
                  onClick={() => assign(picking, p.id)}
                >
                  <span className={`jersey sm ${p.poste === 'Libéro' ? 'libero' : ''}`}>{p.number}</span>
                  <span className="grow">{p.name}</span>
                  <span className="muted small">
                    {at >= 0 ? `en P${at + 1}` : p.poste}
                  </span>
                </button>
              );
            })}
          </div>
          {lineup[picking - 1] && (
            <button className="btn ghost block" onClick={() => assign(picking, undefined)}>
              Retirer le joueur de ce poste
            </button>
          )}
        </Modal>
      )}

      {showAbsent && (
        <Modal title="Ajouter aux présents" onClose={() => setShowAbsent(false)}>
          <div className="player-list">
            {absents.map((p) => (
              <button
                key={p.id}
                className="player-row"
                onClick={() => {
                  updateMatchPlayers(match.id, [...match.players, { ...p }]);
                  if (absents.length <= 1) setShowAbsent(false);
                }}
              >
                <span className="jersey sm">{p.number}</span>
                <span className="grow">{p.name}</span>
                <span className="link">＋ Ajouter</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
