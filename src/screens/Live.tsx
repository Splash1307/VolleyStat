import { useEffect, useMemo, useState } from 'react';
import { Court } from '../components/Court';
import { StatsView } from '../components/StatsView';
import { Modal, Segmented } from '../components/ui';
import { CATEGORIES, MAX_SUBS, MAX_TIMEOUTS, STAT_TYPES, statType } from '../constants';
import { aggregateStats, playerById, playerLabel, pointsToWin, setOverWinner, setsWon } from '../logic';
import { go } from '../router';
import {
  addPoint,
  addStat,
  addTimeout,
  endMatchNow,
  getData,
  removePoint,
  substitute,
  undo,
  updateMatchPlayers,
  updateSettings,
  useData,
  validateSet,
} from '../store';
import type { Match, SetRecord, Side, StatCategory } from '../types';

type Tab = 'positions' | 'stats';

export const Live = ({ match, set }: { match: Match; set: SetRecord }) => {
  const { settings } = useData();
  const [tab, setTab] = useState<Tab>('positions');
  const [playerPos, setPlayerPos] = useState<number | null>(null);
  const [subPos, setSubPos] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [timeout, setTimeoutSide] = useState<Side | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const w = setsWon(match);
  const setWinner = setOverWinner(set);
  const usTO = set.timeouts.filter((t) => t.side === 'us').length;
  const themTO = set.timeouts.filter((t) => t.side === 'them').length;
  const subsCount = set.subs.filter((s) => !s.libero).length;
  const agg = useMemo(() => aggregateStats(set.stats), [set.stats]);
  const lastAction = match.undo[match.undo.length - 1];
  const target = pointsToWin(set.index);
  const setPoint =
    !setWinner &&
    ((set.scoreUs >= target - 1 && set.scoreUs > set.scoreThem) ||
      (set.scoreThem >= target - 1 && set.scoreThem > set.scoreUs));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const takeTimeout = (side: Side) => {
    const used = side === 'us' ? usTO : themTO;
    if (used >= MAX_TIMEOUTS && !confirm(`Déjà ${used} temps morts pris dans ce set. En noter un de plus ?`)) return;
    addTimeout(match.id, side);
    setTimeoutSide(side);
  };

  const playerAtPos = playerPos ? playerById(match.players, set.lineup[playerPos - 1]) : undefined;

  return (
    <div className="page live">
      {/* --------------------------- Tableau de score --------------------------- */}
      <section className="scoreboard">
        <div className="sb-top">
          <button className="icon-btn" aria-label="Accueil" onClick={() => go('')}>
            ‹
          </button>
          <span className="sb-set">
            Set {set.index + 1}
            {set.index === 4 && ' · tie-break'} · Sets {w.us}-{w.them}
          </span>
          <button className="icon-btn" aria-label="Menu" onClick={() => setMenu(true)}>
            ⋯
          </button>
        </div>
        <div className="sb-teams">
          <TeamScore
            name={match.teamName}
            score={set.scoreUs}
            serving={set.serving === 'us'}
            onPlus={() => addPoint(match.id, 'us')}
            onMinus={() => removePoint(match.id, 'us')}
            mine
          />
          <span className="sb-sep">:</span>
          <TeamScore
            name={match.opponent}
            score={set.scoreThem}
            serving={set.serving === 'them'}
            onPlus={() => addPoint(match.id, 'them')}
            onMinus={() => removePoint(match.id, 'them')}
          />
        </div>
        <div className="sb-actions">
          <button className="btn small" onClick={() => takeTimeout('us')}>
            T.M. {usTO}/{MAX_TIMEOUTS}
          </button>
          <button className="btn small" onClick={() => setSubPos(0)}>
            Chgt {subsCount}/{MAX_SUBS}
          </button>
          <button
            className="btn small"
            disabled={!lastAction}
            onClick={() => {
              undo(match.id);
              setToast(`Annulé : ${lastAction?.label}`);
            }}
          >
            ↶ Annuler
          </button>
          <button className="btn small" onClick={() => takeTimeout('them')}>
            T.M. adv {themTO}/{MAX_TIMEOUTS}
          </button>
        </div>
        {setPoint && <div className="setpoint">Balle de set !</div>}
      </section>

      {/* ------------------------------ Contenu ------------------------------ */}
      <main className="content">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'positions', label: 'Positions' },
            { value: 'stats', label: 'Stats' },
          ]}
        />

        {tab === 'positions' ? (
          <>
            <Court
              lineup={set.lineup}
              players={match.players}
              serving={set.serving === 'us'}
              stats={agg}
              onPlayer={(pos) => setPlayerPos(pos)}
            />
            <p className="muted small center">
              Touche un joueur pour noter une faute, un échec ou une réussite.
              {settings.autoPoint && ' Le point est ajouté automatiquement.'}
            </p>
            <Bench match={match} set={set} />
            <RecentLog match={match} set={set} />
          </>
        ) : (
          <StatsView players={match.players} sets={match.sets} defaultFilter={String(set.index)} />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}

      {/* ---------------------------- Saisie de stat --------------------------- */}
      {playerPos !== null && playerAtPos && (
        <StatModal
          title={`${playerLabel(playerAtPos)} · P${playerPos}`}
          autoPoint={settings.autoPoint}
          onClose={() => setPlayerPos(null)}
          onSub={() => {
            setSubPos(playerPos);
            setPlayerPos(null);
          }}
          onStat={(cat, code) => {
            addStat(match.id, playerAtPos.id, cat, code);
            setPlayerPos(null);
            setToast(`${playerLabel(playerAtPos)} : ${statType(cat, code)?.label}`);
          }}
        />
      )}

      {subPos !== null && (
        <SubModal
          match={match}
          set={set}
          initialPos={subPos || null}
          subsCount={subsCount}
          onClose={() => setSubPos(null)}
          onDone={(msg) => {
            setSubPos(null);
            setToast(msg);
          }}
        />
      )}

      {timeout && (
        <TimeoutModal
          label={timeout === 'us' ? `Temps mort ${match.teamName}` : `Temps mort ${match.opponent}`}
          onClose={() => setTimeoutSide(null)}
        />
      )}

      {menu && (
        <Modal title="Options du match" onClose={() => setMenu(false)}>
          <label className="switch-row">
            <span>
              Point automatique
              <small>Une faute/un échec donne le point à l'adversaire, un ace/attaque/contre gagnant nous le donne.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.autoPoint}
              onChange={(e) => updateSettings({ autoPoint: e.target.checked })}
            />
          </label>
          <button
            className="btn block"
            onClick={() => {
              setMenu(false);
              go('');
            }}
          >
            Retour à l'accueil (le match reste en cours)
          </button>
          <button
            className="btn danger block"
            onClick={() => {
              if (confirm('Arrêter le match maintenant et l’enregistrer tel quel ?')) {
                endMatchNow(match.id);
                go(`detail/${match.id}`, true);
              }
            }}
          >
            Terminer le match maintenant
          </button>
        </Modal>
      )}

      {/* ----------------------------- Fin de set ----------------------------- */}
      {setWinner && (
        <Modal title="Fin du set !" onClose={() => {}}>
          <div className="set-end">
            <span className="big-score">
              {set.scoreUs} – {set.scoreThem}
            </span>
            <p>
              Set {set.index + 1} gagné par <b>{setWinner === 'us' ? match.teamName : match.opponent}</b>
            </p>
            {(() => {
              const nw = { us: w.us + (setWinner === 'us' ? 1 : 0), them: w.them + (setWinner === 'them' ? 1 : 0) };
              return nw.us >= 3 || nw.them >= 3 ? (
                <p className="muted">
                  Match terminé : {nw.us} sets à {nw.them} 🎉
                </p>
              ) : (
                <p className="muted">
                  Sets : {nw.us} – {nw.them}
                </p>
              );
            })()}
          </div>
          <div className="btn-row">
            <button className="btn" onClick={() => undo(match.id)}>
              ↶ Annuler le dernier point
            </button>
            <button
              className="btn primary grow"
              onClick={() => {
                const over = validateSet(match.id);
                if (over) go(`detail/${match.id}`, true);
              }}
            >
              Valider ✓
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const TeamScore = ({
  name,
  score,
  serving,
  onPlus,
  onMinus,
  mine,
}: {
  name: string;
  score: number;
  serving: boolean;
  onPlus: () => void;
  onMinus: () => void;
  mine?: boolean;
}) => (
  <div className={`team-score ${mine ? 'mine' : ''}`}>
    <span className="ts-name">
      {serving && <span className="ball">🏐</span>}
      {name}
    </span>
    <div className="ts-row">
      <button className="score-btn minus" aria-label={`Retirer un point à ${name}`} onClick={onMinus}>
        −
      </button>
      <span className="ts-score">{score}</span>
      <button className="score-btn plus" aria-label={`Point pour ${name}`} onClick={onPlus}>
        +
      </button>
    </div>
  </div>
);

const StatModal = ({
  title,
  autoPoint,
  onClose,
  onStat,
  onSub,
}: {
  title: string;
  autoPoint: boolean;
  onClose: () => void;
  onStat: (cat: StatCategory, code: string) => void;
  onSub: () => void;
}) => {
  const [cat, setCat] = useState<StatCategory | null>(null);
  const meta = CATEGORIES.find((c) => c.value === cat);
  return (
    <Modal title={cat ? `${meta?.label} · ${title}` : title} onClose={onClose}>
      {!cat ? (
        <>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <button key={c.value} className={`cat-btn ${c.value}`} onClick={() => setCat(c.value)}>
                <b>{c.label}</b>
                <small>{c.hint}</small>
              </button>
            ))}
          </div>
          <button className="btn block" onClick={onSub}>
            ⇄ Changement de joueur
          </button>
        </>
      ) : (
        <>
          <div className="type-list">
            {STAT_TYPES[cat].map((t) => (
              <button key={t.code} className={`type-btn ${cat}`} onClick={() => onStat(cat, t.code)}>
                <span>{t.label}</span>
                {autoPoint && t.point && (
                  <small className={t.point === 'us' ? 'c-reussite' : 'c-faute'}>
                    {t.point === 'us' ? '+1 nous' : '+1 adv.'}
                  </small>
                )}
              </button>
            ))}
          </div>
          <button className="btn ghost block" onClick={() => setCat(null)}>
            ‹ Retour
          </button>
        </>
      )}
    </Modal>
  );
};

