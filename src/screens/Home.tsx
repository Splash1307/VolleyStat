import { useRef } from 'react';
import { Header } from '../components/ui';
import { genderLabel } from '../constants';
import { setsWon } from '../logic';
import { go } from '../router';
import { exportData, importData, useData } from '../store';

export const Home = () => {
  const data = useData();
  const ongoing = data.matches.filter((m) => m.status !== 'finished').sort((a, b) => b.createdAt - a.createdAt);
  const finished = data.matches.filter((m) => m.status === 'finished');
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `volleystat-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async (f: File) => {
    try {
      const txt = await f.text();
      if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
      importData(txt);
      alert('Sauvegarde importée ✅');
    } catch (e) {
      alert('Import impossible : ' + (e as Error).message);
    }
  };

  return (
    <div className="page">
      <Header title="VolleyStat" />
      <main className="content">
        {ongoing.map((m) => {
          const w = setsWon(m);
          const cur = m.sets[m.sets.length - 1];
          return (
            <button key={m.id} className="card live-card" onClick={() => go(`match/${m.id}`)}>
              <span className="badge live">● Match en cours</span>
              <b>
                {m.teamName} vs {m.opponent}
              </b>
              <span>
                Sets {w.us} – {w.them}
                {cur && !cur.finished && ` · Set ${cur.index + 1} : ${cur.scoreUs}-${cur.scoreThem}`}
              </span>
              <span className="link">Reprendre ›</span>
            </button>
          );
        })}

        <div className="menu-grid">
          <button
            className="menu-btn primary"
            onClick={() => (data.teams.length ? go('new-match') : go('team/new'))}
          >
            <span className="menu-ico">＋</span>
            Nouveau match
            {!data.teams.length && <small>Crée d'abord ton équipe</small>}
          </button>
          <button className="menu-btn" onClick={() => go('teams')}>
            <span className="menu-ico">👥</span>
            Mes équipes
            <small>{data.teams.length} équipe(s)</small>
          </button>
          <button className="menu-btn" onClick={() => go('history')}>
            <span className="menu-ico">📊</span>
            Historique & stats
            <small>{finished.length} match(s)</small>
          </button>
        </div>

        {data.teams.length > 0 && (
          <>
            <h3 className="section-title">Équipes</h3>
            {data.teams.map((t) => (
              <button key={t.id} className="card row" onClick={() => go(`team/${t.id}`)}>
                <b>{t.name}</b>
                <span className="muted">
                  {t.level} · {genderLabel(t.gender)} · {t.players.length} joueur(s)
                </span>
              </button>
            ))}
          </>
        )}

        <h3 className="section-title">Sauvegarde</h3>
        <p className="muted small">
          Les données sont enregistrées sur ce téléphone. Exporte-les régulièrement pour ne rien perdre ou pour les
          transférer sur un autre appareil.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={doExport}>
            Exporter
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Importer
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </main>
    </div>
  );
};
