import { useMemo, useState } from 'react';
import { CATEGORIES, STAT_TYPES } from '../constants';
import { aggregateStats, countByCode, pointBreakdown, totalsByCategory } from '../logic';
import type { Player, SetRecord, StatCategory } from '../types';
import { Empty } from './ui';

export const StatsView = ({
  players,
  sets,
  defaultFilter = 'all',
  setFilter: showSetFilter = true,
}: {
  players: Player[];
  sets: SetRecord[];
  defaultFilter?: string;
  setFilter?: boolean;
}) => {
  const [filter, setFilter] = useState<string>(defaultFilter);
  const [open, setOpen] = useState<string | null>(null);

  const selectedSets = filter === 'all' ? sets : sets.filter((s) => String(s.index) === filter);
  const stats = useMemo(() => selectedSets.flatMap((s) => s.stats), [selectedSets]);
  const agg = useMemo(() => aggregateStats(stats), [stats]);
  const totals = totalsByCategory(stats);
  const pb = pointBreakdown(selectedSets);

  const rows = players
    .map((p) => ({ p, s: agg.get(p.id) }))
    .sort((a, b) => {
      const ea = a.s ? a.s.reussite - a.s.erreur - a.s.faute : -999;
      const eb = b.s ? b.s.reussite - b.s.erreur - b.s.faute : -999;
      return eb - ea || a.p.number - b.p.number;
    });

  return (
    <div className="stats">
      {showSetFilter && sets.length > 1 && (
        <div className="chips">
          <button className={filter === 'all' ? 'chip active' : 'chip'} onClick={() => setFilter('all')}>
            Match
          </button>
          {sets.map((s) => (
            <button
              key={s.index}
              className={filter === String(s.index) ? 'chip active' : 'chip'}
              onClick={() => setFilter(String(s.index))}
            >
              Set {s.index + 1}
            </button>
          ))}
        </div>
      )}

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-v c-reussite">{totals.reussite}</span>
          <span className="kpi-l">Réussites</span>
        </div>
        <div className="kpi">
          <span className="kpi-v c-erreur">{totals.erreur}</span>
          <span className="kpi-l">Échecs</span>
        </div>
        <div className="kpi">
          <span className="kpi-v c-faute">{totals.faute}</span>
          <span className="kpi-l">Fautes</span>
        </div>
      </div>

      <div className="card breakdown">
        <div>
          <b>{pb.usTotal}</b> points marqués
          <small>
            {pb.usFromOurActions} sur nos actions · {pb.usFromOppMistakes} sur fautes/erreurs adverses ou non
            renseignés
          </small>
        </div>
        <div>
          <b>{pb.themTotal}</b> points encaissés
          <small>
            {pb.themFromOurMistakes} sur nos fautes/échecs · {pb.themFromOppActions} sur actions adverses ou non
            renseignés
          </small>
        </div>
      </div>

      <h3 className="section-title">Par joueur</h3>
      <div className="table">
        <div className="tr th">
          <span>Joueur</span>
          <span className="c-reussite">✓</span>
          <span className="c-erreur">✗</span>
          <span className="c-faute">F</span>
          <span>Pts</span>
          <span>+/−</span>
        </div>
        {rows.map(({ p, s }) => {
          const eff = s ? s.reussite - s.erreur - s.faute : 0;
          const isOpen = open === p.id;
          return (
            <div key={p.id}>
              <button className={`tr ${isOpen ? 'open' : ''}`} onClick={() => setOpen(isOpen ? null : p.id)}>
                <span className="who">
                  <b>{p.number}</b> {p.name}
                </span>
                <span>{s?.reussite ?? 0}</span>
                <span>{s?.erreur ?? 0}</span>
                <span>{s?.faute ?? 0}</span>
                <span>{s?.pointsWon ?? 0}</span>
                <span className={eff > 0 ? 'c-reussite' : eff < 0 ? 'c-faute' : ''}>
                  {eff > 0 ? `+${eff}` : eff}
                </span>
              </button>
              {isOpen && (
                <div className="detail">
                  {!s ? (
                    <small>Aucune stat pour ce joueur.</small>
                  ) : (
                    CATEGORIES.map((c) => {
                      const items = STAT_TYPES[c.value].filter((t) => s.byCode[`${c.value}:${t.code}`]);
                      if (!items.length) return null;
                      return (
                        <div key={c.value} className="detail-group">
                          <span className="detail-cat" style={{ color: c.color }}>
                            {c.label}s
                          </span>
                          {items.map((t) => (
                            <span key={t.code} className="pill">
                              {t.label} <b>×{s.byCode[`${c.value}:${t.code}`]}</b>
                            </span>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="section-title">Par type d'action (équipe)</h3>
      {stats.length === 0 ? (
        <Empty>Aucune stat enregistrée. Touche un joueur sur le terrain pour en ajouter.</Empty>
      ) : (
        CATEGORIES.map((c) => <TypeBreakdown key={c.value} category={c.value} stats={stats} />)
      )}
    </div>
  );
};

const TypeBreakdown = ({
  category,
  stats,
}: {
  category: StatCategory;
  stats: Parameters<typeof countByCode>[0];
}) => {
  const counts = countByCode(stats, category);
  const items = STAT_TYPES[category].filter((t) => counts[t.code]);
  const meta = CATEGORIES.find((c) => c.value === category)!;
  if (!items.length) return null;
  const max = Math.max(...items.map((t) => counts[t.code]));
  return (
    <div className="card">
      <h4 style={{ color: meta.color }}>{meta.label}s</h4>
      {items
        .sort((a, b) => counts[b.code] - counts[a.code])
        .map((t) => (
          <div key={t.code} className="bar-row">
            <span className="bar-label">{t.label}</span>
            <span className="bar-track">
              <span className="bar" style={{ width: `${(counts[t.code] / max) * 100}%`, background: meta.color }} />
            </span>
            <b>{counts[t.code]}</b>
          </div>
        ))}
    </div>
  );
};