const SubModal = ({
  match,
  set,
  initialPos,
  subsCount,
  onClose,
  onDone,
}: {
  match: Match;
  set: SetRecord;
  initialPos: number | null;
  subsCount: number;
  onClose: () => void;
  onDone: (msg: string) => void;
}) => {
  const [pos, setPos] = useState<number | null>(initialPos);
  const bench = match.players.filter((p) => !set.lineup.includes(p.id)).sort((a, b) => a.number - b.number);
  const team = getData().teams.find((t) => t.id === match.teamId);
  const absents = (team?.players ?? []).filter((p) => !match.players.some((x) => x.id === p.id));
  const out = pos ? playerById(match.players, set.lineup[pos - 1]) : undefined;

  const doSub = (inId: string) => {
    if (!pos || !out) return;
    const inP = playerById(match.players, inId) ?? absents.find((a) => a.id === inId);
    if (!inP) return;
    const libero = out.poste === 'Libéro' || inP.poste === 'Libéro';
    if (!libero && subsCount >= MAX_SUBS && !confirm(`Déjà ${subsCount} changements dans ce set. Continuer ?`)) return;
    if (!match.players.some((p) => p.id === inId)) updateMatchPlayers(match.id, [...match.players, { ...inP }]);
    substitute(match.id, pos, inId, libero);
    onDone(`${libero ? 'Libéro' : 'Changement'} : ${playerLabel(inP)} ↔ ${playerLabel(out)}`);
  };

  return (
    <Modal title={pos ? `Remplacer ${playerLabel(out)}` : 'Changement : qui sort ?'} onClose={onClose}>
      {!pos ? (
        <Court lineup={set.lineup} players={match.players} serving={set.serving === 'us'} onPlayer={setPos} />
      ) : (
        <>
          <p className="muted small">
            Changements : {subsCount}/{MAX_SUBS} (les remplacements libéro ne comptent pas)
          </p>
          <h4>Qui entre ?</h4>
          {bench.length === 0 && absents.length === 0 && <p className="muted">Personne sur le banc.</p>}
          <div className="player-list">
            {bench.map((p) => (
              <button key={p.id} className="player-row" onClick={() => doSub(p.id)}>
                <span className={`jersey sm ${p.poste === 'Libéro' ? 'libero' : ''}`}>{p.number}</span>
                <span className="grow">{p.name}</span>
                <span className="muted small">{p.poste}</span>
              </button>
            ))}
            {absents.map((p) => (
              <button key={p.id} className="player-row" onClick={() => doSub(p.id)}>
                <span className="jersey sm">{p.number}</span>
                <span className="grow">{p.name}</span>
                <span className="muted small">arrivé en retard</span>
              </button>
            ))}
          </div>
          {!initialPos && (
            <button className="btn ghost block" onClick={() => setPos(null)}>
              ‹ Choisir un autre joueur
            </button>
          )}
        </>
      )}
    </Modal>
  );
};

