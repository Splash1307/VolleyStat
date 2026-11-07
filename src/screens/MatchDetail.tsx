import { StatsView } from '../components/StatsView';
import { Empty, Header } from '../components/ui';
import { genderLabel } from '../constants';
import { formatDate, formatDuration, longestRun, playerById, playerLabel, setsWon } from '../logic';
import { go } from '../router';
import { ask } from '../dialog';
import { deleteMatch, useData } from '../store';

export const MatchDetail = ({ id }: { id: string }) => {
  const { matches } = useData();
  const m = matches.find((x) => x.id === id);
  if (!m)
    return (
      <div className="page">
        <Header title="Match" back="history" />
        <main className="content">
          <Empty>Match introuvable.</Empty>
        </main>
      </div>
    );

  const w = setsWon(m);
  const duration = m.sets.reduce((a, s) => a + ((s.endedAt ?? s.startedAt) - s.startedAt), 0);

  return (
    <div className="page">
      <Header title="Résumé du match" back="history" />
      <main className="content">
        <div className={`card result-card ${m.winner === 'us' ? 'win' : m.winner === 'them' ? 'loss' : ''}`}>
          <span className="muted small">
            {formatDate(m.date)} · {m.teamLevel} {genderLabel(m.teamGender)}
          </span>
          <div className="result-line">
            <span className="rt">{m.teamName}</span>
            <span className="big-score">
              {w.us} – {w.them}
            </span>
            <span className="rt">{m.opponent}</span>
          </div>
          <span className="result-label">
            {m.status !== 'finished'
              ? 'Match en cours'
              : m.winner === 'us'
                ? 'Victoire 🎉'
                : m.winner === 'them'
                  ? 'Défaite'
                  : 'Match interrompu'}
          </span>
          <span className="muted small">
            Adversaire : {m.opponentLevel}
            {duration >= 60000 && ` · Durée de jeu ≈ ${formatDuration(duration)}`}
          </span>
          {m.status !== 'finished' && (
            <button className="btn primary block" onClick={() => go(`match/${m.id}`)}>
              Reprendre le match
            </button>
          )}
        </div>

        <h3 className="section-title">Sets</h3>
        {m.sets.map((s) => {
          const run = longestRun(s);
          return (
            <details key={s.index} className="card set-card">
              <summary>
                <span>Set {s.index + 1}</span>
                <b className={s.winner === 'us' ? 'c-reussite' : s.winner === 'them' ? 'c-faute' : ''}>
                  {s.scoreUs} – {s.scoreThem}
                </b>
                <span className="muted small">
                  {s.timeouts.length} TM · {s.subs.length} chgt
                </span>
              </summary>
              <div className="timeline" aria-label="Déroulé des points">
                {s.points.map((p) => (
                  <span key={p.id} className={`dot ${p.winner}`} title={`${p.scoreUs}-${p.scoreThem}`} />
                ))}
              </div>
              {run.len > 1 && (
                <p className="small muted">
                  Plus longue série : {run.len} points pour {run.side === 'us' ? m.teamName : m.opponent}
                </p>
              )}
              <p className="small">
                <b>Six de départ :</b>{' '}
                {s.startingLineup.map((pid, i) => `P${i + 1} ${playerLabel(playerById(m.players, pid))}`).join(' · ')}
              </p>
              <p className="small">
                <b>Premier service :</b> {s.firstServe === 'us' ? m.teamName : m.opponent}
              </p>
              {s.timeouts.length > 0 && (
                <p className="small">
                  <b>Temps morts :</b>{' '}
                  {s.timeouts
                    .map((t) => `${t.side === 'us' ? 'nous' : 'adv.'} à ${t.scoreUs}-${t.scoreThem}`)
                    .join(' · ')}
                </p>
              )}
              {s.subs.length > 0 && (
                <div className="small">
                  <b>Changements :</b>
                  {s.subs.map((c) => (
                    <div key={c.id}>
                      {c.libero ? '(libéro) ' : ''}
                      {playerLabel(playerById(m.players, c.playerIn))} ↔{' '}
                      {playerLabel(playerById(m.players, c.playerOut))} en P{c.position} à {c.scoreUs}-{c.scoreThem}
                    </div>
                  ))}
                </div>
              )}
            </details>
          );
        })}

        <h3 className="section-title">Statistiques</h3>
        <StatsView players={m.players} sets={m.sets} />

        <button
          className="btn danger ghost block"
          onClick={async () => {
            if (await ask('Supprimer définitivement ce match et ses stats ?', { ok: 'Supprimer', danger: true })) {
              deleteMatch(m.id);
              go('history', true);
            }
          }}
        >
          Supprimer ce match
        </button>
      </main>
    </div>
  );
};
