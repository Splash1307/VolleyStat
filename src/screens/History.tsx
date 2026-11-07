import { useState } from 'react';
import { StatsView } from '../components/StatsView';
import { Empty, Header, Segmented } from '../components/ui';
import { formatDate, setsWon } from '../logic';
import { go } from '../router';
import { useData } from '../store';
import type { Player } from '../types';

export const History = () => {
  const { matches, teams } = useData();
  const finished = matches
    .filter((m) => m.status === 'finished')
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  const teamIds = Array.from(new Set(finished.map((m) => m.teamId)));
  const [teamId, setTeamId] = useState<string>('all');
  const [view, setView] = useState<'matchs' | 'cumul'>('matchs');

  const list = teamId === 'all' ? finished : finished.filter((m) => m.teamId === teamId);
  const wins = list.filter((m) => m.winner === 'us').length;
  const setsFor = list.reduce((a, m) => a + setsWon(m).us, 0);
  const setsAgainst = list.reduce((a, m) => a + setsWon(m).them, 0);

  // joueurs cumulés (fusion des présents de chaque match)
  const players = new Map<string, Player>();
  list.forEach((m) => m.players.forEach((p) => players.set(p.id, p)));

  const teamName = (id: string) =>
    teams.find((t) => t.id === id)?.name ?? finished.find((m) => m.teamId === id)?.teamName ?? '?';

  return (
    <div className="page">
      <Header title="Historique" back="" />
      <main className="content">
        {finished.length === 0 ? (
          <Empty>Aucun match terminé pour l'instant.</Empty>
        ) : (
          <>
            {teamIds.length > 1 && (
              <div className="chips">
                <button className={teamId === 'all' ? 'chip active' : 'chip'} onClick={() => setTeamId('all')}>
                  Toutes
                </button>
                {teamIds.map((id) => (
                  <button key={id} className={teamId === id ? 'chip active' : 'chip'} onClick={() => setTeamId(id)}>
                    {teamName(id)}
                  </button>
                ))}
              </div>
            )}

            <div className="kpis">
              <div className="kpi">
                <span className="kpi-v">{list.length}</span>
                <span className="kpi-l">Matchs</span>
              </div>
              <div className="kpi">
                <span className="kpi-v c-reussite">{wins}</span>
                <span className="kpi-l">Victoires</span>
              </div>
              <div className="kpi">
                <span className="kpi-v c-faute">{list.length - wins}</span>
                <span className="kpi-l">Défaites</span>
              </div>
              <div className="kpi">
                <span className="kpi-v">
                  {setsFor}-{setsAgainst}
                </span>
                <span className="kpi-l">Sets</span>
              </div>
            </div>

            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'matchs', label: 'Matchs' },
                { value: 'cumul', label: 'Stats cumulées' },
              ]}
            />

            {view === 'matchs' ? (
              list.map((m) => {
                const w = setsWon(m);
                return (
                  <button key={m.id} className="card match-card" onClick={() => go(`detail/${m.id}`)}>
                    <span className={`result ${m.winner === 'us' ? 'win' : m.winner === 'them' ? 'loss' : ''}`}>
                      {m.winner === 'us' ? 'V' : m.winner === 'them' ? 'D' : '–'}
                    </span>
                    <span className="grow">
                      <b>
                        {m.teamName} vs {m.opponent}
                      </b>
                      <small className="muted">
                        {formatDate(m.date)} · {m.opponentLevel}
                      </small>
                      <small className="muted">
                        {m.sets.map((s) => `${s.scoreUs}-${s.scoreThem}`).join(' · ')}
                      </small>
                    </span>
                    <span className="sets-score">
                      {w.us}-{w.them}
                    </span>
                  </button>
                );
              })
            ) : (
              <StatsView players={[...players.values()]} sets={list.flatMap((m) => m.sets)} setFilter={false} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