const TimeoutModal = ({ label, onClose }: { label: string; onClose: () => void }) => {
  const [left, setLeft] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Modal title={label} onClose={onClose}>
      <div className="set-end">
        <span className={`big-score ${left === 0 ? 'c-faute' : ''}`}>{left}s</span>
        <p className="muted">Temps mort enregistré.</p>
      </div>
      <button className="btn primary block" onClick={onClose}>
        Reprendre le jeu
      </button>
    </Modal>
  );
};

const Bench = ({ match, set }: { match: Match; set: SetRecord }) => {
  const bench = match.players.filter((p) => !set.lineup.includes(p.id)).sort((a, b) => a.number - b.number);
  if (!bench.length) return null;
  return (
    <div className="bench">
      <span className="muted small">Banc :</span>
      {bench.map((p) => (
        <span key={p.id} className={`jersey xs ${p.poste === 'Libéro' ? 'libero' : ''}`} title={p.name}>
          {p.number}
        </span>
      ))}
    </div>
  );
};

const RecentLog = ({ match, set }: { match: Match; set: SetRecord }) => {
  type Item = { t: number; text: string; cls: string };
  const items: Item[] = [
    ...set.stats.map((s) => ({
      t: s.t,
      text: `${playerLabel(playerById(match.players, s.playerId))} — ${statType(s.category, s.code)?.label ?? s.code}`,
      cls: `c-${s.category}`,
    })),
    ...set.subs.map((s) => ({
      t: s.t,
      text: `⇄ ${playerLabel(playerById(match.players, s.playerIn))} remplace ${playerLabel(
        playerById(match.players, s.playerOut),
      )} (${s.scoreUs}-${s.scoreThem})`,
      cls: '',
    })),
    ...set.timeouts.map((s) => ({
      t: s.t,
      text: `⏱ Temps mort ${s.side === 'us' ? match.teamName : match.opponent} (${s.scoreUs}-${s.scoreThem})`,
      cls: '',
    })),
  ]
    .sort((a, b) => b.t - a.t)
    .slice(0, 6);
  if (!items.length) return null;
  return (
    <div className="card log">
      <h4>Dernières actions</h4>
      {items.map((i, k) => (
        <div key={k} className={`log-row ${i.cls}`}>
          {i.text}
        </div>
      ))}
    </div>
  );
};
