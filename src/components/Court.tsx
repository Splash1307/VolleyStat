import { posteShort } from '../constants';
import type { PlayerStats } from '../logic';
import type { Player } from '../types';

/** Ordre d'affichage, filet en haut : avant P4 P3 P2, arrière P5 P6 P1 */
const ORDER = [4, 3, 2, 5, 6, 1];

export const Court = ({
  lineup,
  players,
  serving,
  stats,
  onPlayer,
  selectedPosition,
  emptyLabel = '+',
}: {
  lineup: (string | undefined)[];
  players: Player[];
  serving?: boolean;
  stats?: Map<string, PlayerStats>;
  onPlayer?: (position: number) => void;
  selectedPosition?: number | null;
  emptyLabel?: string;
}) => (
  <div className="court">
    <div className="net" aria-hidden="true">
      <span className="post" />
      <span className="antenna" />
      <span className="net-mesh" />
      <span className="antenna" />
      <span className="post" />
    </div>
    <div className="floor">
      <div className="attack-line" aria-hidden="true">
        <span>3 m</span>
      </div>
      {ORDER.map((pos) => {
        const id = lineup[pos - 1];
        const p = id ? players.find((x) => x.id === id) : undefined;
        const front = pos >= 2 && pos <= 4;
        const liberoFront = front && p?.poste === 'Libéro';
        const st = p && stats?.get(p.id);
        const isServer = serving && pos === 1;
        return (
          <button
            key={pos}
            type="button"
            className={[
              'spot',
              front ? 'front' : 'back',
              isServer ? 'server' : '',
              selectedPosition === pos ? 'selected' : '',
              liberoFront ? 'warn' : '',
              p ? '' : 'empty',
            ].join(' ')}
            onClick={() => onPlayer?.(pos)}
            disabled={!onPlayer}
            aria-label={p ? `Poste ${pos} : ${p.number} ${p.name}` : `Poste ${pos} vide`}
          >
            <span className="zone-num" aria-hidden="true">
              {pos}
            </span>
            <span className="token-wrap">
              <span className={`token ${p?.poste === 'Libéro' ? 'libero' : ''}`}>{p ? p.number : emptyLabel}</span>
              {isServer && (
                <span className="serve-ball" title="Au service">
                  🏐
                </span>
              )}
            </span>
            {p && (
              <span className="nameplate">
                {p.name}
                {p.poste && <small>{posteShort(p.poste)}</small>}
              </span>
            )}
            {st && (
              <span className="mini-stats">
                <b className="c-reussite">{st.reussite}</b>
                <b className="c-erreur">{st.erreur}</b>
                <b className="c-faute">{st.faute}</b>
              </span>
            )}
            {liberoFront && <span className="warn-tag">Libéro à l'avant</span>}
          </button>
        );
      })}
    </div>
  </div>
);
